import type { ChildService } from "./contracts/child-service"
import { AppError } from "./contracts/errors"
import type { Child, CreateChildInput, UpdateChildInput } from "@/types"
import { demoChildren } from "../data/mock/children"

const STORAGE_KEY = "suwadaru_demo_children"

export class MockChildService implements ChildService {
  private getInitialData(): Child[] {
    return [...demoChildren]
  }

  private readStorage(): Child[] {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as unknown
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed as Child[]
          }
        }
      }
    } catch {
      // Storage access or parse failure; fall back to defaults
    }
    const initial = this.getInitialData()
    this.writeStorage(initial)
    return initial
  }

  private writeStorage(children: Child[]): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(children))
      }
    } catch {
      // Storage access might fail in strict sandbox modes
    }
  }

  async list(): Promise<Child[]> {
    await new Promise((resolve) => setTimeout(resolve, 80))
    return this.readStorage()
  }

  async get(childId: string): Promise<Child> {
    await new Promise((resolve) => setTimeout(resolve, 60))
    const trimmedId = childId.trim()
    if (!trimmedId) {
      throw new AppError("not_found", "Child ID is required.")
    }

    const children = this.readStorage()
    const found = children.find((c) => c.id === trimmedId)
    if (!found) {
      throw new AppError(
        "not_found",
        `Child profile with ID "${childId}" was not found.`,
      )
    }

    return found
  }

  async create(input: CreateChildInput): Promise<Child> {
    await new Promise((resolve) => setTimeout(resolve, 150))

    if (!input.name || !input.name.trim()) {
      throw new AppError("validation", "Child name is required.")
    }
    if (!input.dateOfBirth) {
      throw new AppError("validation", "Child date of birth is required.")
    }
    if (input.sex !== "male" && input.sex !== "female") {
      throw new AppError("validation", "Child sex must be 'male' or 'female'.")
    }

    const children = this.readStorage()

    // Generate safe alphanumeric fictional child ID
    const slug = input.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 15)
    const uniqueSuffix = Date.now().toString(36).slice(-4)
    const newId = `child_${slug}_${uniqueSuffix}`

    const newChild: Child = {
      id: newId,
      name: input.name.trim(),
      dateOfBirth: input.dateOfBirth,
      sex: input.sex,
      birthWeightKg: input.birthWeightKg,
      clinicName: input.clinicName?.trim() || undefined,
    }

    const updatedList = [...children, newChild]
    this.writeStorage(updatedList)

    return newChild
  }

  async update(childId: string, input: UpdateChildInput): Promise<Child> {
    await new Promise((resolve) => setTimeout(resolve, 120))

    const children = this.readStorage()
    const index = children.findIndex((c) => c.id === childId)
    if (index === -1) {
      throw new AppError(
        "not_found",
        `Cannot update: Child profile with ID "${childId}" was not found.`,
      )
    }

    const existing = children[index]
    const updated: Child = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      dateOfBirth:
        input.dateOfBirth !== undefined ? input.dateOfBirth : existing.dateOfBirth,
      sex: input.sex !== undefined ? input.sex : existing.sex,
      birthWeightKg:
        input.birthWeightKg !== undefined
          ? input.birthWeightKg ?? undefined
          : existing.birthWeightKg,
      clinicName:
        input.clinicName !== undefined
          ? input.clinicName?.trim() || undefined
          : existing.clinicName,
    }

    const updatedList = [...children]
    updatedList[index] = updated
    this.writeStorage(updatedList)

    return updated
  }

  async resetToDefault(): Promise<void> {
    const initial = this.getInitialData()
    this.writeStorage(initial)
  }
}

export const mockChildService = new MockChildService()
