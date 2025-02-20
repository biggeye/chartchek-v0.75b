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
import { ShieldCheckIcon, CreditCardIcon, BuildingOffice2Icon, ChatBubbleLeftIcon } from '@heroicons/react/20/solid'

import { ThreadList } from '@/components/chat/ThreadList'
import { useClientStore } from '@/store/clientStore';
 import UserStats from '@/components/user-stats';
import Modal from '@/components/modal';
import DropdownMenu from '@/components/dropdown-menu';

import { signOutAction } from "@/app/actions";
import { ThemeSwitcher } from "@/components/theme-switcher";

const user = useClientStore.getState().userId;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threadListOpen, setThreadListOpen] = useState(false);
  const [isThreadListModalOpen, setThreadListModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const currentThreadTitle = useClientStore.getState().currentThreadTitle;
  const navigation = [
    { name: 'Compliance', href: '/protected/compliance', icon: ShieldCheckIcon },
    { name: 'Accounts & Billing', href: '/protected/billing', icon: CreditCardIcon },
    { name: 'Documents', href: '/protected/documents', icon: DocumentDuplicateIcon },
    { name: 'Facilities', href: '/protected/facilities', icon: BuildingOffice2Icon },
  ].map(item => ({
    ...item,
    current: pathname === item.href
  }));

  const userNavigation = [
    { label: 'Chat History', onClick:  () => setThreadListModalOpen(true) },
    { label: 'Your profile', onClick: () => router.push(`/protected/account/${user}`)},
    { label: 'Sign out', onClick: async () => await signOutAction() },
  ]

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }

  let asideContent;
  switch (pathname) {
    case '/protected/billing':
      asideContent = (
        <ThreadList assistantId={'asst_7rzhAUWAamYufZJjZeKYkX1t'}/>
      );
      break;
    case '/protected/compliance':
      asideContent = (
        <ThreadList assistantId={'asst_9RqcRDt3vKUEFiQeA0HfLC08'}/>
      );
      break;
    case '/protected':
      asideContent = (
        <UserStats />
      );
      break;
    default:
      asideContent = null; // or some default component
  }

  const handleSignOut = async () => {
    await signOutAction();
    router.push('/sign-in');
  };

  const openThreadListModal = () => {
    setThreadListModalOpen(true);
  };

  const closeThreadListModal = () => {
    setThreadListModalOpen(false);
  };

  const ZustandStateMonitor = () => {
    const { currentThreadId, currentAssistantId } = useClientStore();

    // Ensure rendering only on the client side
    if (typeof window === 'undefined') {
      return null;
    }

    return (
      <div className="zustand-state-monitor">
        <div>Current Thread ID: {currentThreadId}</div>
        <div>Current Assistant ID: {currentAssistantId}</div>
        <div>Current Thread Title: {currentThreadTitle}</div>
      </div>
    );
  };

  return (
    <>
      <div>
        <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-3000 ease-linear data-closed:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition-transformation duration-3000 ease-in-out data-closed:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-16 justify-center transition-transformation pt-5 duration-3000 ease-in-out data-closed:opacity-0">
                  <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                  </button>
                </div>
              </TransitionChild>

              <div className="flex grow flex-col justify-between overflow-y-auto bg-gray-900 px-6 pb-2 ring-1 ring-white/10">
                <div>
                  <div className="flex h-16 shrink-0 items-center">
                    <img
                      alt="ChartChek"
                      src="/chartChek-banner-dark.png"
                      className="h-12 top-8 w-auto"
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
                </div>
                <div className="flex justify-center pb-4">
                  <ThemeSwitcher />
                </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
        {/* Static sidebar for desktop */}
        <div className="fixed top-1 left-1 lg:hidden w-full flex justify-between px-2">
          <button type="button" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon aria-hidden="true" className="w-5 h-5" />
          </button>
          <div className="text-xs py-0.5">
    
     
          </div>
          <DropdownMenu items={userNavigation}>
              <ChatBubbleLeftIcon aria-hidden="true" className="w-5 h-5" />
          </DropdownMenu>
        </div>
        <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-20 lg:overflow-y-auto lg:bg-gray-900 lg:pb-4">
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex h-16 shrink-0 items-center justify-center">
                <img
                  alt="ChartChek"
                  src="/chartChek-icon-dark.png"
                  className="h-12 py-1 w-auto"
                />
              </div>
              <nav className="mt-8">
                <ul role="list" className="flex flex-col items-center space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={classNames(
                          item.current ? 'text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
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
            </div>
            <div className="flex justify-center pb-4">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
        <div className="lg:pl-20 overflow-hidden">
          <main className="xl:pl-96 overflow-hidden">
            {children}
          </main>
        </div>

        <aside className="fixed top-5 bottom-0 left-20 hidden w-96 overflow-y-auto border-r border-white bg-background text-foreground px-4 py-6 sm:px-6 lg:px-8 xl:block">
          {asideContent}
        </aside>

        <Modal
          isOpen={isThreadListModalOpen}
          onClose={closeThreadListModal}
          title="Thread List"
          content={<ThreadList assistantId={'asst_7rzhAUWAamYufZJjZeKYkX1t'} />}
          actions={
            <button onClick={closeThreadListModal} className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 sm:col-start-1 sm:mt-0">
              Close
            </button>
          }
        />
      </div>

  
    </>
  )
}