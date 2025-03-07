'use client'
import { chatStore } from '@/store/chatStore';
import { useState, useEffect, useRef } from 'react'
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
import Modal from '@/components/modal';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { ThreadList } from '@/components/chat/ThreadList';
import Link from 'next/link';
import { GlobalChatInputArea } from '@/components/chat/GlobalChatInput';
import { cn } from '@/lib/utils';



interface AppLayoutProps {
  children: React.ReactNode;
  user_id: string;
}

export default function AppLayout({ children, user_id }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isThreadListModalOpen, setThreadListModalOpen] = useState(false);
  const [showChatInputArea, setShowChatInputArea] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFacilityId, setCurrentFacilityId] = useState<string | undefined>();
  const [isChatInputVisible, setIsChatInputVisible] = useState(false);
  const [assistantId, setAssistantId] = useState<string | undefined>();
  const [threadId, setThreadId] = useState<string | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [showInsights, setShowInsights] = useState(true);
  const pathname = usePathname();

  // Initialize stores
  const { createThread, sendMessage, setCurrentAssistantId } = chatStore();

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

  // Handle chat message submission
  const handleChatSubmit = async (content: string, attachments: string[], patientContext: any = null) => {
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);

      // Determine assistant based on current route
      let assistantId = "asst_9RqcRDt3vKUEFiQeA0HfLC08"; // Default to compliance assistant

      if (pathname?.includes('/billing')) {
        assistantId = "asst_7rzhAUWAamYufZJjZeKYkX1t"; // Billing assistant
      }

      // Set the current assistant ID
      setCurrentAssistantId(assistantId);
      setAssistantId(assistantId);

      // Create a thread if needed or use existing
      const thread = chatStore.getState().currentThread;
      const threadId = thread?.thread_id || await createThread(assistantId);

      if (!threadId) {
        throw new Error('Failed to create or retrieve thread');
      }

      setThreadId(threadId);

      // Format the message content with patient context if available
      let messageText = content;

      if (patientContext) {
        // Include minimal patient context for the LLM to reference
        messageText = `
--- PATIENT CONTEXT ---
Patient: ${patientContext.first_name} ${patientContext.last_name}
DOB: ${patientContext.dob}
MR#: ${patientContext.mr_number}
Admission: ${patientContext.admission_date}
---

${content}`;
      }

      // Format the content as JSON object to standardize storage
      // This ensures consistency in message storage and retrieval as specified in MEMORY
      const formattedContent = JSON.stringify({ text: messageText });

      // Convert string attachments to proper ChatMessageAttachment objects
      const formattedAttachments = attachments.map(fileId => ({
        file_id: fileId,
        tools: []
      }));

      // Send the message with JSON formatted content and proper attachment objects
      await sendMessage(assistantId, threadId, formattedContent, formattedAttachments);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract facility ID if present in the pathname
  useEffect(() => {
    if (pathname) {
      const matches = pathname.match(/\/facilities\/([^\/]+)/);
      if (matches && matches[1]) {
        setCurrentFacilityId(matches[1]);
      } else {
        if (matches && matches[2]) {
          setCurrentFacilityId(matches[2]);
        } else {
          setCurrentFacilityId(undefined);
        }
      }

      // Set chat input visibility based on route
      setIsChatInputVisible(
        pathname.includes('/compliance') ||
        pathname.includes('/billing') ||
        (pathname.includes('/facilities') && pathname.includes('/patients/'))
      );
    }
  }, [pathname]);

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }

  // Determine sidebar content based on current route
  let asideContent = null;
  if (pathname === '/protected/compliance') {
    asideContent = <ThreadList assistantId="asst_9RqcRDt3vKUEFiQeA0HfLC08" />;
  } else if (pathname === '/protected/billing') {
    asideContent = <ThreadList assistantId="asst_7rzhAUWAamYufZJjZeKYkX1t" />;
  } else if (pathname === '/protected/documents') {
    // documents assistant
    asideContent = null;
  } else if (pathname === '/protected/facilities') {
    // facilities assistant
    asideContent = null;
  } else {
    asideContent = null;
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
          <div className="flex grow flex-col overflow-y-auto rounded-lg border-r border-border bg-background px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center justify-between">
              <div className="h-10 w-auto">
                {!sidebarCollapsed && (
                  <h1 className="text-2xl font-bold tracking-tight text-primary-600">ChartChek</h1>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-foreground-muted hover:text-foreground transition-colors"
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarCollapsed ? (
                    <ArrowRightCircleIcon className="h-6 w-6" />
                  ) : (
                    <ArrowLeftCircleIcon className="h-6 w-6" />
                  )}
                </button>
                {!sidebarCollapsed && <ThemeSwitcher />}
              </div>
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
                {!sidebarCollapsed && (
                  <li>
                    <div className="text-xs font-semibold leading-6 text-muted-foreground">Your threads</div>
                    <div className="mt-2">
                      {/* Thread list will be inserted here */}
                    </div>
                  </li>
                )}
                {/* User menu moved to bottom and simplified */}
                <li className="mt-auto">
                  <Menu as="div" className="relative">
                    <MenuButton className={cn(
                      "flex items-center rounded-md p-2 text-sm font-semibold text-foreground hover:bg-background-muted",
                      sidebarCollapsed ? "justify-center" : ""
                    )}>
                      <UserCircleIcon className="h-9 w-9 rounded-full text-foreground-muted" aria-hidden="true" />
                      {/* Removed UUID display as requested */}
                    </MenuButton>
                    <MenuItems className="absolute zindex-500 bottom-full mb-1 w-48 origin-bottom-left rounded-md bg-card py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {userNavigation.map((item) => (
                        <MenuItem key={item.name} as="div">
                          {({ active }) => (
                            item.onClick ? (
                              <button
                                className={cn(
                                  active ? 'bg-muted text-foreground' : '',
                                  'block px-4 py-2 text-sm w-full text-left'
                                )}
                                onClick={item.onClick}
                              >
                                {item.name}
                              </button>
                            ) : (
                              <Link
                                href={item.href}
                                className={cn(
                                  active ? 'bg-muted text-foreground' : '',
                                  'block px-4 py-2 text-sm'
                                )}
                              >
                                {item.name}
                              </Link>
                            )
                          )}
                        </MenuItem>
                      ))}
                    </MenuItems>
                  </Menu>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className={`${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'} transition-all duration-300 ease-in-out`}>
             <button
              type="button"
              className="-m-2.5 p-2.5 text-foreground-muted lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-border lg:hidden" aria-hidden="true" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6"></div>
        
          <main className="flex flex-1 min-h-[calc(100vh-4rem)]">
            <div className="flex-1 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
            {/* Re-added the right sidebar with ThreadList */}
            {asideContent && (
              <aside className="hidden xl:block w-80 shrink-0 p-6 border-l border-border bg-card overflow-y-auto">
                {asideContent}
              </aside>
            )}
          </main>
        </div>

        {/* Chat Input Area - Now using the fixed position version */}
        {isChatInputVisible && (
          <GlobalChatInputArea />
        )}
      </div>

      {/* Thread List Modal */}
      <Modal
        isOpen={isThreadListModalOpen}
        onClose={() => setThreadListModalOpen(false)}
        title="Your Conversations"
        content={
          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            <ThreadList />
          </div>
        }
        actions={
          <button
            className="mt-3 inline-flex w-full justify-center rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground ring-1 shadow-xs ring-border hover:bg-muted sm:col-start-1 sm:mt-0"
            onClick={() => setThreadListModalOpen(false)}
          >
            Close
          </button>
        }
      />
    </>
  )
}