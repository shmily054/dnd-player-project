import type { ReactNode } from 'react'

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const toks = String(query || '')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .sort((a, b) => b.length - a.length)
  if (!toks.length || !text) return text
  const re = new RegExp(`(${toks.map(escapeRe).join('|')})`, 'gi')
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) => {
        const hit = toks.some((t) => part.toLowerCase() === t.toLowerCase())
        return hit ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
      })}
    </>
  )
}
