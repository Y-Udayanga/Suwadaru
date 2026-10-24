import { supabase } from '@/utils/supabase'
import { AppError } from './contracts/errors'

export function database() {
  if (!supabase) throw new AppError('unavailable', 'Database access is not configured.')
  return supabase
}
export function check(error: { code?: string; message: string } | null) {
  if (!error) return
  if (error.code === '23505') throw new AppError('validation', 'This record already exists. Edit the existing record instead.')
  if (error.code?.startsWith('22') || error.code?.startsWith('23'))
    throw new AppError('validation', 'Check the date and values. Health records must be dated between birth and today.')
  if (error.code === '42501' || error.code === 'PGRST116')
    throw new AppError('not_found', 'This record is unavailable or you do not have permission to change it.')
  throw new AppError('unavailable', 'Could not save or load records. Check your connection and retry.')
}

/** Page through every authorized row rather than silently stopping at the API cap. */
export async function listRows<T>(table: string, childId?: string): Promise<T[]> {
  const rows: T[] = []
  for (let offset = 0; ; offset += 500) {
    let query = database().from(table).select('*').order('created_at').order('id').range(offset, offset + 499)
    if (childId) query = query.eq('child_id', childId)
    const { data, error } = await query
    check(error)
    rows.push(...(data ?? []) as T[])
    if (!data || data.length < 500) return rows
  }
}
