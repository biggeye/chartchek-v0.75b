'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { DocumentCategorization } from '@/types/store/document'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select-new'

interface DocumentCategorizationFormProps {
  value: DocumentCategorization
  onChange: (value: DocumentCategorization) => void
  isDisabled?: boolean
}

export default function DocumentCategorizationForm({
  value,
  onChange,
  isDisabled = false
}: DocumentCategorizationFormProps) {
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([])
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Fetch facilities
    const fetchFacilities = async () => {
      const { data, error } = await supabase
        .from('facilities')
        .select('facility_id, name')
      
      if (error) {
        console.error('Error fetching facilities:', error)
        return
      }
      
      setFacilities(data?.map(facility => ({
        id: facility.facility_id,
        name: facility.name
      })) || [])
    }

    // Fetch patients (using users table as a placeholder)
    // In a real implementation, this would fetch from a patients table
    const fetchPatients = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      // For demo purposes, we're just using the current user
      // In a real app, you would fetch actual patients
      setPatients([{
        id: user.id,
        name: user.email || 'Current User'
      }])
    }

    fetchFacilities()
    fetchPatients()
  }, [supabase])

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="facility">Facility</Label>
        <Select
          disabled={isDisabled}
          value={value.facility_id || 'none'}
          onValueChange={(facilityId: string) => onChange({ ...value, facility_id: facilityId === 'none' ? '' : facilityId })}
        >
          <SelectTrigger id="facility">
            <SelectValue placeholder="Select a facility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {facilities.map((facility) => (
              facility.id ? (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ) : null
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="patient">Patient</Label>
        <Select
          disabled={isDisabled}
          value={value.patient_id || 'none'}
          onValueChange={(patientId: string) => onChange({ ...value, patient_id: patientId === 'none' ? '' : patientId })}
        >
          <SelectTrigger id="patient">
            <SelectValue placeholder="Select a patient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {patients.map((patient) => (
              patient.id ? (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name}
                </SelectItem>
              ) : null
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
