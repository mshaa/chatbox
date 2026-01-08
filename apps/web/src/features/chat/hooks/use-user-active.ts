import { useEffect, useRef, useState } from 'react'

/**
 * Tracks whether the user is actively viewing the page.
 * Active = document visible (tab active) AND window focused (browser is foreground app)
 *
 * @param onReturn - Optional callback fired when user returns from being inactive
 * @returns isUserActive - true when user is viewing the page
 */
export function useUserActive(onReturn?: () => void) {
  const [isDocumentVisible, setIsDocumentVisible] = useState(true)
  const [isWindowFocused, setIsWindowFocused] = useState(true)

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === 'visible')
    }
    const onFocus = () => setIsWindowFocused(true)
    const onBlur = () => setIsWindowFocused(false)

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  const isUserActive = isDocumentVisible && isWindowFocused
  const wasActiveRef = useRef(isUserActive)

  useEffect(() => {
    if (isUserActive && !wasActiveRef.current) {
      onReturn?.()
    }
    wasActiveRef.current = isUserActive
  }, [isUserActive, onReturn])

  return isUserActive
}
