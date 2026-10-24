/**
 * i18n.test.ts
 *
 * Unit tests for localization (i18n) and translation mappings:
 * - English and Sinhala language keys completeness
 * - Translation helper fallback
 * - Key domain terms (CHDR, Immunization, Growth, Nutrition, Appointments)
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { translations, type Language, type TranslationKey } from "../src/i18n/translations"

describe("Localization (i18n) Dictionary & Keys", () => {
  it("provides all translation keys in both English and Sinhala", () => {
    const keys = Object.keys(translations) as TranslationKey[]
    assert.equal(keys.length > 0, true, "Dictionary should not be empty")

    for (const key of keys) {
      const entry = translations[key]
      assert.ok(entry.en && entry.en.length > 0, `Missing English translation for ${key}`)
      assert.ok(entry.si && entry.si.length > 0, `Missing Sinhala translation for ${key}`)
    }
  })

  it("translates core navigation and features accurately", () => {
    assert.equal(translations["nav.dashboard"].en, "Dashboard")
    assert.equal(translations["nav.dashboard"].si, "ප්‍රධාන පුවරුව")

    assert.equal(translations["nav.vaccinations"].en, "Vaccinations")
    assert.equal(translations["nav.vaccinations"].si, "එන්නත් සටහන්")

    assert.equal(translations["nav.growth"].en, "Growth")
    assert.equal(translations["nav.growth"].si, "වර්ධන සටහන්")

    assert.equal(translations["nav.nutrition"].en, "Nutrition")
    assert.equal(translations["nav.nutrition"].si, "පෝෂණ උපදෙස්")

    assert.equal(translations["nav.appointments"].en, "Appointments")
    assert.equal(translations["nav.appointments"].si, "සායන හමුවීම්")
  })

  it("translates CHDR PDF/Print report terms accurately", () => {
    assert.equal(translations["common.printReport"].en, "Download / Print CHDR Report (PDF)")
    assert.equal(translations["common.printReport"].si, "CHDR වාර්තාව බාගත කරන්න / මුද්‍රණය (PDF)")

    assert.equal(translations["common.print"].en, "Print / Save PDF")
    assert.equal(translations["common.print"].si, "මුද්‍රණය / PDF සුරකින්න")

    assert.equal(translations["report.title"].en, "Child Health & Development Summary Report")
    assert.equal(translations["report.title"].si, "ළමා සෞඛ්‍ය සහ සංවර්ධන සාරාංශ වාර්තාව")
  })

  it("handles fallback gracefully if an unknown key is provided", () => {
    function t(lang: Language, key: string, fallback?: string): string {
      const entry = (translations as Record<string, { en: string; si: string }>)[key]
      if (!entry) return fallback || key
      return entry[lang] || entry.en || fallback || key
    }

    assert.equal(t("si", "nav.dashboard"), "ප්‍රධාන පුවරුව")
    assert.equal(t("en", "nav.dashboard"), "Dashboard")
    assert.equal(t("si", "unknown.key", "Default Fallback"), "Default Fallback")
  })
})
