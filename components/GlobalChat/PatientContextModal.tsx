'use client'

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PatientBasicInfo } from '@/types/patient';
import { ContextCategory, ContextItem } from '@/types/context';
import { useKipuEvaluationsStore } from '@/store/kipuEvaluationsStore';

interface PatientContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  patient: PatientBasicInfo;
  contextCategories: ContextCategory[];
  selectedItems: ContextItem[];
  onItemSelect: (item: ContextItem) => void;
}

export default function PatientContextModal({
  isOpen,
  onClose,
  onSave,
  patient,
  contextCategories,
  selectedItems,
  onItemSelect
}: PatientContextModalProps) {
  const { patientEvaluations, isLoading } = useKipuEvaluationsStore();
  
  // Function to check if an item is selected
  const isItemSelected = (itemId: string) => {
    return selectedItems.some(item => item.id === itemId);
  };
  
  // Handle select all evaluations
  const handleSelectAllEvaluations = () => {
    const evaluationCategory = contextCategories.find(cat => cat.id === 'clinical');
    if (evaluationCategory) {
      const evaluationItem = evaluationCategory.items.find(item => item.id === 'evaluations');
      if (evaluationItem && !isItemSelected('evaluations')) {
        onItemSelect(evaluationItem);
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">
              Select Context for {patient.firstName} {patient.lastName}
            </h2>
          </div>
          
          <div className="p-4 overflow-y-auto">
            {contextCategories.map((category) => (
              <div key={category.id} className="mb-4">
                <h3 className="font-medium mb-2">{category.label}</h3>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div key={item.id} className="flex items-center">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={isItemSelected(item.id)}
                        onCheckedChange={() => onItemSelect(item)}
                      />
                      <label
                        htmlFor={`item-${item.id}`}
                        className="ml-2 text-sm font-medium cursor-pointer"
                      >
                        {item.label}
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </label>
                    </div>
                  ))}
                </div>
                
                {/* Special handling for evaluations */}
                {category.id === 'clinical' && isItemSelected('evaluations') && (
                  <div className="mt-2 ml-6">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Patient Evaluations</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllEvaluations}
                      >
                        Select All
                      </Button>
                    </div>
                    
                    {isLoading ? (
                      <div className="text-sm text-gray-500">Loading evaluations...</div>
                    ) : patientEvaluations.length > 0 ? (
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {patientEvaluations.map((eval) => (
                          <div key={eval.id} className="text-sm">
                            {eval.name || `Evaluation ${eval.id}`}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No evaluations found</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}