'use client'

import { PlusIcon } from '@heroicons/react/20/solid';
import { assistantRoster } from '../../../lib/assistants/roster';

interface Assistant {
  name: string;
  instructions: string;
}

const AssistantCard = ({ assistant }: { assistant: Assistant }) => {
  return (
    <li className="flex flex-col py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">{assistant.name}</p>
        <button
          type="button"
          className="inline-flex items-center gap-x-1.5 text-sm/6 font-semibold text-gray-900"
        >
          <PlusIcon aria-hidden="true" className="size-5 text-gray-400" />
          Create <span className="sr-only">{assistant.name}</span>
        </button>
      </div>
    </li>
  );
};

export default function AssistantsPage() {
  return (
    <div className="mx-auto max-w-lg">
      <div>
        <div className="text-center">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
            aria-hidden="true"
            className="mx-auto size-12 text-gray-400"
          >
            <path
              d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="mt-2 text-base font-semibold text-gray-900">Assistants Overview</h2>
          <p className="mt-1 text-sm text-gray-500">
            Here are the available assistants to help you with compliance and accreditation queries.
          </p>
        </div>
        <div className="mt-10">
          <h3 className="text-sm font-medium text-gray-500">Available Assistants</h3>
          <ul role="list" className="mt-4 divide-y divide-gray-200 border-t border-b border-gray-200">
            {assistantRoster.map((assistant, index) => (
              <AssistantCard key={index} assistant={assistant} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}