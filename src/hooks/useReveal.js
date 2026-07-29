import { useEffect, useRef, useState } from 'react'

/**
 * Reveals an element once it scrolls into view. Returns [ref, shown].
 * Under prefers-reduced-motion it resolves immediately so nothing is
 * gated behind an animation that never plays.
 */
export function useReveal({ threshold = 0.08 } = {}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return [ref, shown]
}
