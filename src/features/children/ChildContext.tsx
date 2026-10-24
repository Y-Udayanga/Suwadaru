import { createContext, useCallback, useMemo, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { childService } from '@/services/children'
import { useAuth } from '@/features/auth/useAuth'
import { useLiveRecords } from '@/hooks/useLiveRecords'
import type { Child, CreateChildInput, UpdateChildInput } from '@/types'
const tables = ['children','child_caregivers']
export interface ChildContextValue {
  children: Child[]; selectedChildId: string | null; selectedChild: Child | null
  isLoading: boolean; error: string | null
  selectChild: (id: string, navigateToChild?: boolean) => void
  addChild: (input: CreateChildInput) => Promise<Child>
  updateChild: (id: string, input: UpdateChildInput) => Promise<Child>
  refreshChildren: () => Promise<void>
}
export const ChildContext = createContext<ChildContextValue | null>(null)
export function ChildProvider({ children }: {children: ReactNode}) {
  const {session} = useAuth()
  return <AccountChildren key={session?.caregiverId ?? 'signed-out'} userId={session?.caregiverId}>{children}</AccountChildren>
}
function AccountChildren({children,userId}: {children:ReactNode;userId?:string}) {
  const location = useLocation(); const navigate = useNavigate()
  const load = useCallback(() => userId ? childService.list() : Promise.resolve([]), [userId])
  const {data,error,loading,refresh} = useLiveRecords(load,tables)
  const list = useMemo(() => data ?? [], [data])
  const routeId = location.pathname.match(/^\/children\/([^/]+)/)?.[1]
  const selectedChild = list.find(c=>c.id === routeId) ?? list[0] ?? null
  const selectChild = (id:string, go=true) => {
    if (go) { const suffix = location.pathname.match(/^\/children\/[^/]+(\/(?:vaccinations|growth|nutrition|appointments))?$/)?.[1] ?? ''; void navigate('/children/'+encodeURIComponent(id)+suffix) }
  }
  const addChild = async (input:CreateChildInput) => { const child = await childService.create(input); await refresh(); return child }
  const updateChild = async (id:string,input:UpdateChildInput) => { const child=await childService.update(id,input); await refresh(); return child }
  return <ChildContext.Provider value={{children:list,selectedChildId:selectedChild?.id ?? null,selectedChild,isLoading:loading,error,selectChild,addChild,updateChild,refreshChildren:refresh}}>{children}</ChildContext.Provider>
}
