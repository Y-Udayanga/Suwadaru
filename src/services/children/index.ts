import { supabase } from '../../utils/supabase'
import { createChildService } from './child-service'

export const childService = createChildService(supabase)
export const { createChild, getMyChildren, getChildById, updateChild } = childService
export { createChildService } from './child-service'
export type { ConnectedChildService } from './child-service'
