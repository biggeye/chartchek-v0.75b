'use client'
import { Document as DBDocument } from "@/types/supabase";
import { Document as StoreDocument } from "@/types/store/doc/document";
import { Input } from '@/components/ui/input';
import { ArrowUpTrayIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';

interface DocumentsTableProps {
  documents: StoreDocument[];
  detailsUrlPrefix?: string;
  onFileSelect?: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export default function DocumentsTable({ 
  documents, 
  detailsUrlPrefix = '/protected/documents', 
  onFileSelect,
  isLoading = false 
}: DocumentsTableProps) {
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      await onFileSelect(file);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden ring-1 shadow-sm ring-black/5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      File Name
                    </th>
                    <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th scope="col" className="hidden md:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Facility
                    </th>
                    <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      File Type
                    </th>
                    <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {documents.map((d) => (
                    <tr key={d.document_id}>
                      <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6">
                        {d.file_name}
                      </td>
                      <td className="hidden md:table-cell px-3 py-4 text-sm whitespace-nowrap text-gray-500">{d.bucket}</td>
                      <td className="hidden md:table-cell px-3 py-4 text-sm whitespace-nowrap text-gray-500">{d.facility_id}</td>
                      <td className="hidden sm:table-cell px-3 py-4 text-sm whitespace-nowrap text-gray-500">{d.file_type}</td>
                      <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                        <Link 
                          href={`${detailsUrlPrefix}/${d.document_id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View<span className="sr-only">, {d.file_name}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}