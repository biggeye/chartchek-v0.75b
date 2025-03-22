'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { 
  ClipboardDocumentListIcon, 
  ClockIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { useFacilityStore } from '@/store/facilityStore';
import { usePatientStore } from '@/store/patientStore';
import { getPatientOrders } from '@/lib/kipu/service/patient-service';
import { KipuPatientOrder } from '@/types/kipu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select-new';

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
}

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>;
    case 'discontinued':
      return <Badge className="bg-red-100 text-red-800 border-red-300">Discontinued</Badge>;
    case 'completed':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Completed</Badge>;
    case 'on hold':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">On Hold</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800 border-gray-300">{status || 'Unknown'}</Badge>;
  }
}

export default function PatientOrdersPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const { getCurrentFacility } = useFacilityStore();
  const currentFacility = getCurrentFacility();
  const { currentPatient } = usePatientStore();
  
  const [orders, setOrders] = useState<KipuPatientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    async function fetchPatientOrders() {
      if (!patientId || !currentFacility) return;
      
      setLoading(true);
      try {
        // Build query params based on filters
        const queryParams: any = {
          page: currentPage,
          per: itemsPerPage
        };
        
        // Add status filter if not "all"
        if (statusFilter !== 'all') {
          queryParams.status = statusFilter;
        }
        
        // Add medication name search if provided
        if (searchTerm) {
          queryParams.medication_name = searchTerm;
        }
        
        // Fetch orders from KIPU API
        const ordersData = await getPatientOrders(
          currentFacility.id, 
          patientId as string,
          currentPage,
          itemsPerPage,
          queryParams
        );
        
        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
          // Calculate total pages based on the response
          // This assumes the API returns the total count in some way
          // You may need to adjust this based on the actual API response
          setTotalPages(Math.ceil(ordersData.length / itemsPerPage));
        } else {
          setOrders([]);
          setError('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching patient orders:', err);
        setError('Failed to load patient orders');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPatientOrders();
  }, [patientId, currentFacility, currentPage, itemsPerPage, statusFilter, searchTerm]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const filteredOrders = orders;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">
            {currentPatient ? `${currentPatient.firstName} ${currentPatient.lastName}` : 'Patient'}'s medication orders
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search medications..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="max-w-xs"
          />
          
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <XCircleIcon className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ClipboardDocumentListIcon className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium">No medication orders found</h3>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'This patient has no medication orders recorded'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">
                      {order.medication || 'Unnamed Medication'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {order.dosage_form || ''} {order.route ? `- ${order.route}` : ''}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                    </svg>
                    <div>
                      <p className="text-gray-500">Instructions</p>
                      <p className="font-medium">{order.dispense_amount || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <div>
                      <p className="text-gray-500">Start Date</p>
                      <p className="font-medium">{formatDate(order.mar_start_time)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-gray-500">End Date</p>
                      <p className="font-medium">{formatDate(order.mar_end_time)}</p>
                    </div>
                  </div>
                </div>
                
                {order.note && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-gray-500 text-sm font-medium">Notes</p>
                    <p className="text-sm">{order.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
