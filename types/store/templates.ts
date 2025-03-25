// types/templates.ts
export interface ChartChekTemplate {
    id: string;
    name: string;
    version: string;
    description: string;
    sourceSystem?: string; // e.g., "KIPU", "ChartChek"
    targetSystems: string[]; // e.g., ["KIPU", "ChartChek"]
    fields: TemplateField[];
    transformations: TemplateTransformation[];
    validationRules: ValidationRule[];
  }
  
  export interface TemplateField {
    id: string;
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    mappings: {
      [systemName: string]: string; // Maps to field names in other systems
    };
  }
  
  export interface TemplateTransformation {
    id: string;
    sourceField: string;
    targetField: string;
    transformationType: string; // e.g., "map", "convert", "format"
    transformationOptions?: Record<string, any>;
  }
  
  export interface ValidationRule {
    id: string;
    field: string;
    ruleType: string; // e.g., "required", "format", "range"
    errorMessage: string;
    parameters?: Record<string, any>;
  }