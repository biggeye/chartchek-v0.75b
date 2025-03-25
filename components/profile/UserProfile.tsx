'use client'

import React, { useState, useEffect, FormEvent, Fragment } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ChatThread } from '@/types/database'
import { ThreadRun } from '@/types/store/stream'
import { Tabs, TabsList, TabsTrigger, TabsPanel } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TextArea from '@/components/ui/text-area'

interface ProfileData {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string | null
  is_owner: boolean
  title: string | null
  phone_number: string | null
  specialty: string | null
  about: string | null
  profile_image_url: string | null
  facility_id: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  username: string | null
  created_at: string
  updated_at: string
}

interface UserProfileProps {
  userId: string
}

export default function UserProfile({ userId }: UserProfileProps) {
  const supabase = createClient()
  
  // State management
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [runs, setRuns] = useState<ThreadRun[]>([])
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [threadRuns, setThreadRuns] = useState<Record<string, any[]>>({})
  const [activeTab, setActiveTab] = useState('profile')

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    title: '',
    phone_number: '',
    specialty: '',
    about: '',
    profile_image_url: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
  })

  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (profileError) throw profileError

        // Fetch threads
        const { data: threadsData, error: threadsError } = await supabase
          .from('chat_threads')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (threadsError) throw threadsError

        // Fetch runs
        const { data: runsData, error: runsError } = await supabase
          .from('thread_runs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (runsError) throw runsError

        // Organize runs by thread_id
        const runsByThread: Record<string, any[]> = {}
        runsData.forEach((run) => {
          if (!runsByThread[run.thread_id]) {
            runsByThread[run.thread_id] = []
          }
          runsByThread[run.thread_id].push(run)
        })

        setProfile(profileData)
        setFormData({
          first_name: profileData?.first_name || '',
          last_name: profileData?.last_name || '',
          email: profileData?.email || '',
          title: profileData?.title || '',
          phone_number: profileData?.phone_number || '',
          specialty: profileData?.specialty || '',
          about: profileData?.about || '',
          profile_image_url: profileData?.profile_image_url || '',
          address: profileData?.address || '',
          city: profileData?.city || '',
          state: profileData?.state || '',
          zip_code: profileData?.zip_code || '',
          country: profileData?.country || '',
        })
        setThreads(threadsData)
        setRuns(runsData)
        setThreadRuns(runsByThread)
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Failed to load user data. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchUserData()
    }
  }, [userId, supabase])

  const handleThreadRefresh = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/openai/threads/enrich')
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Update the threads with the enriched data
      setThreads(data.enrichedThreads)
      
      // Fetch the updated runs to refresh the runs data
      const { data: runsData, error: runsError } = await supabase
        .from('thread_runs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        
      if (runsError) throw runsError
      
      // Organize runs by thread_id
      const runsByThread: Record<string, any[]> = {}
      runsData.forEach((run) => {
        if (!runsByThread[run.thread_id]) {
          runsByThread[run.thread_id] = []
        }
        runsByThread[run.thread_id].push(run)
      })
      
      setRuns(runsData)
      setThreadRuns(runsByThread)
      
      setSuccessMessage('Thread data refreshed successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error refreshing thread data:', error)
      setError('Failed to refresh thread data. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          title: formData.title,
          phone_number: formData.phone_number,
          specialty: formData.specialty,
          about: formData.about,
          profile_image_url: formData.profile_image_url,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          country: formData.country,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        
      if (updateError) throw updateError
      
      setSuccessMessage('Profile updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile. Please try again later.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-4">
          {successMessage}
        </div>
      )}
      
      <Tabs value={activeTab} onChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="history">Chat History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsPanel value="profile" className="space-y-8">
          <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Your first name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Your last name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Your professional title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    placeholder="Your specialty"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="about">About</Label>
                  <TextArea
                    id="about"
                    name="about"
                    value={formData.about || ''}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profile_image_url">Profile Image URL</Label>
                  <Input
                    id="profile_image_url"
                    name="profile_image_url"
                    value={formData.profile_image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </TabsPanel>
        
        <TabsPanel value="history" className="space-y-8">
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Chat Threads</h2>
                <Button 
                  onClick={handleThreadRefresh} 
                  className="text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Refreshing...' : 'Refresh Thread Data'}
                </Button>
              </div>
              
              {isLoading ? (
                <div className="text-center py-4">Loading threads...</div>
              ) : threads.length === 0 ? (
                <div className="text-center py-4">No threads found</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thread ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Runs
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {threads.map((thread: any) => (
                        <Fragment key={thread.id}>
                          <tr 
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedThreadId === thread.thread_id ? 'bg-blue-50' : ''}`}
                            onClick={() => setSelectedThreadId(selectedThreadId === thread.thread_id ? null : thread.thread_id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {thread.title || 'Untitled Thread'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {thread.thread_id ? thread.thread_id.substring(0, 12) + '...' : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                thread.status === 'completed' ? 'bg-green-100 text-green-800' :
                                thread.status === 'failed' ? 'bg-red-100 text-red-800' :
                                thread.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {thread.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {thread.created_at ? new Date(thread.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                {threadRuns[thread.thread_id]?.length || 0} runs
                              </span>
                            </td>
                          </tr>
                          
                          {/* Expandable runs section */}
                          {selectedThreadId === thread.thread_id && threadRuns[thread.thread_id]?.length > 0 && (
                            <tr>
                              <td colSpan={5} className="px-0 py-0">
                                <div className="bg-gray-50 p-4">
                                  <h3 className="text-sm font-medium text-gray-700 mb-2">Runs for Thread: {thread.title || 'Untitled Thread'}</h3>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                      <thead className="bg-gray-100">
                                        <tr>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Run ID
                                          </th>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                          </th>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                          </th>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Completed
                                          </th>
                                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tokens
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {threadRuns[thread.thread_id].map((run: any) => (
                                          <tr key={run.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 font-mono">
                                              {run.run_id ? run.run_id.substring(0, 8) + '...' : 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                run.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                run.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                run.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                              }`}>
                                                {run.status}
                                              </span>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                              {run.created_at ? new Date(run.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                              {run.completed_at ? new Date(run.completed_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                              {run.total_tokens || 'N/A'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </TabsPanel>
        
        <TabsPanel value="settings" className="space-y-8">
          <div className="space-y-8">
            <h2 className="text-xl font-semibold">Settings</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  placeholder="Your address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  placeholder="Your city"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleInputChange}
                  placeholder="Your state"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code || ''}
                  onChange={handleInputChange}
                  placeholder="Your ZIP code"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country || ''}
                  onChange={handleInputChange}
                  placeholder="Your country"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Button type="button" onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Update Settings'}
              </Button>
            </div>
          </div>
        </TabsPanel>
      </Tabs>
    </div>
  )
}
