import * as React from 'react'

type UseResizableSidebarProps = {
  defaultHeight?: number
  minHeight?: number
  maxHeight?: number
}

export function useResizableSidebar({
  defaultHeight = 50,
  minHeight = 20,
  maxHeight = 80,
}: UseResizableSidebarProps = {}) {
  const [topSectionHeight, setTopSectionHeight] = React.useState<number>(defaultHeight)
  const [isDragging, setIsDragging] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const containerHeight = containerRect.height

      // Calculate position relative to container
      const relativeY = e.clientY - containerRect.top

      // Convert to percentage
      const rawPercentage = (relativeY / containerHeight) * 100

      // Clamp between min and max
      const percentage = Math.min(Math.max(rawPercentage, minHeight), maxHeight)

      setTopSectionHeight(percentage)
    },
    [isDragging, minHeight, maxHeight],
  )

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false)
  }, [])

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      // Add a class to body to prevent text selection while dragging
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'row-resize'
    } else {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return {
    topSectionHeight,
    isDragging,
    containerRef,
    handleMouseDown,
  }
}
