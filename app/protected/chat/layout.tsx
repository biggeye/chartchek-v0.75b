'use client'

import { ReactNode } from 'react'
import { ThreadList } from '@/components/chat/ThreadList'
import { GlobalChatInputArea } from '@/components/chat/GlobalChatInput'
import { Bars3Icon } from '@heroicons/react/24/solid'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

interface ChatLayoutProps {
  children: ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex-1 px-2 overflow-hidden">
        {children}
      </div>
      
      {/* Mobile/Tablet menu button */}
      <div className="xl:hidden fixed right-4 top-20 z-10">
        <Dialog>
          <DialogTrigger asChild>
            <button className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
              <Bars3Icon className="h-6 w-6 text-primary" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[80vw] h-[80vh] max-h-[80vh] p-0 border-none">
            <div className="w-full h-full p-6 overflow-y-auto">
              <ThreadList />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Right sidebar with ThreadList - only visible on desktop */}
      <aside className="hidden xl:block w-80 shrink-0 p-6 border-l border-border bg-card overflow-hidden">
        <ThreadList />
      </aside>
      
      {/* Chat Input Area */}
      <GlobalChatInputArea />
    </div>
  )
}
