'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitle } from './CardComponents';
import { Skeleton } from '@/components/ui/skeleton';

interface Appointment {
  id: string;
  patient_id: string;
  appointment_time: string;
  status: string;
  notes?: string;
}

interface AppointmentsCardProps {
  adaptedAppointments: Appointment[] | null | undefined;
}

export function AppointmentsCard({ adaptedAppointments }: AppointmentsCardProps) {
  // If appointments is null or undefined, show loading state
  if (!adaptedAppointments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        {adaptedAppointments.length === 0 ? (
          <p className="text-muted-foreground">No appointments scheduled</p>
        ) : (
          <div className="space-y-4">
            {adaptedAppointments.map((appointment) => (
              <div key={appointment.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="font-medium">
                  {/* Use ISO format to avoid hydration errors */}
                  {appointment.appointment_time ?
                    `${new Date(appointment.appointment_time).toISOString().split('T')[0]} at ${new Date(appointment.appointment_time).toISOString().split('T')[1].substring(0, 5)}`
                    : 'Unknown time'}
                </div>
                <p className="text-sm text-muted-foreground">
                  Status: {appointment.status}
                </p>
                {appointment.notes && (
                  <p className="text-sm mt-1 line-clamp-2">{appointment.notes}</p>
                )}
              </div>
            ))}
            <Link
              href={`/protected/patients/${adaptedAppointments[0].patient_id}/appointments`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              See All
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
