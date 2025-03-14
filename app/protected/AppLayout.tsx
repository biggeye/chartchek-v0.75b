'use client'
import { chatStore } from '@/store/chatStore';
import { useState, useEffect, useRef, Fragment } from 'react'
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
  Transition
} from '@headlessui/react'
import {
  Bars3Icon,
  DocumentDuplicateIcon,
  XMarkIcon,
  ChevronUpIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon
} from '@heroicons/react/24/outline'
import {
  ShieldCheckIcon,
  BuildingOffice2Icon,
  UserCircleIcon,
  CreditCardIcon,

} from '@heroicons/react/24/outline'

import ChevronDownIcon from '@heroicons/react/24/solid/ChevronDownIcon';
import { signOutAction } from '../actions';
import Modal from '@/components/ui/modal';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChatBubbleBottomCenterIcon } from '@heroicons/react/24/outline';
import { useStreamStore } from '@/store/streamStore';
import { FacilitySelector } from '@/components/ui/facility-selector';
import { useFacilityStore } from '@/store/facilityStore';
import { initializeStoreSubscriptions } from '@/store/storeInitializers';
import { useSidebarStore } from '@/store/sidebarStore';

interface AppLayoutProps {
  children: React.ReactNode;
  user_id: string;
}

export default function AppLayout({ children, user_id }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [showInsights, setShowInsights] = useState(true);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const pathname = usePathname();


  // Use sidebar store instead of local state
  const { sidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useSidebarStore();

  // Navigation items
  const navigation = [
    { name: 'Chat', href: '/protected/chat', icon: ChatBubbleBottomCenterIcon },
    { name: 'Documents', href: '/protected/documents', icon: DocumentDuplicateIcon },
    { name: 'Patients', href: '/protected/patients', icon: UserCircleIcon },
  ].map(item => ({
    ...item,
    current: pathname === item.href
  }));

  // User dropdown items
  const userNavigation = [
    { name: 'Your Profile', href: '/protected/account' },
    { name: 'Facility Settings', href: '/protected/settings' },
    { name: 'Sign out', href: '#', onClick: async () => await signOutAction() },
  ];

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }

  // Determine sidebar width based on collapsed state
  const sidebarWidth = sidebarCollapsed ? 'lg:w-20' : 'lg:w-72';

  // Handle scroll events to hide/show insights
  useEffect(() => {
    const handleScroll = () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      if (st > lastScrollTop && st > 150) {
        // Scrolling down and past threshold, hide insights
        setShowInsights(false);
      } else if (st < lastScrollTop || st < 50) {
        // Scrolling up or near top, show insights
        setShowInsights(true);
      }
      setLastScrollTop(st <= 0 ? 0 : st);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollTop]);

  // Initialize cross-store subscriptions
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First initialize facility data
        const { initializeFacilityData } = require('@/store/storeInitializers');
        await initializeFacilityData();
        
        // Then initialize all store subscriptions
        const cleanup = initializeStoreSubscriptions();
        
        // Return cleanup function to unsubscribe when component unmounts
        return cleanup;
      } catch (error) {
        console.error('Error initializing app:', error);
        return () => {};
      }
    };
    
    // Initialize and store the cleanup function
    let cleanup: (() => void) | undefined;
    initializeApp().then(cleanupFn => {
      cleanup = cleanupFn;
    });
    
    // Return cleanup function
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

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
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <div className="flex grow flex-col overflow-y-auto rounded-lg border-r border-border bg-background shadow-lg">
                <div className="flex flex-col grow gap-y-5 px-6 py-4">
                  {/* Mobile Facility Selector */}
                  <div className="py-2">
                    <FacilitySelector variant="sidebar" />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className={cn(
                                  item.current
                                    ? 'bg-primary-50 text-primary'
                                    : 'text-foreground hover:text-foreground hover:bg-muted',
                                  'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    item.current ? 'text-primary' : 'text-foreground-muted group-hover:text-foreground',
                                    'h-6 w-6 shrink-0'
                                  )}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex ${sidebarWidth} lg:flex-col transition-all duration-300 ease-in-out`}>
          {/* Toggle button positioned at 50% vertical and on right edge */}
          <button 
            onClick={() => toggleSidebar()}
            className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 bg-background rounded-full border border-border shadow-md p-1 text-foreground-muted hover:text-foreground transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ArrowRightCircleIcon className="h-5 w-5" />
            ) : (
              <ArrowLeftCircleIcon className="h-5 w-5" />
            )}
          </button>
          
          <div className="flex grow flex-col overflow-y-auto rounded-lg border-r border-border bg-background px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center justify-between">
              <div className="h-10 w-auto">
                {!sidebarCollapsed && (
                  <h1 className="text-2xl font-bold tracking-tight text-primary-600">ChartChek</h1>
                )}
              </div>
            </div>
            
            {/* Desktop Facility Selector */}
            {!sidebarCollapsed && (
              <div className="mb-4">
                <FacilitySelector variant="sidebar" />
              </div>
            )}
            
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                {/* In narrow mode, show user icon at the top */}
                {sidebarCollapsed && (
                  <li className="flex flex-col items-center space-y-4 py-2">
                    {/* Removed user and facility buttons */}
                  </li>
                )}
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            item.current
                              ? 'bg-primary-foreground text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                            sidebarCollapsed ? 'justify-center' : ''
                          )}
                          title={sidebarCollapsed ? item.name : undefined}
                        >
                          <item.icon
                            className={cn(
                              item.current ? 'text-primary' : 'text-foreground-muted group-hover:text-foreground',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {!sidebarCollapsed && item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className={`${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'} transition-all duration-300 ease-in-out`}>
          {/* Top navigation bar */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-foreground-muted lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            
            {/* Header Facility Selector (visible on larger screens) */}
            <div className="hidden md:block flex-1">
              <FacilitySelector variant="header" data-facility-selector="true" />
            </div>
            
            <div className="flex flex-1 justify-end gap-x-4 lg:gap-x-6">
              {/* Mobile Facility Selector (visible on small screens) */}
              <div className="flex items-center md:hidden">
                <FacilitySelector variant="header" />
              </div>
              
              {/* User dropdown */}
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <Menu as="div" className="relative inline-block text-left">
                  <MenuButton className="flex items-center gap-x-2 text-sm font-medium text-foreground hover:text-foreground-muted">
                    <UserCircleIcon className="h-6 w-6 text-foreground-muted" aria-hidden="true" />
                    <span className="hidden lg:block">Account</span>
                    <ChevronDownIcon className="h-5 w-5 text-foreground-muted" aria-hidden="true" />
                  </MenuButton>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-background shadow-lg ring-1 ring-border ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <MenuItem>
                          {({ active }) => (
                            <Link
                              href="/protected/profile"
                              className={cn(
                                active ? 'bg-muted text-foreground' : 'text-foreground-muted',
                                'block px-4 py-2 text-sm'
                              )}
                            >
                              Your Profile
                            </Link>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <Link
                              href="/protected/settings"
                              className={cn(
                                active ? 'bg-muted text-foreground' : 'text-foreground-muted',
                                'block px-4 py-2 text-sm'
                              )}
                            >
                              Facility Settings
                            </Link>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <div
                              className={cn(
                                active ? 'bg-muted text-foreground' : 'text-foreground-muted',
                                'block px-4 py-2 text-sm'
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span>Theme</span>
                                <ThemeSwitcher />
                              </div>
                            </div>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={async () => await signOutAction()}
                              className={cn(
                                active ? 'bg-muted text-foreground' : 'text-foreground-muted',
                                'block w-full text-left px-4 py-2 text-sm'
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>
        
          <main className="flex flex-1 overflow-hidden">
            <div className="flex-1 px-4 sm:px-6 lg:px-8 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      
      {/* User Profile Modal */}
      <Transition
        show={userModalOpen}
        enter="transition duration-300 ease-out"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition duration-200 ease-in"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm" 
            onClick={() => setUserModalOpen(false)}
          />
          
          {/* Modal Content */}
          <Transition.Child
            enter="transition duration-300 ease-out"
            enterFrom="transform scale-50 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-200 ease-in"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-50 opacity-0"
          >
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[80vw] h-[80vh] max-w-4xl max-h-[80vh] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User Profile</h2>
                <button
                  onClick={() => setUserModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-grow">
                <div className="flex flex-col space-y-6">
                  {/* User Info Section */}
                  <div className="flex items-center space-x-4">
                    <UserCircleIcon className="h-16 w-16 text-gray-400" aria-hidden="true" />
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">User ID: {user_id}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account settings and preferences</p>
                    </div>
                  </div>
                  
                  {/* Navigation Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {userNavigation.map((item) => (
                      <div key={item.name} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {item.onClick ? (
                          <button
                            className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => {
                              setUserModalOpen(false);
                              item.onClick && item.onClick();
                            }}
                          >
                            <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setUserModalOpen(false)}
                          >
                            <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="border-t dark:border-gray-700 p-4 flex justify-end space-x-3">
                <button 
                  className="border bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                  onClick={() => setUserModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Transition>
    </>
  )
}