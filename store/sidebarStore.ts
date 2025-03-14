'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SidebarStore } from '@/types/store/sidebar'

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'sidebar-storage',
    }
  )
)
