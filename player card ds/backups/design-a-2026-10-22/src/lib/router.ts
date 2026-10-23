import { useCallback, useEffect, useState } from 'react'

export function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const navigate = useCallback((next: string) => {
    if (window.location.hash === next) return
    window.location.hash = next
  }, [])
  return { hash, navigate }
}

export function parseRoute(hash: string) {
  const h = hash.replace(/^#\/?/, '')
  const [page, ...rest] = h.split('/').filter(Boolean)
  return { page: page || 'char', rest }
}
