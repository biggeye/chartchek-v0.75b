import { CalendarDaysIcon, CreditCardIcon, UserCircleIcon } from '@heroicons/react/20/solid'

interface ThreadCardProps {
  threadId: string;
  threadTitle: string;
  assistantName: string;
  facilityName: string;
  createdAt: string;
}

export default function ThreadCard({
  threadId,
  threadTitle,
  assistantName,
  facilityName,
  createdAt
}: ThreadCardProps) {
  return (
    <div className="lg:col-start-3 lg:row-end-1">
      <h2 className="sr-only">{threadTitle}</h2>
      <div className="rounded-lg bg-gray-50 ring-1 shadow-xs ring-gray-900/5">
        <dl className="flex flex-wrap">
          <div className="flex-auto pt-6 pl-6">
            <dt className="text-sm/6 font-semibold text-gray-900">{threadId}</dt>
            <dd className="mt-1 text-base font-semibold text-gray-900">{threadTitle}</dd>
          </div>
          <div className="flex-none self-end px-6 pt-4">
            <dt className="sr-only">Assistant</dt>
            <dd className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
              {assistantName}
            </dd>
          </div>
          <div className="mt-6 flex w-full flex-none gap-x-4 border-t border-gray-900/5 px-6 pt-6">
            <dt className="flex-none">
              <span className="sr-only">Facility</span>
              <UserCircleIcon aria-hidden="true" className="h-6 w-5 text-gray-400" />
            </dt>
            <dd className="text-sm/6 font-medium text-gray-900">{facilityName}</dd>
          </div>
          <div className="mt-4 flex w-full flex-none gap-x-4 px-6">
            <dt className="flex-none">
              <span className="sr-only">Created At</span>
              <CalendarDaysIcon aria-hidden="true" className="h-6 w-5 text-gray-400" />
            </dt>
            <dd className="text-sm/6 text-gray-500">
              <time dateTime="2023-01-31">{createdAt}</time>
            </dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-gray-900/5 px-6 py-6">
                  Attached Files <span aria-hidden="true">&rarr;</span>
        </div>
      </div>
    </div>
  )
}
