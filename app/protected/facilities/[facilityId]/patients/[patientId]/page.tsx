'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getFacilityData } from '@/lib/kipu';
import { Loader2, MessageSquare, Send, PlusCircle } from 'lucide-react';
import { Dialog, DialogTitle, DialogBody, DialogActions } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { chatStore } from '@/store/chatStore';
import { createThreadWithPrompt } from '@/lib/assistant/createThreadWithPrompt';
import Modal from '@/components/modal';
// inside handleSendPrompt:


interface PatientPageProps {
  params: Promise<{
    facilityId: string;
    patientId: string;
  }>;
}

// Custom card components to replace missing exports
const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-muted-foreground ${className || ''}`} {...props}>
    {children}
  </p>
);

export default function PatientPage({ params }: PatientPageProps) {
  // Unwrap the Promise containing params
  const { facilityId, patientId } = use(params);

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vitalSigns, setVitalSigns] = useState<any[]>([]);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewEvalOpen, setIsNewEvalOpen] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Access chat store for sending messages
  const { createThread, sendMessage, setCurrentAssistantId } = chatStore();

  const handleSendPrompt = async (patientId: string, userPrompt: string) => {
    if (!userPrompt.trim()) return;
    setIsLoading(true);
    // Determine which assistant to use
    const assistantId = "asst_9RqcRDt3vKUEFiQeA0HfLC08" // Billing assistant

    // Set the active assistant
    setCurrentAssistantId(assistantId);
    await preparePatientContext(patientId);
    try {
      // Create a thread with context and prompt
      const threadId = await createThreadWithPrompt({
        assistantId,
        userPrompt,
        patient,
        evaluations,
        appointments,
        vitalSigns
      });
      if (threadId) {
        alert("Thread created: " + threadId);
      }

      setIsLoading(false);
      setIsDialogOpen(false);
      setUserPrompt('');
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const facilityData = await getFacilityData(facilityId);

        if (!facilityData) {
          console.error('Facility not found');
          setLoading(false);
          return;
        }

        // Find the patient data
        const patient = facilityData.data.patients?.find(p => p.id === patientId) || null;


        if (!patient) {
          console.error('Patient not found');
          setLoading(false);
          return;
        }

        // Get related evaluations
        const evaluations = facilityData.data.evaluations?.filter(e => e.patient_id === patientId) || [];
        setEvaluations(evaluations as any);

        // Get related appointments
        const appointments = facilityData.data.appointments?.filter(a => a.patient_id === patientId) || [];
        setAppointments(appointments);
        // Get vital signs if available
        setVitalSigns(
          facilityData.data.vital_signs ?
            facilityData.data.vital_signs.filter(v => v.patient_id === patientId) :
            []
        );

        setPatient(patient);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, facilityId]);

  // Prepare a well-formatted patient context
  const preparePatientContext = (patientId: any) => {
    const assistantType = "Compliance";

    let context = `--- ${assistantType} Assistant Context ---\n`;

    // Patient basic info
    context += `\nPATIENT INFORMATION:\n`;
    context += `Name: ${patient.first_name} ${patient.last_name}\n`;
    context += `DOB: ${patient.dob}\n`;
    context += `Gender: ${patient.gender}\n`;
    context += `Address: ${patient.address || 'N/A'}\n`;
    context += `Email: ${patient.contact?.email || 'N/A'}\n`;
    context += `Phone: ${patient.contact?.phone || 'N/A'}\n`;

    // Add insurance information if available
    if (patient.insurance) {
      context += `\nINSURANCE INFORMATION:\n`;
      const insurance = patient.insurance;
      context += `Provider: ${insurance.provider_name || 'N/A'}\n`;
      context += `Policy Number: ${insurance.policy_number || 'N/A'}\n`;
      context += `Group Number: ${insurance.group_number || 'N/A'}\n`;
    }

    // Recent evaluations
    if (evaluations.length > 0) {
      context += `\nRECENT EVALUATIONS (${evaluations.length}):\n`;
      evaluations.forEach((evaluation, index) => {
        context += `${index + 1}. Type: ${evaluation.evaluation_type}, Date: ${new Date(evaluation.created_at).toLocaleDateString()}\n`;
        if (evaluation.notes) context += `   Notes: ${evaluation.notes}\n`;
      });
    }

    // Upcoming appointments
    if (appointments.length > 0) {
      context += `\nAPPOINTMENTS (${appointments.length}):\n`;
      appointments.forEach((appt, index) => {
        context += `${index + 1}. Date: ${new Date(appt.appointment_time).toLocaleString()}, Status: ${appt.status}\n`;
      });
    }

    // Recent vital signs
    if (vitalSigns.length > 0) {
      context += `\nRECENT VITAL SIGNS (${vitalSigns.length}):\n`;
      vitalSigns.forEach((vital, index) => {
        context += `${index + 1}. ${vital.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}: ${vital.value}\n`;
      });
    }

    return context;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Patient not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-muted-foreground">
            Patient ID: {patient.id}
          </p>
        </div>

        {/* Assistant Button */}
        <Button
          color="purple"
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center p-2 gap-2 bg-purple-600 hover:bg-purple-700"
        >
          chartChek
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <title>Patient Information</title>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Date of Birth</dt>
                  <dd>{patient.dob}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
                  <dd>{patient.gender}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                  <dd>{patient.address}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                  <dd>{patient.contact?.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                  <dd>{patient.contact?.phone}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Vital Signs</CardTitle>
            </CardHeader>
            <CardContent>
              {vitalSigns.length === 0 ? (
                <p className="text-muted-foreground">No vital signs recorded</p>
              ) : (
                <div className="space-y-4">
                  {vitalSigns.map((vitalSign) => (
                    <div key={vitalSign.id}>
                      <div className="flex justify-between items-center">
                        <dt className="text-sm font-medium">{vitalSign.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</dt>
                        <dd className="font-medium">{vitalSign.value}</dd>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(vitalSign.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Recent Evaluations</span>
                <Button
                  color="purple"
                  onClick={() => setIsNewEvalOpen(true)}
                  className="flex items-center p-1 px-2  bg-purple-600 hover:bg-purple-700"
                >
                  +
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <p className="text-muted-foreground">No evaluations found</p>
              ) : (
                <div className="space-y-4">
                  {evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="font-medium">{evaluation.evaluation_type}</div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm mt-1 line-clamp-2">{evaluation.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Ask Assistant"
        content={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              How can I help?
            </p>

            <div className="mt-2">
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder={`What do you need for this patient?`}
                className="w-full min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        }
        actions={
          <>
            <Button
              outline
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={() => handleSendPrompt(patientId, userPrompt)}
              disabled={!userPrompt.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </>
        }
      />
    </div>
  );
}
