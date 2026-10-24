/**
 * Regenerates the TypeScript tables from the official WHO workbooks.
 * Run from the repository root: node scripts/extract-who-weight-for-age.mjs
 * The unit test parses the workbooks independently and must still match.
 */
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"

const root = process.cwd()
const dataDir = path.join(root, "src/domain/health/growth/data/who")

function unzip(buffer) {
  const files = new Map()
  let offset = 0
  while (offset + 30 < buffer.length) {
    const signature = buffer.readUInt32LE(offset)
    if (signature !== 0x04034b50) break
    const method = buffer.readUInt16LE(offset + 8)
    const compressedSize = buffer.readUInt32LE(offset + 18)
    const nameLength = buffer.readUInt16LE(offset + 26)
    const extraLength = buffer.readUInt16LE(offset + 28)
    const nameStart = offset + 30
    const name = buffer.toString("utf8", nameStart, nameStart + nameLength)
    const dataStart = nameStart + nameLength + extraLength
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize)
    files.set(name, method === 0 ? compressed : zlib.inflateRawSync(compressed))
    offset = dataStart + compressedSize
  }
  return files
}

function sharedStrings(xml) {
  return [...xml.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((match) => match[1])
}

function rowsOf(xml) {
  return [...xml.matchAll(/<row[^>]*>(.*?)<\/row>/g)].map((row) =>
    [...row[1].matchAll(/<c [^>]*r="([A-Z]+)\d+"([^>]*)>(?:<v>([^<]*)<\/v>)?/g)].map(
      (cell) => ({
        column: cell[1],
        shared: cell[2].includes('t="s"'),
        raw: cell[3] ?? "",
      }),
    ),
  )
}

function extract(fileName) {
  const bytes = fs.readFileSync(path.join(dataDir, fileName))
  const files = unzip(bytes)
  const shared = sharedStrings(files.get("xl/sharedStrings.xml").toString("utf8"))
  const rows = rowsOf(files.get("xl/worksheets/sheet1.xml").toString("utf8"))
  const header = rows[0].map((cell) => shared[Number(cell.raw)])
  const index = Object.fromEntries(header.map((name, position) => [name, position]))
  const table = {
    l: [],
    m: [],
    s: [],
    sdMinus2Kg: [],
    sdMinus1Kg: [],
    medianKg: [],
    sdPlus1Kg: [],
    sdPlus2Kg: [],
  }
  rows.slice(1).forEach((row, day) => {
    const value = (name) => Number(row[index[name]].raw)
    if (value("Day") !== day) {
      throw new Error(`${fileName} day ${day} is not contiguous`)
    }
    table.l.push(value("L"))
    table.m.push(value("M"))
    table.s.push(value("S"))
    table.sdMinus2Kg.push(value("SD2neg"))
    table.sdMinus1Kg.push(value("SD1neg"))
    table.medianKg.push(value("SD0"))
    table.sdPlus1Kg.push(value("SD1"))
    table.sdPlus2Kg.push(value("SD2"))
  })
  return {
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    table,
  }
}

function emit(exportName, table) {
  const columns = Object.entries(table)
    .map(([key, values]) => `  ${key}: [${values.join(",")}]`)
    .join(",\n")
  return `export const ${exportName}: WhoWeightForAgeColumns = {\n${columns},\n}\n`
}

const boys = extract("wfa-boys-zscore-expanded-tables.xlsx")
const girls = extract("wfa-girls-zscore-expanded-tables.xlsx")
const banner = `/* Generated from the official WHO workbooks in this directory.
 * Boys sha256 ${boys.sha256}
 * Girls sha256 ${girls.sha256}
 * Do not edit by hand.
 */
export interface WhoWeightForAgeColumns {
  l: number[]
  m: number[]
  s: number[]
  sdMinus2Kg: number[]
  sdMinus1Kg: number[]
  medianKg: number[]
  sdPlus1Kg: number[]
  sdPlus2Kg: number[]
}

`
fs.writeFileSync(
  path.join(dataDir, "wfa-tables.generated.ts"),
  banner + emit("wfaBoysTable", boys.table) + "\n" + emit("wfaGirlsTable", girls.table),
)
console.log("wrote tables", boys.table.l.length, girls.table.l.length)
