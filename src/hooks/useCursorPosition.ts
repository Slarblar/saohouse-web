import { useState, useEffect } from 'react'

interface CursorPosition {
  x: number
  y: number
  normalizedX: number
  normalizedY: number
}

export const useCursorPosition = (): CursorPosition => {
  const [position, setPosition] = useState<CursorPosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
  })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX
      const y = event.clientY
      const normalizedX = (x / window.innerWidth) * 2 - 1
      const normalizedY = -(y / window.innerHeight) * 2 + 1

      setPosition({
        x,
        y,
        normalizedX,
        normalizedY,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return position
} 