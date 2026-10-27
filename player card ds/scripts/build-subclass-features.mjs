#!/usr/bin/env node
/**
 * 生成 2024 版子职业成长表：shared/subclass-features.json
 *
 * 数据来源是规则库索引（buildCompendium 解析出的 classFeature 条目），
 * 因此每次规则库重建后都应与 build-compendium 一起重新生成：
 *   node scripts/build-compendium.mjs && node scripts/build-subclass-features.mjs
 *
 * 产物结构：
 *   { version, generatedAt, source, classes: {
 *       [职业]: { label: '神圣誓言', subclasses: {
 *         [子职]: { en, features: [{ level, name, en? }] } } } }, missing: [] }
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCompendium, ROOT, PARSER_VERSION } from './build-compendium.mjs'

const SHARED = path.resolve(ROOT, 'shared')
const DEFAULT_DB = path.resolve(ROOT, '..', 'database')

/** 规则库用 2024 译名，角色卡 shared/classes.json 仍沿用旧译名，这里做对齐 */
const SHEET_CLASS_ALIAS = { 魔契师: '邪术师' }
const sheetClassName = (name) => SHEET_CLASS_ALIAS[name] || name

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/** 从规则库索引 + 子职业登记表生成成长表（纯函数，便于测试） */
export function buildSubclassFeatures(dbDir = DEFAULT_DB) {
  const registry = readJson(path.join(SHARED, 'subclasses.json'))
  const data = buildCompendium(dbDir)
  const features = data.entries.filter((e) => e.type === 'classFeature' && e.featureKind === 'feature' && e.subclass)
  const classes = {}
  const missing = []
  // 保持登记表的章节顺序，便于 UI 按书内顺序展示
  const defs = (registry.subclasses || []).slice()
  for (const def of defs) {
    const key = sheetClassName(def.className)
    const cls = (classes[key] ||= { label: def.label || '', subclasses: {} })
    if (!cls.label && def.label) cls.label = def.label
    const own = features
      .filter((e) => e.className === def.className && e.subclass === def.name)
      .sort((a, b) => (a.level || 0) - (b.level || 0) || a.name.localeCompare(b.name, 'zh'))
      .map((e) => ({ level: e.level, name: e.name, ...(e.en ? { en: e.en } : {}) }))
    if (!own.length) {
      missing.push(`${def.className}·${def.label || '子职业'}·${def.name}`)
      continue
    }
    cls.subclasses[def.name] = { en: def.en || '', features: own }
  }
  return {
    version: 1,
    parserVersion: PARSER_VERSION,
    generatedAt: new Date().toISOString(),
    source: registry.book || '玩家手册 2024',
    classes,
    missing,
  }
}

export function writeSubclassFeatures(file = path.join(SHARED, 'subclass-features.json'), dbDir = DEFAULT_DB) {
  const data = buildSubclassFeatures(dbDir)
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  return data
}

function main() {
  const data = writeSubclassFeatures()
  const subCount = Object.values(data.classes).reduce((n, c) => n + Object.keys(c.subclasses).length, 0)
  const featCount = Object.values(data.classes).reduce(
    (n, c) => n + Object.values(c.subclasses).reduce((m, s) => m + s.features.length, 0), 0,
  )
  console.log(`[subclass-features] 已生成：${Object.keys(data.classes).length} 个职业 / ${subCount} 个子职 / ${featCount} 条子职特性`)
  if (data.missing.length) {
    console.log('[subclass-features] 警告：以下子职没有解析到特性：')
    for (const m of data.missing) console.log('  -', m)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
