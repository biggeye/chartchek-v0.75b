'use client';

import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { PatientEvaluation, PatientEvaluationItem, fetchPatientEvaluation, createPatientEvaluation } from '@/lib/kipu';

// Import custom TextArea since Textarea component doesn't export correctly
const Textarea = ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" {...props} />;
};

// Create simplified RadioGroup components
const RadioGroup = ({ children, value, disabled, onValueChange }: { 
  children: React.ReactNode; 
  value: string; 
  disabled?: boolean;
  onValueChange: (value: string) => void;
}) => {
  return (
    <div className="flex flex-col space-y-2" role="radiogroup">
      {children}
    </div>
  );
};

const RadioGroupItem = ({ id, value, name }: { id: string; value: string; name?: string }) => {
  return (
    <input type="radio" id={id} value={value} name={name} className="mr-2" />
  );
};

// Create simplified Select components
const Select = ({ children, value, disabled, onValueChange }: {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange(e.target.value);
  };
  
  return (
    <select 
      value={value} 
      onChange={handleChange}
      disabled={disabled}
      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
  );
};

const SelectValue = ({ placeholder }: { placeholder: string }) => {
  return <span className="text-muted-foreground">{placeholder}</span>;
};

const SelectTrigger = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => {
  return <option value={value}>{children}</option>;
};

interface EvaluationFormProps {
  patientId: string;
  evaluationId?: string;
  facilityId?: string;
  onSuccess?: (evaluation: PatientEvaluation) => void;
  onCancel?: () => void;
}

export default function EvaluationForm({ 
  patientId, 
  evaluationId, 
  facilityId,
  onSuccess, 
  onCancel 
}: EvaluationFormProps) {
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<PatientEvaluation | null>(null);
  const [evaluationItems, setEvaluationItems] = useState<PatientEvaluationItem[]>([]);
  
  // Form fields
  const [evaluationType, setEvaluationType] = useState('');
  const [notes, setNotes] = useState('');
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const fetchData = async () => {
      if (evaluationId) {
        setLoading(true);
        try {
          const evaluationData = fetchPatientEvaluation(evaluationId, facilityId);
          
          if (evaluationData) {
            setEvaluation(evaluationData);
            setEvaluationType(evaluationData.evaluation_type);
            setNotes(evaluationData.notes || '');
            
            // Initialize form values if items exist
            if (evaluationData.items && evaluationData.items.length > 0) {
              const initialValues: Record<string, any> = {};
              
              evaluationData.items.forEach(item => {
                initialValues[item.id] = item.answer || '';
              });
              
              setFormValues(initialValues);
              setEvaluationItems(evaluationData.items);
            }
          }
        } catch (error) {
          console.error('Error fetching evaluation:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Initialize with some default evaluation items for a new evaluation
        setEvaluationItems([
          {
            id: 'item_1',
            evaluation_id: '',
            question: 'Patient current symptoms',
            answer_type: 'text',
            required: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'item_2',
            evaluation_id: '',
            question: 'Substance use history',
            answer_type: 'radio',
            options: ['None', 'Occasional', 'Moderate', 'Heavy'],
            required: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'item_3',
            evaluation_id: '',
            question: 'Mental health assessment',
            answer_type: 'select',
            options: ['No concerns', 'Mild symptoms', 'Moderate symptoms', 'Severe symptoms'],
            required: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'item_4',
            evaluation_id: '',
            question: 'Requires follow-up',
            answer_type: 'checkbox',
            required: false,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    };
    
    fetchData();
  }, [evaluationId, facilityId]);
  
  const handleFormValueChange = (itemId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [itemId]: value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!evaluationType) {
      alert('Please select an evaluation type');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare items with answers
      const items = evaluationItems.map(item => ({
        ...item,
        answer: formValues[item.id] !== undefined ? String(formValues[item.id]) : '',
        evaluation_id: evaluationId || '',
      }));
      
      // Create evaluation data
      const evaluationData: Omit<PatientEvaluation, 'id' | 'created_at'> = {
        patient_id: patientId,
        evaluation_type: evaluationType,
        notes: notes,
        status: 'completed',
        items: items,
      };
      
      // Call API to create/update evaluation
      const result = createPatientEvaluation(evaluationData, facilityId);
      
      if (result) {
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderFormControl = (item: PatientEvaluationItem) => {
    switch (item.answer_type) {
      case 'text':
        return (
          <Input
            id={item.id}
            value={formValues[item.id] || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormValueChange(item.id, e.target.value)}
            required={item.required}
            disabled={loading}
          />
        );
      case 'checkbox':
        return (
          <Checkbox
            id={item.id}
            checked={!!formValues[item.id]}
            onChange={(checked) => handleFormValueChange(item.id, checked)}
            disabled={loading}
          />
        );
      case 'radio':
        return (
          <RadioGroup
            value={formValues[item.id] || ''}
            onValueChange={(value) => handleFormValueChange(item.id, value)}
            disabled={loading}
          >
            {item.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${item.id}-${index}`} />
                <Label htmlFor={`${item.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'select':
        return (
          <Select
            value={formValues[item.id] || ''}
            onValueChange={(value) => handleFormValueChange(item.id, value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${item.question}`} />
            </SelectTrigger>
            <SelectContent>
              {item.options?.map((option, index) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <h3 className="font-semibold leading-none tracking-tight">
            {evaluationId ? 'Edit Evaluation' : 'New Evaluation'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {evaluationId ? 'Update the evaluation details below' : 'Enter the evaluation details below'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="evaluation-type">Evaluation Type</Label>
              <Select
                value={evaluationType}
                onValueChange={setEvaluationType}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select evaluation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detox intake">Detox Intake</SelectItem>
                  <SelectItem value="psychiatric">Psychiatric Evaluation</SelectItem>
                  <SelectItem value="medical">Medical Evaluation</SelectItem>
                  <SelectItem value="therapy">Therapy Session</SelectItem>
                  <SelectItem value="discharge">Discharge Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Evaluation items */}
            {evaluationItems.map((item) => (
              <div key={item.id} className="space-y-2">
                <Label htmlFor={item.id}>
                  {item.question}
                  {item.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderFormControl(item)}
              </div>
            ))}
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                disabled={loading}
                rows={4}
              />
            </div>
          </div>
        </CardContent>
        <div className="flex items-center justify-end space-x-4 p-6 pt-0">
          <Button 
            type="button" 
            onClick={onCancel}
            disabled={loading}
            outline={true}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {evaluationId ? 'Update' : 'Create'} Evaluation
          </Button>
        </div>
      </form>
    </Card>
  );
}
