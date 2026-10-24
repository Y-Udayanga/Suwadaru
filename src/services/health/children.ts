import { childService } from '@/services/children'

// Compatibility exports for callers from the parallel backend branch.
// Use the same authorized, validated service as the realtime screens.
export const listCaregiverChildren = () => childService.list()
export const getCaregiverChild = childService.get
export const createCaregiverChild = childService.create
export const updateCaregiverChild = childService.update
