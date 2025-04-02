"use client"

import { useState, useEffect } from "react"
import { useGlobalChatStore } from "@/store/chat/chatStore"
import type { Patient, PatientRecord } from "@/types/store/globalChat"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, CheckCircle2, User, FileText } from "lucide-react"

export default function PatientModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"patients" | "records">("patients")
  const {
    patients,
    selectedPatient,
    patientRecords,
    selectedRecords,
    isLoadingPatients,
    isLoadingRecords,
    fetchPatients,
    selectPatient,
    selectRecord,
    deselectRecord,
  } = useGlobalChatStore()

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  return (
    <div className="w-full max-w-md mx-auto">
     <Tabs defaultValue="patients" onValueChange={(value) => setActiveTab(value as "patients" | "records")}>     <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="records" disabled={!selectedPatient}>
            Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="mt-4">
          <h3 className="text-sm font-medium mb-2">Select a patient</h3>

          {isLoadingPatients ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 space-y-2">
                {patients.map((patient) => (
                  <PatientItem
                    key={patient.patientId}
                    patient={patient}
                    isSelected={selectedPatient?.patientId === patient.patientId}
                    onSelect={() => selectPatient(patient)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          {selectedPatient && (
            <>
              <h3 className="text-sm font-medium mb-2">Patient Evaluations for {selectedPatient.firstName} {selectedPatient.lastName}</h3>

              {isLoadingRecords ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : patientRecords.length > 0 ? (
                <ScrollArea className="h-[300px] rounded-md border">
                  <div className="p-4 space-y-3">
                    {patientRecords.map((record) => (
                      <RecordItem
                        key={record.id}
                        record={record}
                        isSelected={selectedRecords.some((r) => r.id === record.id)}
                        onSelect={() => selectRecord(record)}
                        onDeselect={() => deselectRecord(record.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No records found for this patient</div>
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
      className={`p-3 rounded-md cursor-pointer transition-colors flex items-center gap-3 ${
        isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent"
      }`}
      onClick={onSelect}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <User className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{patient.firstName} {patient.lastName}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>DOB: {patient.dateOfBirth}</span>
          <span>•</span>
          <span>MRN: {patient.mrn}</span>
        </div>
      </div>
      {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
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
      className={`p-3 rounded-md cursor-pointer transition-colors ${
        isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{record.title}</div>
          <div className="text-xs text-muted-foreground">
            {record.date} • {record.type} • {record.provider}
          </div>
        </div>
        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
      </div>
      <div className="mt-2 text-sm">{record.summary}</div>
    </div>
  )
}

