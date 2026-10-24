import { createContext, useContext } from "react"
import { translations, type Language, type TranslationKey } from "@/i18n/translations"

export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (key: TranslationKey, fallback?: string) => string
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

export { translations }
export type { Language, TranslationKey }
