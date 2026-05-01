'use client'
import { useEffect, useRef, useState } from 'react'

export const useHideOnScroll = (threshold = 60) => {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setHidden(y > threshold && y > lastY.current)
      lastY.current = y
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return hidden
}
