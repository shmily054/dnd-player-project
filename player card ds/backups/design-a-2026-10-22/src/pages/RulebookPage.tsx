import { useEffect, useState } from 'react'
import { BookOpen, Database, FileText } from 'lucide-react'
import type { Character, MetaResponse, SearchResult } from '@/types'
import { api } from '@/lib/api'
import { CompendiumExplorer } from '@/components/CompendiumExplorer'
import { Badge, Panel } from '@/components/ui'

export function RulebookPage({
  character, onOpenSearch, onInsert,
}: {
  character: Character | null
  onOpenSearch: (type: string, query?: string) => void
  onInsert?: (r: SearchResult) => void
}) {
  const [meta, setMeta] = useState<MetaResponse | null>(null)
  useEffect(() => {
    api.meta().then(setMeta).catch(() => {})
  }, [])
  return (
    <div className="page-wrap">
      <Panel
        title={<><BookOpen size={17} /> 规则库</>}
        subtitle="玩家手册 + 城主指南全文检索；结构化条目可直接加入角色卡"
        actions={
          meta ? (
            <>
              <Badge tone="gold"><Database size={11} /> {meta.counts.all} 条结构化</Badge>
              <Badge><FileText size={11} /> {meta.counts.raw} 个原文文件</Badge>
            </>
          ) : null
        }
      >
        <CompendiumExplorer
          mode="page"
          character={character}
          onInsert={character ? onInsert : undefined}
          onOpenSearch={onOpenSearch}
          autoFocus
        />
      </Panel>
      <p className="hint" style={{ marginTop: 10, paddingLeft: 4 }}>
        PDF 页码来自原书提取，非印刷页码。结构化字段有解析失败风险时，以原文与页码为准。
      </p>
    </div>
  )
}
