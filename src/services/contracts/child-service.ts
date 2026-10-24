import type { Child, CreateChildInput, UpdateChildInput } from "@/types"

/**
 * Child profile boundary. Throw AppError with code `not_found` when the id
 * is missing. Do not return another child's record.
 */
export interface ChildService {
  list(): Promise<Child[]>
  get(childId: string): Promise<Child>
  create(input: CreateChildInput): Promise<Child>
  update(childId: string, input: UpdateChildInput): Promise<Child>
}
