'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardTitle } from './CardComponents';

interface Appointment {
  id: string;
  patient_id: string;
  appointment_time: string;
  status: string;
  notes?: string;
}

interface AppointmentsCardProps {
  appointments: Appointment[];
}

export function AppointmentsCard({ appointments }: AppointmentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-muted-foreground">No appointments scheduled</p>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="font-medium">
                  {new Date(appointment.appointment_time).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Status: {appointment.status}
                </p>
                {appointment.notes && (
                  <p className="text-sm mt-1 line-clamp-2">{appointment.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
