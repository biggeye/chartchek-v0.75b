// patientContextStore.ts
import { create } from 'zustand';
import {
  KipuPatientEvaluation,
  KipuPatientEvaluationItem
} from '@/types/kipu';

interface SelectedEvaluationItem {
  evaluationId: number;
  evaluationName: string;
  itemId: number;
  itemLabel: string;
  itemValue: string | null;
}

interface PatientContextStore {
  currentPatientId: string | null;
  patientEvaluations: KipuPatientEvaluation[];
  selectedEvaluations: Map<number, KipuPatientEvaluation>; // Map evaluationId → Evaluation
  selectedEvaluationItems: Map<number, SelectedEvaluationItem[]>; // evaluationId → array of selected items
  
  // Actions
  setCurrentPatient: (patientId: string) => void;
  setPatientEvaluations: (evaluations: KipuPatientEvaluation[]) => Promise<any[]>;
  toggleEvaluationSelection: (evaluationId: number) => void;
  toggleEvaluationItemSelection: (
    evaluationId: number,
    item: SelectedEvaluationItem
  ) => void;

  buildContextPrompt: () => string; // For LLM prompt
}

export const usePatientContextStore = create<PatientContextStore>((set, get) => ({
  currentPatientId: null,
  patientEvaluations: [],
  selectedEvaluations: new Map(),
  selectedEvaluationItems: new Map(),

  setCurrentPatient: (patientId: string) =>
    set({ currentPatientId: patientId, patientEvaluations: [], selectedEvaluations: new Map(), selectedEvaluationItems: new Map() }),

  setPatientEvaluations: (evaluations: KipuPatientEvaluation[]) =>
    set({ patientEvaluations: evaluations }),

  toggleEvaluationSelection: (evaluationId: number) => {
    const currentMap = new Map(get().selectedEvaluations);
    if (currentMap.has(evaluationId)) {
      currentMap.delete(evaluationId);
    } else {
      const evalToAdd = get().patientEvaluations.find(e => e.id === evaluationId);
      if (evalToAdd) currentMap.set(evaluationId, evalToAdd);
    }
    set({ selectedEvaluations: currentMap });
  },

  toggleEvaluationItemSelection: (evaluationId: number, item: SelectedEvaluationItem) => {
    const currentItemsMap = new Map(get().selectedEvaluationItems);
    const currentItems = currentItemsMap.get(evaluationId) || [];

    const itemExists = currentItems.find(i => i.itemId === item.itemId);
    if (itemExists) {
      currentItemsMap.set(evaluationId, currentItems.filter(i => i.itemId !== item.itemId));
    } else {
      currentItemsMap.set(evaluationId, [...currentItems, item]);
    }
    set({ selectedEvaluationItems: currentItemsMap });
  },

  buildContextPrompt: () => {
    const itemsMap = get().selectedEvaluationItems;
    const evaluations = get().selectedEvaluations;

    let context = '';

    evaluations.forEach(evaluation => {
      context += `\n\nEvaluation: ${evaluation.name}\n`;
      const selectedItems = itemsMap.get(evaluation.id);

      if (selectedItems && selectedItems.length > 0) {
        selectedItems.forEach(item => {
          context += `- ${item.itemLabel}: ${item.itemValue || 'N/A'}\n`;
        });
      } else {
        context += `*No specific items selected; full evaluation content included.*\n`;
        evaluation.patientEvaluationItems.forEach(item => {
          context += `- ${item.label}: ${item.description || 'N/A'}\n`;
        });
      }
    });

    return context.trim();
  },
}));
