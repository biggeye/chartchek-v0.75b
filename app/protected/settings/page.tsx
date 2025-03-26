'use client';

import { useState, useEffect } from 'react';
import { useFacilityStore } from '@/store/facilityStore';
import { UserApiSettings } from '@/types/store/user';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Info, Key, Globe, User, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserProfile from '@/components/profile/UserProfile';

const supabase = createClient();
const user = await supabase.auth.getUser();
const userId = user.data?.user?.id;
// Custom card components to extend the existing ones
const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props}>
    {children}
  </p>
);

const CardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props}>
    {children}
  </div>
);

// Custom alert components
const CustomAlert = ({ className, children, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" | "success" }) => {
  const variantStyles = {
    default: "bg-primary/10 border-primary/20 text-primary-foreground",
    destructive: "bg-destructive/10 border-destructive/20 text-destructive",
    success: "bg-green-50 border-green-200 text-green-800"
  };

  return (
    <div 
      className={cn(
        "relative w-full rounded-lg border p-4 mb-4",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const AlertTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn("font-medium leading-none tracking-tight mb-1", className)} {...props}>
    {children}
  </h5>
);

const AlertDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm", className)} {...props}>
    {children}
  </p>
);

export default function SettingsPage() {
  const { facilities, currentFacilityId, getCurrentFacility, isLoading } = useFacilityStore();
  const currentFacility = getCurrentFacility();
  
  // Add client-side only rendering state
  const [isClient, setIsClient] = useState(false);
  
  const [apiSettings, setApiSettings] = useState<UserApiSettings>({
    kipu_access_id: '',
    kipu_secret_key: '',
    kipu_app_id: '',
    kipu_api_endpoint: 'https://api.kipuapi.com',
    has_api_key_configured: false
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{success: boolean; message: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Load API settings when the page loads
  useEffect(() => {
    loadApiSettings();
  }, []);
  
  const loadApiSettings = async () => {
    try {
      const supabase = createClient();
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      console.log('API Settings userId: ', userId);
      if (!user) {
        console.error('No authenticated user found');
        return;
      }
      
      // Get the user API settings
      const { data, error } = await supabase
        .from('user_api_settings')
        .select('*')
        .eq('owner_id', userId)
        .single();
      
      if (error) {
        console.warn('Error fetching user API settings:', error);
        // Set default values
        setApiSettings({
          kipu_access_id: '',
          kipu_secret_key: '',
          kipu_app_id: '',
          kipu_api_endpoint: 'https://api.kipuapi.com',
          has_api_key_configured: false
        });
        return;
      }
      
      if (data) {
        setApiSettings({
          kipu_access_id: data.kipu_access_id || '',
          kipu_secret_key: data.kipu_secret_key || '',
          kipu_app_id: data.kipu_app_id || '',
          kipu_api_endpoint: data.kipu_api_endpoint || 'https://api.kipuapi.com',
          has_api_key_configured: Boolean(
            data.kipu_access_id && 
            data.kipu_secret_key && 
            data.kipu_app_id && 
            data.kipu_api_endpoint
          )
        });
      }
    } catch (error) {
      console.error('Error loading API settings:', error);
    }
  };
  
  /**
   * Handles saving API settings
   */
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    
    try {
      const supabase = createClient();
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSaveError('No authenticated user found');
        setIsSaving(false);
        return;
      }
      
      // Validate required fields
      if (!apiSettings.kipu_access_id || !apiSettings.kipu_secret_key || !apiSettings.kipu_app_id) {
        setSaveError('Please fill in all required fields');
        setIsSaving(false);
        return;
      }
      
      // Check if API settings are configured
      const hasApiKeyConfigured = !!(
        apiSettings.kipu_access_id && 
        apiSettings.kipu_secret_key && 
        apiSettings.kipu_app_id
      );
      
      // Create the API settings object to save
      const apiSettingsToSave = {
        owner_id: user.id,
        kipu_access_id: apiSettings.kipu_access_id,
        kipu_secret_key: apiSettings.kipu_secret_key,
        kipu_app_id: apiSettings.kipu_app_id,
        kipu_api_endpoint: apiSettings.kipu_api_endpoint || 'https://api.kipuapi.com',
        has_api_key_configured: hasApiKeyConfigured
      };
      
      // Save API settings to Supabase
      // First check if the user already has settings
      const { data: existingSettings } = await supabase
        .from('user_api_settings')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      let saveError;
      
      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('user_api_settings')
          .update(apiSettingsToSave)
          .eq('owner_id', user.id);
        
        saveError = error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('user_api_settings')
          .insert(apiSettingsToSave);
        
        saveError = error;
      }
      
      if (saveError) {
        console.error('Error saving API settings:', saveError);
        setSaveError(`Failed to save API settings: ${saveError.message}`);
        setIsSaving(false);
        return;
      }
      
      // If API settings were saved successfully and credentials are configured,
      // fetch and store facilities using the server-side API route
      if (hasApiKeyConfigured) {
        console.log('api key configured')
      } else {
        setSaveSuccess(true);
        setSuccessMessage('Your API settings have been saved successfully.');
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error saving API settings:', error);
      setSaveError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTestConnection = async () => {
    if (!currentFacilityId) {
      setTestConnectionResult({
        success: false,
        message: 'Please select a facility first'
      });
      return;
    }
    
    setTestingConnection(true);
    setTestConnectionResult(null);
    
    try {
      // Test the connection by calling the KIPU API
      const response = await fetch(`/api/kipu/test-connection?facilityId=${currentFacilityId}`);
      const result = await response.json();
      
      if (response.ok) {
        setTestConnectionResult({
          success: true,
          message: 'Connection successful! Your API credentials are working correctly.'
        });
      } else {
        setTestConnectionResult({
          success: false,
          message: result.error || 'Connection failed. Please check your API credentials.'
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestConnectionResult({
        success: false,
        message: 'Connection test failed due to a network error. Please try again.'
      });
    } finally {
      setTestingConnection(false);
    }
  };
  
  return (
    <div className="container py-8">
      {isClient ? (
        <>
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          
          <Tabs defaultValue="api" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>KIPU EMR API Configuration</CardTitle>
                  <CardDescription>
                    Configure your KIPU EMR API credentials to enable integration with ChartChek.
                    These credentials will be used to access all facilities you have permission for.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {saveSuccess && (
                    <CustomAlert variant="success">
                      <div className="flex">
                        <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5" />
                        <div>
                          <AlertTitle>Success</AlertTitle>
                          <AlertDescription>{successMessage}</AlertDescription>
                        </div>
                      </div>
                    </CustomAlert>
                  )}
                  
                  {saveError && (
                    <CustomAlert variant="destructive">
                      <div className="flex">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                        <div>
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{saveError}</AlertDescription>
                        </div>
                      </div>
                    </CustomAlert>
                  )}
                  
                  <CustomAlert>
                    <div className="flex">
                      <Info className="h-4 w-4 mr-2 mt-0.5" />
                      <div>
                        <AlertTitle>About KIPU API Credentials</AlertTitle>
                        <AlertDescription>
                          You need to obtain API credentials from your KIPU EMR administrator.
                          These credentials will allow ChartChek to securely access patient data
                          across all facilities you have permission to access in KIPU.
                        </AlertDescription>
                      </div>
                    </div>
                  </CustomAlert>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="kipu_access_id" className="flex items-center">
                        <Key className="h-4 w-4 mr-2" />
                        Access ID
                      </Label>
                      <Input
                        id="kipu_access_id"
                        value={apiSettings.kipu_access_id}
                        onChange={(e) => setApiSettings({...apiSettings, kipu_access_id: e.target.value})}
                        placeholder="Enter your KIPU Access ID"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="kipu_secret_key" className="flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        Secret Key
                      </Label>
                      <Input
                        id="kipu_secret_key"
                        type="password"
                        value={apiSettings.kipu_secret_key}
                        onChange={(e) => setApiSettings({...apiSettings, kipu_secret_key: e.target.value})}
                        placeholder="Enter your KIPU Secret Key"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="kipu_app_id" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        App ID (Recipient ID)
                      </Label>
                      <Input
                        id="kipu_app_id"
                        value={apiSettings.kipu_app_id}
                        onChange={(e) => setApiSettings({...apiSettings, kipu_app_id: e.target.value})}
                        placeholder="Enter your KIPU App ID"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="kipu_api_endpoint" className="flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        API Endpoint URL
                      </Label>
                      <Input
                        id="kipu_api_endpoint"
                        value={apiSettings.kipu_api_endpoint}
                        onChange={(e) => setApiSettings({...apiSettings, kipu_api_endpoint: e.target.value})}
                        placeholder="Enter the KIPU API endpoint URL"
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button 
                    outline
                    onClick={handleTestConnection}
                    disabled={testingConnection || !apiSettings.has_api_key_configured || !currentFacilityId}
                  >
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                  
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </CardFooter>
              </Card>
              
              {testConnectionResult && (
                <Card>
                  <CardContent className="pt-6">
                    <CustomAlert variant={testConnectionResult.success ? 'success' : 'destructive'}>
                      <div className="flex">
                        {testConnectionResult.success ? (
                          <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                        )}
                        <div>
                          <AlertTitle>{testConnectionResult.success ? 'Success' : 'Error'}</AlertTitle>
                          <AlertDescription>{testConnectionResult.message}</AlertDescription>
                        </div>
                      </div>
                    </CustomAlert>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                <UserProfile userId={userId || ''} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>User Preferences</CardTitle>
                  <CardDescription>
                    Customize your experience with ChartChek.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    User preferences will be available in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        // Loading state while client-side rendering is not ready
        <div>Loading settings...</div>
      )}
    </div>
  );
}
