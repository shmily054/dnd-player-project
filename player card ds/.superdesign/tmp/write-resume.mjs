import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const contextFiles = [
  '.superdesign/design-system.md',
  '.superdesign/tmp/styles-1.css',
  '.superdesign/tmp/styles-2.css',
  'src/components/ui.tsx',
  'src/pages/CharacterPage.tsx',
  'src/App.tsx:380:440',
  'src/components/SheetHero.tsx:66:174',
  'src/components/AbilitiesPanel.tsx:44:133',
  'src/components/CombatPanel.tsx:40:186',
  'src/components/AttackPanel.tsx:37:101',
  'src/components/SpellsPanel.tsx:76:268',
  'src/components/ResourcesPanel.tsx:18:65',
  'src/components/InventoryPanel.tsx:28:118',
  'src/components/FeaturesPanel.tsx:43:129',
  'src/components/RoleplayPanel.tsx:11:42',
  'src/components/AuditPanel.tsx:16:55',
]

const underlying = new Set()
for (const entry of contextFiles) {
  underlying.add(entry.replace(/:\d+(?::\d+)?$/, ''))
}

const fingerprints = {}
for (const rel of underlying) {
  const full = path.resolve(rel)
  const hash = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex')
  fingerprints[rel] = hash
}

const state = {
  schemaVersion: 1,
  targets: {
    'character-sheet': {
      targetKind: 'existing-ui',
      projectId: '2ac28d3e-2fd1-446b-929e-c4eb16d4dd50',
      baselineDraftId: 'a814af88-9b5a-48db-9178-dd69847d6f9b',
      activeDraftId: 'a814af88-9b5a-48db-9178-dd69847d6f9b',
      designSystemPath: '.superdesign/design-system.md',
      referenceIds: [
        'a1c02dbf-c267-4c8e-9102-a2439b9fd509',
        '9a7b9a45-e25f-4fa2-adaa-fcc51ec12e5a',
        '435bf20e-c3fb-4b5c-a500-be02d75bd02a',
      ],
      contextFiles,
      fingerprints,
      components: [
        {
          name: 'TopBar',
          id: '3ff06d05-48af-4a82-9b12-53d0ebe51e7d',
          sourcePath: 'src/App.tsx',
        },
        {
          name: 'MobileNav',
          id: 'ab1f046a-94ad-4341-8718-bad0c215f73b',
          sourcePath: 'src/App.tsx',
        },
      ],
      drafts: {
        'a814af88-9b5a-48db-9178-dd69847d6f9b': {
          title: 'Adventurer Ledger Baseline',
          visualDirection: 'current-state pixel reproduction (imported live DOM)',
          parentDraftId: null,
          currentVersion: 3,
        },
      },
      updatedAt: new Date().toISOString(),
    },
  },
}

fs.writeFileSync('.superdesign/resume.json', JSON.stringify(state, null, 2) + '\n', 'utf8')
console.log(`wrote .superdesign/resume.json — ${Object.keys(fingerprints).length} fingerprints`)
