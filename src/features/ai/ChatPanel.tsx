import { useState } from 'react'
import { AiChat } from '@/components/ai/AiChat'
import { Button } from '@/components/ui/button'

export function ChatPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section
          id="floating-ai-assistant"
          aria-label="SuwaDaru AI assistant"
          className="mb-3 max-h-[75vh] w-[min(28rem,calc(100vw-2.5rem))] overflow-y-auto rounded-2xl border bg-background p-4 shadow-xl"
        >
          <AiChat />
        </section>
      )}
      <Button
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        aria-controls={open ? 'floating-ai-assistant' : undefined}
      >
        {open ? 'Close assistant' : 'Ask SuwaDaru AI'}
      </Button>
    </div>
  )
}
