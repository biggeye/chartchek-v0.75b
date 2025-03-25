'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitle } from './CardComponents';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Order {
  id: string;
  patient_id: string;
  name?: string;
  medication?: string;
  dosage_form?: string;
  route?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  is_prn?: boolean;
  discontinued?: boolean;
  discontinue_reason?: string;
  ordered_by?: string;
  instructed_by?: string;
  note?: string;
}

interface OrdersCardProps {
  orders: Order[] | null | undefined;
  isLoading?: boolean;
}

export function OrdersCard({ orders, isLoading = false }: OrdersCardProps) {
  // If orders is null or undefined or loading is true, show loading state
  if (isLoading || !orders) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medication Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'pending_order_review':
      case 'pending_discontinue_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'discontinued':
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medication Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-muted-foreground">No medication orders found</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-lg">
                    {order.medication || order.name || 'Unknown medication'}
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  {order.dosage_form && (
                    <p className="text-sm">
                      <span className="font-medium">Form:</span> {order.dosage_form}
                    </p>
                  )}
                  {order.route && (
                    <p className="text-sm">
                      <span className="font-medium">Route:</span> {order.route}
                    </p>
                  )}
                  {order.ordered_by && (
                    <p className="text-sm">
                      <span className="font-medium">Ordered by:</span> {order.ordered_by}
                    </p>
                  )}
                  {order.instructed_by && (
                    <p className="text-sm">
                      <span className="font-medium">Instructed by:</span> {order.instructed_by}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Created:</span> {formatDate(order.created_at)}
                  </p>
                  {order.updated_at && order.updated_at !== order.created_at && (
                    <p className="text-sm">
                      <span className="font-medium">Updated:</span> {formatDate(order.updated_at)}
                    </p>
                  )}
                </div>
                
                {order.is_prn && (
                  <Badge className="mr-2 mb-2 border border-gray-200 bg-transparent text-gray-800">
                    PRN (As Needed)
                  </Badge>
                )}
                
                {order.discontinued && (
                  <div className="mt-2 text-sm text-red-600">
                    <span className="font-medium">Discontinued:</span> {order.discontinue_reason || 'No reason provided'}
                  </div>
                )}
                
                {order.note && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Notes:</span> {order.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
