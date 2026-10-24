import type { SupabaseClient } from '@supabase/supabase-js'
import type { Child, CreateChildInput, UpdateChildInput } from '../../types/child'
import type { ChildService } from '../contracts/child-service'
import { AppError } from '../contracts/errors'
import type { ChildDatabase, ChildPatch, ChildRow } from './database'

export interface ConnectedChildService extends ChildService {
  createChild(input: CreateChildInput): Promise<Child>
  getMyChildren(): Promise<Child[]>
  getChildById(childId: string): Promise<Child>
  updateChild(childId: string, input: UpdateChildInput): Promise<Child>
}

function invalid(message: string): never { throw new AppError('validation', message) }
function text(value: unknown, field: string): string {
  if (typeof value !== 'string') return invalid(`Enter a valid ${field}.`)
  const trimmed = value.trim()
  if (!trimmed || [...trimmed].length > 200 || /\p{Cc}/u.test(trimmed))
    return invalid(`Enter a ${field} using 1–200 characters without control characters.`)
  return trimmed
}

/** Compare calendar components; never parse a birthdate as a JS timestamp. */
function birthdate(value: unknown, now: Date): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return invalid('Use YYYY-MM-DD for the date of birth.')
  const [year, month, day] = value.split('-').map(Number)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const part = (key: string) => parts.find(p => p.type === key)!.value
  const today = `${part('year')}-${part('month')}-${part('day')}`
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1] || value > today)
    return invalid('Enter a real date of birth that is not in the future.')
  return value
}

function validate(input: CreateChildInput | UpdateChildInput, create: boolean, now: Date): ChildPatch {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return invalid('Enter child information.')
  const allowed = ['name', 'dateOfBirth', 'sex', 'birthWeightKg', 'clinicName']
  if (Object.keys(input).some(key => !allowed.includes(key))) return invalid('Unsupported child field.')
  const patch: ChildPatch = {}
  if (create || input.name !== undefined) patch.name = text(input.name, 'name')
  if (create || input.dateOfBirth !== undefined) patch.date_of_birth = birthdate(input.dateOfBirth, now)
  if (create || input.sex !== undefined) {
    if (input.sex !== 'male' && input.sex !== 'female') return invalid('Select male or female.')
    patch.sex = input.sex
  }
  if (input.birthWeightKg !== undefined) {
    if (input.birthWeightKg !== null && (typeof input.birthWeightKg !== 'number' ||
      !Number.isFinite(input.birthWeightKg) || input.birthWeightKg <= 0))
      return invalid('Birth weight must be a positive, finite number in kilograms.')
    patch.birth_weight_kg = input.birthWeightKg
  }
  if (input.clinicName !== undefined)
    patch.clinic_name = input.clinicName === null ? null : text(input.clinicName, 'clinic name')
  if (!create && !Object.keys(patch).length) return invalid('Provide at least one field to update.')
  return patch
}

function child(row: ChildRow): Child {
  return {
    id: row.id, name: row.name, dateOfBirth: row.date_of_birth, sex: row.sex,
    ...(row.birth_weight_kg === null ? {} : { birthWeightKg: row.birth_weight_kg }),
    ...(row.clinic_name === null ? {} : { clinicName: row.clinic_name }),
  }
}
function id(value: string): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
    return invalid('Select a valid child profile.')
  return value
}
function safeError(error: unknown): AppError {
  if (error instanceof AppError) return error
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null
  if (code === 'PGRST301' || code === 'PGRST302' || code === 'bad_jwt' || code === 'session_not_found')
    return new AppError('unauthenticated', 'Sign in to manage child profiles.')
  if (code === '42501' || code === 'PGRST116')
    return new AppError('not_found', 'Child profile was not found or is not accessible.')
  if (typeof code === 'string' && (code.startsWith('22') || code === '23514' || code === '23502'))
    return new AppError('validation', 'Check the child information and try again.')
  return new AppError('unavailable', 'Child profiles are unavailable. Please try again.')
}

/** Uses the existing client/session. RLS, not this adapter, authorizes every row. */
export function createChildService(client: SupabaseClient | null, now = () => new Date()): ConnectedChildService {
  async function run<T>(operation: (db: SupabaseClient<ChildDatabase>) => Promise<T>): Promise<T> {
    try {
      if (!client) throw new AppError('unavailable', 'Child profiles are not configured.')
      const { data, error } = await client.auth.getUser()
      if (error) {
        if (error.name === 'AuthSessionMissingError' || error.status === 401 || error.status === 403)
          throw new AppError('unauthenticated', 'Sign in to manage child profiles.')
        throw error
      }
      if (!data.user) throw new AppError('unauthenticated', 'Sign in to manage child profiles.')
      return await operation(client as SupabaseClient<ChildDatabase>)
    } catch (error) { throw safeError(error) }
  }
  const fields = 'id,name,date_of_birth,sex,birth_weight_kg,clinic_name,created_by,created_at,updated_at'
  const getMyChildren = () => run(async db => {
    const { data, error } = await db.from('children').select(fields).order('created_at').order('id')
    if (error) throw error
    return data.map(child)
  })
  const getChildById = (childId: string) => run(async db => {
    const { data, error } = await db.from('children').select(fields).eq('id', id(childId)).single()
    if (error) throw error
    return child(data)
  })
  const createChild = (input: CreateChildInput) => run(async db => {
    const patch = validate(input, true, now())
    const { data, error } = await db.rpc('create_child', {
      p_name: patch.name!, p_date_of_birth: patch.date_of_birth!, p_sex: patch.sex!,
      p_birth_weight_kg: patch.birth_weight_kg ?? null, p_clinic_name: patch.clinic_name ?? null,
    })
    if (error) throw error
    return child(data)
  })
  const updateChild = (childId: string, input: UpdateChildInput) => run(async db => {
    const patch = validate(input, false, now())
    const { data, error } = await db.from('children').update(patch).eq('id', id(childId)).select(fields).single()
    if (error) throw error
    return child(data)
  })
  return { createChild, getMyChildren, getChildById, updateChild,
    create: createChild, list: getMyChildren, get: getChildById, update: updateChild }
}
