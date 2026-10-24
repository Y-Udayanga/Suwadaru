import { useEffect, useState, type ReactNode } from "react"
import {
  LanguageContext,
  translations,
  type Language,
  type TranslationKey,
} from "@/hooks/useLanguage"

const LANG_STORAGE_KEY = "suwadaru-lang"

export function LanguageProvider({
  children,
  defaultLanguage = "en",
}: {
  children: ReactNode
  defaultLanguage?: Language
}) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return defaultLanguage
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as Language | null
      if (stored === "en" || stored === "si") {
        return stored
      }
    } catch {
      // Ignore storage errors
    }
    return defaultLanguage
  })

  useEffect(() => {
    if (typeof document === "undefined") return
    document.documentElement.lang = language === "si" ? "si" : "en"
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang)
    } catch {
      // Ignore storage errors
    }
  }

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "si" : "en")
  }

  const t = (key: TranslationKey, fallback?: string): string => {
    const entry = translations[key]
    if (!entry) return fallback || key
    return entry[language] || entry.en || fallback || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
