'use client';

import { useEffect, useState } from 'react';
import { fetchDocumentsCount } from '@/store/documentStore';

function classNames(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function UserStats()  {
  const [stats, setStats] = useState<{
    name: string;
    value: number;
  }[]>([
    { name: 'Assistants Deployed', value: 0 },
    { name: 'Conversations', value: 0 },
    { name: 'Documents', value: 0 },
  ]);

  useEffect(() => {
    // Fetch data from the database and update stats
    async function fetchStats() {
      const documentsCount = await fetchDocumentsCount();
      setStats([
        { name: 'Documents', value: documentsCount },
      ]);
    }
    fetchStats();
  }, []);

  return (
    <dl className="mx-auto flex flex-col gap-px bg-gray-900/5">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="flex flex-col items-start justify-between gap-y-2 bg-white px-4 py-4 sm:px-6 xl:px-8"
        >
          <dt className="text-sm/6 font-medium text-gray-500">{stat.name}</dt>
          <dd className="w-full flex-none text-3xl/10 font-medium tracking-tight text-gray-900">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
