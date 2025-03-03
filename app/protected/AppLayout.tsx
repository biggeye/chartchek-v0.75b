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
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
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
import { 
  ShieldCheckIcon, 
  BuildingOffice2Icon, 
  UserCircleIcon, 
  CreditCardIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowLeftStartOnRectangleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

import ChevronDownIcon from '@heroicons/react/24/solid/ChevronDownIcon';
import { signOutAction } from '../actions';
import Modal from '@/components/modal';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { ThreadList } from '@/components/chat/ThreadList';
import Link from 'next/link';
import ChatStoreWidget from '@/components/ChatStoreWidget';

/// Aside Components (Insights)
 import { FacilityInsights } from '@/components/dashboard/FacilityInsights';
 import { BillingInsights } from '@/components/dashboard/BillingInsights';
 import { ComplianceInsights } from '@/components/dashboard/ComplianceInsights';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AppLayoutProps {
  children: React.ReactNode;
  user_id: string;
}

export default function AppLayout({ children, user_id }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isThreadListModalOpen, setThreadListModalOpen] = useState(false);
  const pathname = usePathname();
  
  // Initialize stores
    
  // Navigation items
  const navigation = [
    { name: 'Compliance', href: '/protected/compliance', icon: ShieldCheckIcon },
    { name: 'Accounts & Billing', href: '/protected/billing', icon: CreditCardIcon },
    { name: 'Documents', href: '/protected/documents', icon: DocumentDuplicateIcon },
    { name: 'Facilities', href: '/protected/facilities', icon: BuildingOffice2Icon },
  ].map(item => ({
    ...item,
    current: pathname === item.href
  }));

  // User dropdown items
  const userNavigation = [
    { name: 'Chat History', href: '#', onClick: () => setThreadListModalOpen(true) },
    { name: 'Profile', href: `/protected/account/${user_id}` },
    { name: 'Settings', href: '/protected/settings' },
    { name: 'Sign out', href: '#', onClick: async () => await signOutAction() },
  ];

  // Fetch assistant name for specific routes

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }

  // Determine sidebar content based on current route
  let asideContent;
  switch (pathname) {
    case '/protected/facilities/[facilityId]':
      asideContent = 
      <FacilityInsights />
      break;
    case '/protected/billing':
      asideContent = 
      <ThreadList assistantId='asst_7rzhAUWAamYufZJjZeKYkX1t' />;
      <BillingInsights />;
      break;
    case '/protected/compliance':
      asideContent = 
      <ThreadList assistantId='asst_9RqcRDt3vKUEFiQeA0HfLC08' />;
      <ComplianceInsights />;
      break;
    default:
      asideContent = null;
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-background">
        {/* Mobile menu */}
        <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="relative z-50 lg:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />
          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative flex w-full max-w-xs flex-1 flex-col bg-background transition-transform duration-300 ease-in-out data-closed:-translate-x-full"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              
              <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                <div className="flex flex-shrink-0 items-center px-4">
                  <img
                    alt="ChartChek"
                    src="/chartChek-banner-dark.png"
                    className="h-12 w-auto"
                  />
                </div>
                <nav className="mt-5 flex-1 space-y-1 px-2">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        item.current
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        'group flex items-center rounded-md px-2 py-2 text-base font-medium'
                      )}
                    >
                      <item.icon className="mr-4 h-6 w-6 flex-shrink-0" aria-hidden="true" />
                      {item.name}
                    </a>
                  ))}
                </nav>
              </div>
              
              <div className="flex flex-shrink-0 justify-center border-t border-border p-4">
                <ThemeSwitcher />
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Desktop header and layout */}
        <header className="bg-background z-10 border-b border-border">
          <nav className="flex items-center justify-between p-3">
            {/* Logo and hamburger menu */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden -ml-1.5 mr-2 inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              
              <a href="/protected" className="-m-1.5 p-1.5">
                <span className="sr-only">ChartChek</span>
                <img
                  alt="ChartChek"
                  src="/chartChek-icon-dark.png"
                  className="h-8 w-auto"
                />
              </a>
            </div>
            
             
            {/* Desktop nav */}
            <PopoverGroup className="hidden lg:flex lg:gap-x-6">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                    'flex items-center gap-x-2 text-sm font-semibold'
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.name}
                </a>
              ))}
            </PopoverGroup>
            
            {/* User menu */}
            <div className="flex items-center">
              <Popover className="relative">
                <PopoverButton className="flex items-center gap-x-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
                  <UserCircleIcon className="h-6 w-6" aria-hidden="true" />
                  <span className="hidden sm:inline-block"></span>
                  <ChevronDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </PopoverButton>

                <PopoverPanel
                  transition
                  className="absolute right-0 z-10 mt-3 w-56 origin-top-right rounded-md bg-popover p-2 shadow-lg ring-1 ring-border focus:outline-none transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
                >
                  <div className="py-1">
                    {userNavigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={item.onClick}
                        className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-md"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </PopoverPanel>
              </Popover>
              <ThemeSwitcher className="ml-4" />
            </div>
          </nav>
        </header>

        <div className="flex flex-1">

          <main className="w-full h-full">
              {children}

          </main>

          {/* Right sidebar for thread list, etc. (conditionally shown) */}
          {asideContent && (
            <aside className="hidden lg:block w-80 overflow-auto border-l border-border bg-background px-4 py-6">
              {asideContent}
            </aside>
          )}
        </div>

        {/* Thread list modal */}
        <Modal
          isOpen={isThreadListModalOpen}
          onClose={() => setThreadListModalOpen(false)}
          title="Thread List"
          content={<ThreadList />}
          actions={
            <button 
              onClick={() => setThreadListModalOpen(false)} 
              className="mt-3 inline-flex w-full justify-center rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground ring-1 shadow-xs ring-border hover:bg-muted sm:col-start-1 sm:mt-0"
            >
              Close
            </button>
          }
        />
      </div>
    </>
  )
}