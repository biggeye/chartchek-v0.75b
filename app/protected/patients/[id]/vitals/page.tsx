'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format, subDays, subMonths } from 'date-fns';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid';
import { HeartIcon, ScaleIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { usePatientStore } from '@/store/patientStore';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface VitalSign {
  id: string | number;
  type: 'blood_pressure' | 'temperature' | 'weight' | 'oxygen' | 'glucose';
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  value?: number;
  unit?: string;
  date: string;
  status: 'normal' | 'elevated' | 'high' | 'low' | 'critical';
  notes?: string;
}

export default function PatientVitalsPage() {
  const { id: patientId } = useParams<{ id: string }>();
  
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { 
    currentPatientVitalSigns, 
    isLoading, 
    error 
  } = usePatientStore();
  
  // Process vital signs data from the store whenever it changes
  useEffect(() => {
// Ensure currentPatientVitalSigns is an array before mapping over it
if (!currentPatientVitalSigns || !Array.isArray(currentPatientVitalSigns)) {
  setVitalSigns([]);
  return;
}
    
    // Map the KIPU API response to our VitalSign interface
    const formattedVitalSigns = currentPatientVitalSigns.map((vital: any) => {
      // Determine the type based on available data
      let type: VitalSign['type'] = 'temperature';
      if (vital.blood_pressure_systolic && vital.blood_pressure_diastolic) {
        type = 'blood_pressure';
      } else if (vital.type === 'weight') {
        type = 'weight';
      } else if (vital.type === 'o2_saturation' || vital.o2_saturation) {
        type = 'oxygen';
      } else if (vital.type === 'glucose') {
        type = 'glucose';
      }
      
      // Determine status based on values (simplified logic)
      let status: VitalSign['status'] = 'normal';
      
      return {
        id: vital.id || '',
        type,
        systolic: vital.blood_pressure_systolic ? Number(vital.blood_pressure_systolic) : undefined,
        diastolic: vital.blood_pressure_diastolic ? Number(vital.blood_pressure_diastolic) : undefined,
        pulse: vital.pulse ? Number(vital.pulse) : undefined,
        value: vital.temperature || vital.value || vital.o2_saturation,
        unit: vital.unit || (type === 'weight' ? 'lbs' : undefined),
        date: vital.recordedAt || vital.interval_timestamp,
        status,
        notes: vital.notes || ''
      };
    });
    
    setVitalSigns(formattedVitalSigns);
  }, [currentPatientVitalSigns]);

  // Filter vital signs based on selected time range
  const filteredVitalSigns = vitalSigns.filter(vs => {
    const date = new Date(vs.date);
    const now = new Date();
    
    if (timeRange === 'week') {
      return date >= subDays(now, 7);
    } else if (timeRange === 'month') {
      return date >= subMonths(now, 1);
    } else {
      return date >= subMonths(now, 12);
    }
  }).filter(vs => {
    // Filter by type if selected
    return selectedType ? vs.type === selectedType : true;
  });

  // Get the latest values for each vital sign type
  const latestVitals = {
    blood_pressure: vitalSigns
      .filter(vs => vs.type === 'blood_pressure')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0],
    temperature: vitalSigns
      .filter(vs => vs.type === 'temperature')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0],
    weight: vitalSigns
      .filter(vs => vs.type === 'weight')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  };

  // Calculate trends
  const calculateTrend = (type: string) => {
    const typeVitals = vitalSigns.filter(vs => vs.type === type)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (typeVitals.length < 2) return 'stable';
    
    const latest = typeVitals[typeVitals.length - 1];
    const previous = typeVitals[typeVitals.length - 2];
    
    if (type === 'blood_pressure') {
      if (!latest.systolic || !previous.systolic) return 'stable';
      const diff = latest.systolic - previous.systolic;
      if (diff > 5) return 'increase';
      if (diff < -5) return 'decrease';
      return 'stable';
    } else {
      if (!latest.value || !previous.value) return 'stable';
      const diff = latest.value - previous.value;
      if (diff > 0) return 'increase';
      if (diff < 0) return 'decrease';
      return 'stable';
    }
  };

  const vitalStats = [
    { 
      id: 1, 
      name: 'Blood Pressure', 
      stat: latestVitals.blood_pressure ? `${latestVitals.blood_pressure.systolic}/${latestVitals.blood_pressure.diastolic}` : 'N/A', 
      icon: HeartIcon, 
      change: calculateTrend('blood_pressure'), 
      changeType: calculateTrend('blood_pressure') === 'increase' ? 'increase' : calculateTrend('blood_pressure') === 'decrease' ? 'decrease' : 'stable' 
    },
    { 
      id: 2, 
      name: 'Temperature', 
      stat: latestVitals.temperature ? `${latestVitals.temperature.value}°F` : 'N/A', 
      icon: BeakerIcon, 
      change: calculateTrend('temperature'), 
      changeType: calculateTrend('temperature') === 'increase' ? 'increase' : calculateTrend('temperature') === 'decrease' ? 'decrease' : 'stable' 
    },
    { 
      id: 3, 
      name: 'Weight', 
      stat: latestVitals.weight ? `${latestVitals.weight.value} ${latestVitals.weight.unit || 'lbs'}` : 'N/A', 
      icon: ScaleIcon, 
      change: calculateTrend('weight'), 
      changeType: calculateTrend('weight') === 'increase' ? 'increase' : calculateTrend('weight') === 'decrease' ? 'decrease' : 'stable' 
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-50 text-green-700 ring-1 ring-green-600/20';
      case 'elevated':
        return 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20';
      case 'high':
        return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
      case 'low':
        return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
      case 'critical':
        return 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20';
      default:
        return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20';
    }
  };

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="p-4">Loading patient vital signs...</div>
      ) : error ? (
        <div className="p-4 text-red-500">Error: {error}</div>
      ) : (
        <>
        
          
          {/* Stats Overview */}
          <div>
            <h3 className="text-base font-semibold text-gray-900">Vital Statistics</h3>

            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {vitalStats.map((item) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow-sm sm:px-6 sm:pt-6"
                >
                  <dt>
                    <div className="absolute rounded-md bg-indigo-500 p-3">
                      <item.icon aria-hidden="true" className="h-6 w-6 text-white" />
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                  </dt>
                  <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                    {item.change !== 'stable' && (
                      <p
                        className={classNames(
                          item.changeType === 'increase' ? 'text-red-600' : 'text-green-600',
                          'ml-2 flex items-baseline text-sm font-semibold',
                        )}
                      >
                        {item.changeType === 'increase' ? (
                          <ArrowUpIcon aria-hidden="true" className="h-5 w-5 shrink-0 self-center text-red-500" />
                        ) : (
                          <ArrowDownIcon aria-hidden="true" className="h-5 w-5 shrink-0 self-center text-green-500" />
                        )}

                        <span className="sr-only"> {item.changeType === 'increase' ? 'Increased' : 'Decreased'} </span>
                        {item.change}
                      </p>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <button 
                          onClick={() => setSelectedType(item.name.toLowerCase().replace(' ', '_'))} 
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          View history<span className="sr-only"> {item.name} stats</span>
                        </button>
                      </div>
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          
          {/* Time Range Filter */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  timeRange === 'week' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  timeRange === 'month' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  timeRange === 'year' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Last Year
              </button>
            </div>
            <div>
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value || null)}
                className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                <option value="blood_pressure">Blood Pressure</option>
                <option value="temperature">Temperature</option>
                <option value="weight">Weight</option>
              </select>
            </div>
          </div>
          
          {/* Vital Signs Table */}
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-base/7 font-semibold text-gray-900">Vital Signs History</h3>
              <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">
                Showing {filteredVitalSigns.length} records from the {timeRange === 'week' ? 'last week' : timeRange === 'month' ? 'last month' : 'last year'}
              </p>
            </div>
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Value</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredVitalSigns.length > 0 ? (
                      filteredVitalSigns.map((vitalSign) => (
                        <tr key={vitalSign.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {format(new Date(vitalSign.date), 'MMM d, yyyy h:mm a')}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {vitalSign.type === 'blood_pressure' ? 'Blood Pressure' : 
                             vitalSign.type === 'temperature' ? 'Temperature' : 
                             vitalSign.type === 'weight' ? 'Weight' : 
                             vitalSign.type === 'oxygen' ? 'Oxygen Saturation' : 
                             'Blood Glucose'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {vitalSign.type === 'blood_pressure' ? 
                              `${vitalSign.systolic}/${vitalSign.diastolic} mmHg (Pulse: ${vitalSign.pulse})` : 
                             vitalSign.type === 'temperature' ? 
                              `${vitalSign.value}°F` : 
                             vitalSign.type === 'weight' ? 
                              `${vitalSign.value} ${vitalSign.unit || 'lbs'}` : 
                             vitalSign.type === 'oxygen' ? 
                              `${vitalSign.value}%` : 
                              `${vitalSign.value} mg/dL`}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(vitalSign.status)}`}>
                              {vitalSign.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {vitalSign.notes || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-sm text-gray-500">
                          No vital signs found for the selected criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Add New Vital Sign
            </button>
          </div>
        </>
      )}
    </div>
  );
}
