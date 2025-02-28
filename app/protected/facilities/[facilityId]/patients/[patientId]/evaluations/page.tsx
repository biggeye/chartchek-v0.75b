'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import EvaluationForm from '@/components/patient/evaluation-form';
import { 
  Dialog
} from '@/components/ui/dialog';
import { getFacilityData, PatientEvaluation } from '@/lib/kipu';

interface EvaluationsPageProps {
  params: {
    facilityId: string;
    patientId: string;
  };
}

// Custom card components to replace missing exports
const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-muted-foreground ${className || ''}`} {...props}>
    {children}
  </p>
);

// Custom components to replace missing exports
const TableCaption = ({ children, className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) => (
  <caption className={`mt-4 text-sm text-muted-foreground ${className || ''}`} {...props}>
    {children}
  </caption>
);

const DialogContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className || ''}`} {...props}>
    <div className="bg-background rounded-lg border shadow-lg w-full max-w-md md:max-w-xl p-6">
      {children}
    </div>
  </div>
);

const DialogHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left mb-5 ${className || ''}`} {...props}>
    {children}
  </div>
);

const DialogTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`} {...props}>
    {children}
  </h3>
);

const DialogDescription = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-muted-foreground ${className || ''}`} {...props}>
    {children}
  </p>
);

export default function EvaluationsPage({ params }: EvaluationsPageProps) {
  // Access params directly since it's properly typed
  const { facilityId, patientId } = params;
  
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [facility, setFacility] = useState<any>(null);
  const [showNewEvaluation, setShowNewEvaluation] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const router = useRouter();
  
  // Fetch evaluations on component mount using the facilityId from the URL
  useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      try {
        // Get facility data using the facilityId from the URL
        const facilityData = getFacilityData(facilityId);
        
        if (!facilityData) {
          console.error('Facility not found');
          setLoading(false);
          return;
        }
        
        // Set facility data for display
        setFacility({
          name: facilityData.name,
          address: facilityData.address
        });
        
        // Filter evaluations for the specific patient
        const evaluationsData = facilityData.data.evaluations.filter(
          e => e.patient_id === patientId
        );
        
        setEvaluations(evaluationsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [patientId, facilityId]);
  
  const handleEvaluationSuccess = (evaluation: PatientEvaluation) => {
    // In a real app, this would refresh the data from the API
    // For now, just close the dialog and add the new evaluation to the list
    setShowNewEvaluation(false);
    setSelectedEvaluationId(null);
    
    // Refresh the evaluations list
    const facilityData = getFacilityData(facilityId);
    if (facilityData) {
      setEvaluations(facilityData.data.evaluations.filter(
        e => e.patient_id === patientId
      ));
    }
  };
  
  const handleCreateEvaluation = () => {
    setSelectedEvaluationId(null);
    setShowNewEvaluation(true);
  };
  
  const handleViewEvaluation = (evaluationId: string) => {
    setSelectedEvaluationId(evaluationId);
    setShowNewEvaluation(true);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!facility) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Facility not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patient Evaluations</h1>
            <p className="text-muted-foreground">
              {facility.name}
            </p>
          </div>
          <Button onClick={handleCreateEvaluation}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Evaluation
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Evaluations</CardTitle>
            <CardDescription>
              {evaluations.length} {evaluations.length === 1 ? 'evaluation' : 'evaluations'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evaluations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6">
                <p className="text-muted-foreground mb-4">No evaluations found for this patient</p>
                <Button onClick={handleCreateEvaluation}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Evaluation
                </Button>
              </div>
            ) : (
              <Table>
                <TableCaption>
                  List of patient evaluations at {facility.name}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evaluation Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">{evaluation.evaluation_type}</TableCell>
                      <TableCell>
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {evaluation.status || 'Completed'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {evaluation.notes || 'No notes'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          outline={true}
                          className="text-sm px-2 py-1"
                          onClick={() => handleViewEvaluation(evaluation.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog 
        open={showNewEvaluation} 
        onClose={() => setShowNewEvaluation(false)}
      >
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>
              {selectedEvaluationId ? 'Edit Evaluation' : 'New Evaluation'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvaluationId 
                ? 'Update the evaluation details below' 
                : 'Enter the evaluation details below'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <EvaluationForm 
              patientId={patientId}
              evaluationId={selectedEvaluationId || undefined}
              facilityId={facilityId}
              onSuccess={handleEvaluationSuccess}
              onCancel={() => setShowNewEvaluation(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
