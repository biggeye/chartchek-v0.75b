// app/protected/patients/[id]/treatment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircleIcon, CalendarDaysIcon, HeartIcon } from '@heroicons/react/24/outline';
import { usePatient } from '@/lib/contexts/PatientProvider';
import { KipuPatientEvaluation } from '@/types/kipu';

// Define a type for timeline activities
interface TimelineActivity {
  id: string;
  type: string;
  title: string;
  date: string;
  description: string;
  icon: any; // Ideally replace with proper icon type
}

// Activity type mapping for the timeline
const activityTypeIcons = {
  'evaluation': CheckCircleIcon,
  'appointment': CalendarDaysIcon,
  'vital': HeartIcon,
};

export default function PatientTreatmentPlan() {
  const { id: patientId } = useParams<{ id: string }>();
  
  // Access the patient context
  const {
    currentPatientFile,
    isLoading,
    error
  } = usePatient();

  // Generate timeline activities from patient data
  const [timelineActivities, setTimelineActivities] = useState<TimelineActivity[]>([]);

  useEffect(() => {
    if (!currentPatientFile) return;
    
    const activities: TimelineActivity[] = [];
    
    // Add evaluations to timeline
    if (currentPatientFile.evaluations) {
      currentPatientFile.evaluations.forEach(evaluation => {
        activities.push({
          id: `eval-${evaluation.id}`,
          type: 'evaluation',
          title: evaluation.name,
          date: evaluation.createdAt,
          description: `Status: ${evaluation.status}`,
          icon: activityTypeIcons['evaluation']
        });
      });
    }
    
    // Sort activities by date (newest first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setTimelineActivities(activities);
  }, [currentPatientFile]);

  if (isLoading) {
    return <div className="p-4">Loading treatment plan...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading treatment plan: {error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Treatment Plan</h2>
        
        {/* Timeline */}
        <div className="flow-root mt-6">
          <ul className="-mb-8">
            {timelineActivities.length > 0 ? (
              timelineActivities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== timelineActivities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-gray-100">
                          {activity.icon && <activity.icon className="h-5 w-5 text-gray-500" aria-hidden="true" />}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900">
                            {activity.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {activity.description}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-center py-4 text-gray-500">No treatment activities found</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}