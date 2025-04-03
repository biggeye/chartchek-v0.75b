"use client"

import { useState, useEffect } from "react"
import { useGlobalChatStore } from "@/store/chat/globalChatStore"
import type { Patient, PatientRecord } from "@/types/store/globalChat"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, CheckCircle2, User, FileText } from "lucide-react"
import { usePatientStore } from "@/store/patient/patientStore"
import { useFacilityStore } from "@/store/patient/facilityStore"
import { useEvaluationsStore } from "@/store/patient/evaluationsStore"


export default function PatientModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"patients" | "records">("patients")

  const {
    queueItems,
    selectQueueItem,
    deselectQueueItem,
  } = useGlobalChatStore()

  const { 
    isLoadingEvaluations,
    patientEvaluations,
    fetchPatientEvaluations,
  } = useEvaluationsStore();

  const { currentFacilityId } = useFacilityStore();

  const {
    isLoadingPatients,
    fetchPatients,
    patients,
    selectPatient,
    selectedPatient
  } = usePatientStore();

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedPatient) {
      const patientId = selectedPatient.patientId;
      fetchPatientEvaluations(patientId);
    }
  }, [selectedPatient]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Tabs defaultValue="patients" onValueChange={(value) => setActiveTab(value as "patients" | "records")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patients" className="text-xs py-1">Patients</TabsTrigger>
          <TabsTrigger value="records" disabled={!selectedPatient} className="text-xs py-1">
            Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="mt-2">
          <h3 className="text-xs font-medium mb-1">Select a patient</h3>

          {isLoadingPatients ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[250px] rounded-md border">
              <div className="p-2 space-y-1">
                {patients.map((patient) => (
                  <PatientItem
                    key={patient.patientId}
                    patient={{
                      patientId: patient.patientId,
                      firstName: patient.firstName,
                      lastName: patient.lastName,
                      facilityId: patient.facilityId.toString(),
                      // Add any other required fields from the Patient interface
                    }}
                    isSelected={selectedPatient?.patientId === patient.patientId}
                    onSelect={() => selectPatient(patient)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-2">
          {selectedPatient && (
            <>
              <h3 className="text-xs font-medium mb-1">
                Patient Evaluations for {selectedPatient.firstName} {selectedPatient.lastName}
              </h3>

              {isLoadingEvaluations ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : patientEvaluations.length > 0 ? (
                <ScrollArea className="h-[250px] rounded-md border">
                  <div className="p-2 space-y-2">
                    {patientEvaluations.map((record) => (
                      <RecordItem
                        key={record.id}
                        record={{
                          id: record.id.toString(),
                          patientId: selectedPatient.patientId, // Add the missing patientId
                          title: record.name,
                          date: record.createdAt,
                          type: record.evaluationType || "evaluation", // Ensure type exists
                          provider: record.createdBy
                        }}
                        isSelected={queueItems.some((r) => r.id === record.id)}
                        onSelect={() => selectQueueItem(record.id, record.name)}
                        onDeselect={() => deselectQueueItem(record.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground">No records found for this patient</div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PatientItem({
  patient,
  isSelected,
  onSelect,
}: {
  patient: Patient
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={`p-2 rounded-md cursor-pointer transition-colors flex items-center gap-2 ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent"
        }`}
      onClick={onSelect}
    >
      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
        <User className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs">{patient.firstName} {patient.lastName}</div>
        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <span>DOB: {patient.dateOfBirth}</span>
          <span>•</span>
          <span>MRN: {patient.mrn}</span>
        </div>
      </div>
      {isSelected && <CheckCircle2 className="h-3 w-3 text-primary" />}
    </div>
  )
}

function RecordItem({
  record,
  isSelected,
  onSelect,
  onDeselect,
}: {
  record: PatientRecord
  isSelected: boolean
  onSelect: () => void
  onDeselect: () => void
}) {
  const handleClick = () => {
    if (isSelected) {
      onDeselect()
    } else {
      onSelect()
    }
  }

  return (
    <div
      className={`p-2 rounded-md cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent"
        }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
          <FileText className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs">{record.title}</div>
          <div className="text-[10px] text-muted-foreground">
            {record.date} • {record.type} • {record.provider}
          </div>
        </div>
        {isSelected && <CheckCircle2 className="h-3 w-3 text-primary" />}
      </div>
      <div className="mt-1 text-[11px]">{record.summary}</div>
    </div>
  )
}