'use client'

import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/20/solid';
import { assistantRoster } from '@/lib/assistant/roster';
import type { AssistantCreateParams } from 'openai/resources/beta/assistants';

interface Assistant {
  key: string;
  name: string;
  instructions?: string;
  assistant_id?: string;
  tools: AssistantCreateParams['tools'];
  model: string;
}

const AssistantCard = ({ assistant }: { assistant: Assistant }) => {
  return (
    <li className="flex flex-col py-4 px-4 hover:bg-gray-50 rounded-md transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{assistant.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {assistant.instructions || 'Pre-configured assistant with specialized knowledge'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {assistant.model}
            </span>
            {assistant.tools && assistant.tools.map((tool, idx) => (
              <span key={idx} className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                {tool.type.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
        <Button className="inline-flex items-center gap-x-1.5 text-sm font-semibold">
          <PlusIcon className="h-5 w-5" />
          Chat
        </Button>
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
            className="mx-auto h-12 w-12 text-gray-400"
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
