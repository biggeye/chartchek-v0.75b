'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from '@headlessui/react'
import {
  Bars3Icon,
  BellIcon,
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, MagnifyingGlassIcon, UserCircleIcon, ChatBubbleLeftIcon } from '@heroicons/react/20/solid'

import { ThreadList } from '@/components/chat/ThreadList'
import { AssistantSelector } from '@/components/chat/AssistantSelector'

import { signOutAction } from "@/app/actions";
import { ThemeSwitcher } from "@/components/theme-switcher";



const navigation = [
  { name: 'Chat', href: '/protected/chat', icon: HomeIcon, current: true },
  { name: 'Assistants', href: '/protected/assistants', icon: UsersIcon, current: false },
  { name: 'Documents', href: '/protected/documents', icon: DocumentDuplicateIcon, current: false },
  { name: 'Facilities', href: '/protected/facilities', icon: ChartPieIcon, current: false },
]
const userNavigation = [
  { name: 'Your profile', href: '/protected/account' },
  // for the Sign Out below, we have an action exported from "/actions.ts:  signOutAction, lets make this work in an api route"
  { name: 'Sign out', href: '', action: signOutAction },  // this doesnt appear to be working
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threadListOpen, setThreadListOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  let asideContent;
  switch (pathname) {
    case '/protected/chat':
      asideContent = (
   
          <ThreadList />
  
      );
      break;
    default:
      asideContent = null; // or some default component
  }
  return (
    <>
      <div>
        <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                  <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                  </button>
                </div>
              </TransitionChild>

              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-2 ring-1 ring-white/10">
                <div className="flex h-16 shrink-0 items-center">
                  <img
                    alt="ChartChek"
                    src="/logo.svg"
                    className="h-8 w-auto"
                  />
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="-mx-2 flex-1 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={classNames(
                            item.current
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                          )}
                        >
                          <item.icon aria-hidden="true" className="size-6 shrink-0" />
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="flex justify-center pb-4">
          <ThemeSwitcher />
        </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-20 lg:overflow-y-auto lg:bg-gray-900 lg:pb-4">
          <div className="flex h-16 shrink-0 items-center justify-center">
            <img
              alt="ChartChek"
              src="/logo.svg"
              className="h-8 w-auto"
            />
          </div>
          <nav className="mt-8">
            <ul role="list" className="flex flex-col items-center space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={classNames(
                      item.current ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                      'group flex gap-x-3 rounded-md p-3 text-sm/6 font-semibold',
                    )}
                  >
                    <item.icon aria-hidden="true" className="size-6 shrink-0" />
                    <span className="sr-only">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex justify-center pb-4">
          <ThemeSwitcher />
        </div>
        </div>

        <div className="lg:pl-20 overflow-hidden">
          <div className="sticky top-0 z-40 flex h-10 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8 justify-between">
            <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-700 lg:hidden">
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>

            <div className="flex-grow flex justify-center items-center">
              <AssistantSelector />
              <button 
                onClick={() => setThreadListOpen(true)} 
                className="ml-2 text-gray-400 hover:text-gray-500 xl:hidden"
              >
                <ChatBubbleLeftIcon className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                <span className="sr-only">View notifications</span>
                <BellIcon aria-hidden="true" className="size-6" />
              </button>

              {/* Separator */}
              <div aria-hidden="true" className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10" />

              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <MenuButton className="-m-1.5 flex items-center p-1.5">
                  <span className="sr-only">Open user menu</span>
                  <UserCircleIcon
                    className="size-8 text-gray-400"
                    aria-hidden="true"
                  />
                  <span className="hidden lg:flex lg:items-center">
                    <span aria-hidden="true" className="ml-4 text-sm/6 font-semibold text-gray-900"></span>
                    <ChevronDownIcon aria-hidden="true" className="ml-2 size-5 text-gray-400" />
                  </span>
                </MenuButton>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 ring-1 shadow-lg ring-gray-900/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  {userNavigation.map((item) => (
                    <MenuItem key={item.name}>
                      <a
                        href={item.href}
                        className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                      >
                        {item.name}
                      </a>
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            </div>
          </div>

          <main className="xl:pl-96 min-h-[calc(100vh-10rem)] overflow-hidden">
         
              {children}

          </main>
        </div>

        <aside className="fixed top-16 bottom-0 left-20 hidden w-96 overflow-y-auto border-r border-gray-200 px-4 py-6 sm:px-6 lg:px-8 xl:block bg-white">
          {asideContent}
        </aside>
      </div>

      <Dialog open={threadListOpen} onClose={() => setThreadListOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear" />
        <DialogPanel className="fixed inset-0 flex justify-center items-center">
          <div className="bg-white rounded-lg p-4 w-full max-w-3xl">
            <button onClick={() => setThreadListOpen(false)} className="absolute top-2 right-2">
              <XMarkIcon className="size-6 text-gray-400" aria-hidden="true" />
            </button>
            <ThreadList />
          </div>
        </DialogPanel>
      </Dialog>
    </>
  )
}