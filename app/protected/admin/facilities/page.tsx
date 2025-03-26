"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFacilityStore } from "@/store/facilityStore";
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
  
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(currentFacilityId?.toString() || null); const [isLoading, setIsLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumDay[]>([]);

  // Forms for different sections
  const basicInfoForm = useForm<BasicInfo>({
    defaultValues: {
      capacity: 0,
      staff: [],
    },
  });

  const statisticsForm = useForm<Statistics>({
    defaultValues: {
      evaluations: [],
      curriculum: [],
    },
  });

  const staffForm = useForm<StaffMember>({
    defaultValues: {
      title: "",
      username: "",
      userId: "",
      name: "",
      role: "",
      email: "",
      phone: "",
      address: "",
      address2: "",
      address3: "",
      city: "",
      state: "",
      zip: "",
    },
  });

  // Load facility data when component mounts or facility changes
  useEffect(() => {
    if (!facilities.length) {
      fetchFacilities();
    }
    
    if (selectedFacilityId) {
      loadFacilityData(selectedFacilityId);
    }
  }, [selectedFacilityId, facilities, fetchFacilities]);

  const loadFacilityData = async (facilityId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/facilities/${facilityId}`);
      if (!response.ok) {
        throw new Error("Failed to load facility data");
      }
      
      const data = await response.json();
      
      // Update form values
      basicInfoForm.reset({
        capacity: data.capacity || 0,
        staff: data.staff || [],
      });
      
      statisticsForm.reset({
        evaluations: data.evaluations || [],
        curriculum: data.curriculum || [],
      });
      
      // Update state
      setStaffMembers(data.staff || []);
      setEvaluations(data.evaluations || []);
      setCurriculum(data.curriculum || []);
      
    } catch (error) {
      console.error(error);
      alert("Failed to load facility data");
    } finally {
      setIsLoading(false);
    }
  };

  const onBasicInfoSubmit = async (data: BasicInfo) => {
    if (!selectedFacilityId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/facilities/${selectedFacilityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          capacity: data.capacity,
          staff: staffMembers,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update facility");
      }
      
      alert("Facility basic information updated successfully");
      
    } catch (error) {
      console.error(error);
      alert("Failed to update facility");
    } finally {
      setIsLoading(false);
    }
  };

  const onStatisticsSubmit = async (data: Statistics) => {
    if (!selectedFacilityId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/facilities/${selectedFacilityId}/statistics`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evaluations: data.evaluations,
          curriculum: data.curriculum,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update facility statistics");
      }
      
      alert("Facility statistics updated successfully");
      
    } catch (error) {
      console.error(error);
      alert("Failed to update facility statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const addStaffMember = (data: StaffMember) => {
    setStaffMembers([...staffMembers, { ...data, userId: crypto.randomUUID() }]);
    staffForm.reset();
  };

  const removeStaffMember = (index: number) => {
    const newStaffMembers = [...staffMembers];
    newStaffMembers.splice(index, 1);
    setStaffMembers(newStaffMembers);
  };

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

          {selectedFacilityId ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Configure facility capacity and staff information
                  </p>
                </div>

                <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
                  <div className="sm:col-span-4">
                    <form onSubmit={basicInfoForm.handleSubmit(onBasicInfoSubmit)}>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="capacity" className="block text-sm font-medium text-gray-900">
                            Capacity
                          </label>
                          <div className="mt-2">
                            <input
                              id="capacity"
                              type="number"
                              className="block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300"
                              {...basicInfoForm.register("capacity", { valueAsNumber: true })}
                            />
                          </div>
                          <p className="mt-1 text-sm text-gray-500">Maximum number of patients this facility can accommodate</p>
                        </div>
                        
                        <div className="space-y-4 mt-6">
                          <h3 className="text-lg font-medium">Staff Members</h3>
                          <hr className="border-t border-gray-200" />
                          
                          {staffMembers.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead>
                                <tr>
                                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
                                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {staffMembers.map((staff, index) => (
                                  <tr key={staff.userId || index}>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{staff.name}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{staff.title}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{staff.role}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{staff.email}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      <button 
                                        type="button"
                                        className="text-red-600 hover:text-red-900"
                                        onClick={() => removeStaffMember(index)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-sm text-gray-500">No staff members added yet.</p>
                          )}
                          
                          <div className="mt-6 border border-gray-200 rounded-md p-4">
                            <h4 className="text-base font-medium mb-4">Add Staff Member</h4>
                            <form onSubmit={staffForm.handleSubmit(addStaffMember)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-900">Name</label>
                                <input
                                  id="name"
                                  type="text"
                                  className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300"
                                  {...staffForm.register("name")}
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-900">Title</label>
                                <input
                                  id="title"
                                  type="text"
                                  className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300"
                                  {...staffForm.register("title")}
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-900">Username</label>
                                <input
                                  id="username"
                                  type="text"
                                  className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300"
                                  {...staffForm.register("username")}
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-900">Role</label>
                                <input
                                  id="role"
                                  type="text"
                                  className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300"
                                  {...staffForm.register("role")}
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-900">Email</label>
                                <input
                                  id="email"
                                  type="email"
                                  className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300"
                                  {...staffForm.register("email")}
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-900">Phone</label>
                                <input
                                  id="phone"
                                  type="text"
                                  className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-gray-900 border border-gray-300"
                                  {...staffForm.register("phone")}
                                />
                              </div>
                              
                              <div className="md:col-span-2 flex justify-end">
                                <button
                                  type="submit"
                                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md"
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Add Staff Member
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-6">
                          <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md"
                            disabled={isLoading}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            Save Basic Information
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Please select a facility to manage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}