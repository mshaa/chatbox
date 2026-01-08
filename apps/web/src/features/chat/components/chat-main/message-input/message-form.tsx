'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRoomStore } from '@/features/chat/stores/room.store'
import { Send } from 'lucide-react'
import React, { memo, useEffect } from 'react'

interface MessageFormProps {
  onSubmit: (content: string) => void
  placeholder?: string
}

export const MessageForm = memo(function MessageForm({ onSubmit, placeholder = 'Type a message...' }: MessageFormProps) {
  const [content, setContent] = React.useState('')
  const activeRoom = useRoomStore(s => s.activeRoom)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (trimmed) {
      onSubmit(trimmed)
      setContent('')
    }
  }

  useEffect(() => {
    setContent('')
  }, [activeRoom])

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          className="pr-16"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          data-testid="message-input"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer"
          aria-label="Send message"
          data-testid="message-submit"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
})
