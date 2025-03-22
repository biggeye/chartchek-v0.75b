'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { useFacilityStore } from '@/store/facilityStore';
import { usePatientStore } from '@/store/patientStore';
import { getPatientAppointments } from '@/lib/kipu/service/patient-service';

interface Appointment {
  id: string;
  title: string;
  date: string;
  provider: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

export default function PatientAppointmentsPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const { getCurrentFacility } = useFacilityStore();
  const currentFacility = getCurrentFacility();
  const { currentPatient } = usePatientStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    async function fetchAppointments() {
      if (!patientId || !currentFacility) return;
      
      setLoading(true);
      try {
        // Fetch appointments from KIPU API
        const appointmentsData = await getPatientAppointments(currentFacility.id, patientId as string);
        
        // Map the KIPU API response to our Appointment interface
        const formattedAppointments = appointmentsData.map((apt: any) => ({
          id: apt.id || '',
          title: apt.title || apt.type || 'Appointment',
          date: apt.appointment_date || apt.date || new Date().toISOString(),
          provider: apt.provider_name || 'Not specified',
          location: apt.location || 'Not specified',
          status: apt.status || 'scheduled',
          notes: apt.notes || ''
        }));
        
        setAppointments(formattedAppointments);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch patient appointments:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
        setLoading(false);
      }
    }
    
    fetchAppointments();
  }, [patientId, currentFacility]);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 ring-1 ring-green-600/20';
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
      case 'cancelled':
        return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
      case 'no-show':
        return 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20';
      default:
        return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20';
    }
  };

  // Group appointments by date for calendar view
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const date = format(parseISO(appointment.date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  // Generate calendar days
  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i - 15); // Show 15 days before and after today
    const dateString = format(date, 'yyyy-MM-dd');
    return {
      date,
      dateString,
      appointments: appointmentsByDate[dateString] || []
    };
  });

return(
    <div className="space-y-8 w-full">
      {loading ? (
        <div className="p-4">Loading patient appointments...</div>
      ) : error ? (
        <div className="p-4 text-red-500">Error: {error}</div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
      
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-md ${viewMode === 'calendar' ? 'bg-gray-200' : 'bg-white'}`}
                aria-label="Calendar view"
              >
                <CalendarIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-200' : 'bg-white'}`}
                aria-label="List view"
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {selectedAppointment ? (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
              <div className="px-4 py-6 sm:px-6">
                <h3 className="text-base/7 font-semibold text-gray-900">{selectedAppointment.title}</h3>
                <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Appointment details</p>
              </div>
              <div className="border-t border-gray-100">
                <dl className="divide-y divide-gray-100">
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Date & Time</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {format(parseISO(selectedAppointment.date), 'MMMM d, yyyy h:mm a')}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Provider</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {selectedAppointment.provider}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Location</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {selectedAppointment.location}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900">Status</dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                        {selectedAppointment.status}
                      </span>
                    </dd>
                  </div>
                  {selectedAppointment.notes && (
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-900">Notes</dt>
                      <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                        {selectedAppointment.notes}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="px-4 py-6 sm:px-6">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Back to {viewMode === 'calendar' ? 'Calendar' : 'List'}
                </button>
              </div>
            </div>
          ) : viewMode === 'calendar' ? (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg w-full">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-base/7 font-semibold text-gray-900">Appointment Calendar</h3>
                <p className="mt-1 max-w-5xl text-sm/6 text-gray-500">Click on a day to see appointments.</p>
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="bg-gray-50 px-4 py-2 text-center text-sm font-semibold text-gray-900">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {calendarDays.map(({ date, appointments }) => {
                  const isToday = format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                  const hasAppointments = appointments.length > 0;
                  
                  return (
                    <div 
                      key={date.toString()} 
                      className={`bg-white px-4 py-6 text-center text-sm ${hasAppointments ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => hasAppointments && setSelectedAppointment(appointments[0])}
                    >
                      <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : ''}`}>
                        {format(date, 'd')}
                      </div>
                      {hasAppointments && (
                        <div className="mt-2">
                          <div className={`h-2 w-2 rounded-full mx-auto ${getStatusColor(appointments[0].status).split(' ')[0]}`}></div>
                          <p className="mt-1 text-xs">{appointments.length} appt{appointments.length > 1 ? 's' : ''}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-base/7 font-semibold text-gray-900">Appointment List</h3>
                <p className="mt-1 max-w-5xl text-sm/6 text-gray-500">Click on an appointment to see details.</p>
              </div>
              <ul className="divide-y divide-gray-100">
                {appointments.length > 0 ? (
                  appointments.map((appointment) => (
                    <li 
                      key={appointment.id} 
                      className="px-4 py-5 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{appointment.title}</p>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(appointment.date), 'MMMM d, yyyy h:mm a')}
                          </p>
                          <p className="text-sm text-gray-500">{appointment.provider}</p>
                        </div>
                        <span className={`inline-flex h-fit items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-5">
                    <p className="text-gray-500">No appointments found for this patient.</p>
                  </li>
                )}
              </ul>
            </div>
          )}
          
          <div className="mt-6">
            <button
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Schedule New Appointment
            </button>
          </div>
        </>
      )}
    </div>
  );


}