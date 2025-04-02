"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFacilityStore } from "@/store/patient/facilityStore";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PlusCircle, Trash2, Save, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { KipuStatisticsService } from "@/lib/kipu/stats/statisticsService";
import { FacilityStatistics } from "@/lib/kipu/stats/types";


// Define schemas for form validation
const staffMemberSchema = z.object({
  title: z.string().min(1, "Title is required"),
  username: z.string().min(1, "Username is required"),
  userId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

const basicInfoSchema = z.object({
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  staff: z.array(staffMemberSchema).optional(),
});

const evaluationSchema = z.object({
  createdAt: z.string().optional(),
  completedAt: z.string().optional(),
  evaluationId: z.string().optional(),
});

const curriculumDaySchema = z.object({
  day: z.number().min(1).max(7),
  activities: z.array(z.object({
    name: z.string().min(1, "Activity name is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    description: z.string().optional(),
  })),
});

const statisticsSchema = z.object({
  evaluations: z.array(evaluationSchema).optional(),
  curriculum: z.array(curriculumDaySchema).optional(),
});

type StaffMember = z.infer<typeof staffMemberSchema>;
type BasicInfo = z.infer<typeof basicInfoSchema>;
type Evaluation = z.infer<typeof evaluationSchema>;
type CurriculumDay = z.infer<typeof curriculumDaySchema>;
type Statistics = z.infer<typeof statisticsSchema>;

export default function AdminFacilitiesPage() {
  const router = useRouter();
  const { facilities, currentFacilityId, fetchFacilities } = useFacilityStore();
  const [facilityStats, setFacilityStats] = useState<FacilityStatistics | null>(null);

  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(currentFacilityId?.toString() || null); const [isLoading, setIsLoading] = useState(false);

  // Load facility data when component mounts or facility changes
  useEffect(() => {
    if (!facilities.length) {
      fetchFacilities();
    }

    if (selectedFacilityId) {
      loadFacilityData(selectedFacilityId);
    }
  }, [selectedFacilityId, facilities, fetchFacilities]);

  // Modify the loadFacilityData function to also fetch statistics
  const loadFacilityData = async (facilityId: string) => {
    setIsLoading(true);
    try {
      // Fetch KIPU statistics
      await fetchFacilityStatistics(facilityId);

    } catch (error) {
      console.error(error);
      alert("Failed to load facility data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFacilityStatistics = async (facilityId: string) => {

    try {
      const response = await fetch(`/api/kipu/facilities/${facilityId}`)
      
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }
    
    const stats = await response.json();
    setFacilityStats(stats);
  } catch (error) {
    console.error("Error fetching facility statistics:", error);
  } finally {
    setIsLoading(false);
  }
};

  // Inside the return statement, replace the current content structure with tabs
  return (
    <div className="container py-6">
      <div className="h-full w-full overflow-y-auto mb-15">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Facility Administration</h1>
            <div className="flex items-center gap-4">
              <select
                className="px-3 py-2 border rounded-md"
                value={selectedFacilityId || ""}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select a facility</option>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center"
                onClick={() => fetchFacilities()}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {selectedFacilityId && (
            <Tabs defaultValue="basic-info">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="statistics">Facility Statistics</TabsTrigger>
                <TabsTrigger value="kipu-stats">KIPU Statistics</TabsTrigger>
              </TabsList>

              {/* Statistics Tab */}
              <TabsContent value="statistics">
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Facility Statistics</h2>
                  </CardHeader>
                  <CardContent>
                    {/* Existing statistics content */}
                    {/* ... */}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* KIPU Statistics Tab */}
              <TabsContent value="kipu-stats">
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">KIPU Statistics</h2>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center p-4">
                        <span>Loading statistics...</span>
                      </div>
                    ) : facilityStats ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Patient Statistics</h3>
                          <div className="space-y-2">
                            <div>Total Patients: {facilityStats.patient.demographics.totalPatients}</div>
                            <div>Active Patients: {facilityStats.patient.demographics.activePatients}</div>
                            <div>Average Age: {facilityStats.patient.demographics.avgAge.toFixed(1)}</div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-2">Operational Statistics</h3>
                          <div className="space-y-2">
                            <div>Bed Utilization: {facilityStats.operational.capacityStats.bedUtilization.toFixed(1)}%</div>
                            <div>Average Length of Stay: {facilityStats.operational.admissionStats.avgLengthOfStay.toFixed(1)} days</div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-2">Treatment Statistics</h3>
                          <div className="space-y-2">
                            <div>Avg Length of Stay: {facilityStats.treatment.treatment_duration.avg_length_of_stay.toFixed(1)} days</div>
                            <div>Goal Completion Rate: {facilityStats.treatment.treatment_plan.goal_completion_rate.toFixed(1)}%</div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-2">Outcome Statistics</h3>
                          <div className="space-y-2">
                            <div>Completion Rate: {facilityStats.outcomes.program_completion.completion_rate.toFixed(1)}%</div>
                            <div>Readmission Rate: {facilityStats.outcomes.readmissions.readmission_rate.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <p>No statistics available</p>
                        <Button
                          onClick={() => selectedFacilityId && fetchFacilityStatistics(selectedFacilityId)}
                          className="mt-2"
                        >
                          Refresh Statistics
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}