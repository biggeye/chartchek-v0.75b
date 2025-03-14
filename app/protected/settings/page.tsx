'use client';

import { useState, useEffect } from 'react';
import { useFacilityStore } from '@/store/facilityStore';
import { FacilityApiSettings } from '@/types/store/facility';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const { facilities, currentFacilityId, getCurrentFacility, updateFacilityApiSettings, getFacilityApiSettings, isLoading } = useFacilityStore();
  const currentFacility = getCurrentFacility();
  
  const [apiSettings, setApiSettings] = useState<FacilityApiSettings>({
    kipu_api_key: '',
    kipu_api_endpoint: '',
    has_api_key_configured: false
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Load API settings when the page loads or when the facility changes
  useEffect(() => {
    if (currentFacilityId) {
      loadApiSettings(currentFacilityId);
    }
  }, [currentFacilityId]);
  
  const loadApiSettings = async (facilityId: string) => {
    const settings = await getFacilityApiSettings(facilityId);
    if (settings) {
      setApiSettings(settings);
    }
  };
  
  const handleSaveSettings = async () => {
    if (!currentFacilityId) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      // Update the has_api_key_configured flag based on whether an API key is provided
      const updatedSettings = {
        ...apiSettings,
        has_api_key_configured: !!apiSettings.kipu_api_key
      };
      
      const success = await updateFacilityApiSettings(currentFacilityId, updatedSettings);
      
      if (success) {
        setSaveSuccess(true);
        setApiSettings(updatedSettings);
        
        // Reset the success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        setSaveError('Failed to save API settings. Please try again.');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!currentFacility) {
    return (
      <div className="container mx-auto py-10">
        <CustomAlert variant="destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No facility selected</AlertTitle>
          </div>
          <AlertDescription>
            Please select a facility to configure its settings.
          </AlertDescription>
        </CustomAlert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Facility Settings</h1>
      
      <Tabs defaultValue="kipu" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="kipu">KIPU EMR Integration</TabsTrigger>
          <TabsTrigger value="general">General Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kipu">
          <Card>
            <CardHeader>
              <CardTitle>KIPU EMR API Configuration</CardTitle>
              <CardDescription>
                Configure the KIPU EMR API settings for {currentFacility.name}. These settings are required to connect to the KIPU EMR system.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {saveSuccess && (
                <CustomAlert variant="success">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle>Success</AlertTitle>
                  </div>
                  <AlertDescription>
                    API settings saved successfully.
                  </AlertDescription>
                </CustomAlert>
              )}
              
              {saveError && (
                <CustomAlert variant="destructive">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                  </div>
                  <AlertDescription>{saveError}</AlertDescription>
                </CustomAlert>
              )}
              
              <CustomAlert>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                </div>
                <AlertDescription>
                  Your KIPU API key is sensitive information. It will be stored securely and used only for connecting to the KIPU EMR system.
                </AlertDescription>
              </CustomAlert>
              
              <div className="space-y-2">
                <Label htmlFor="kipu_api_key">KIPU API Key</Label>
                <Input
                  id="kipu_api_key"
                  type="password"
                  placeholder="Enter your KIPU API key"
                  value={apiSettings.kipu_api_key || ''}
                  onChange={(e) => setApiSettings({ ...apiSettings, kipu_api_key: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kipu_api_endpoint">KIPU API Endpoint (Optional)</Label>
                <Input
                  id="kipu_api_endpoint"
                  type="text"
                  placeholder="https://api.kipuemr.com/v1"
                  value={apiSettings.kipu_api_endpoint || ''}
                  onChange={(e) => setApiSettings({ ...apiSettings, kipu_api_endpoint: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Leave blank to use the default KIPU API endpoint.
                </p>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving}
                className="mr-2"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
              
              <Button 
                outline
                onClick={() => loadApiSettings(currentFacilityId!)}
                disabled={isSaving}
              >
                Reset
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general settings for {currentFacility.name}.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <p className="text-muted-foreground">
                Additional facility settings will be available in future updates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
