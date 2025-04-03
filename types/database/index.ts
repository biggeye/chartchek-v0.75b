export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'indexed' | 'failed' | 'unsupported_format'

interface CodeInterpreterResources {
  file_ids: string[];  // Maximum of 20 files
}

interface FileSearchResources {
  vector_store_ids: string[];  // Maximum of 1 vector store
}

export interface ToolResources {
  code_interpreter?: CodeInterpreterResources;
  file_search?: FileSearchResources;
}

// Database Types

export interface UserAssistant {
  id: string
  created_at?: string
  updated_at?: string
  user_id: string
  assistant_id: string
  name: string
  instructions: string
  description: string
  model: string
  tools: ToolType[]
  tool_resources?: ToolResources
  file_ids?: string[]
  metadata?: Record<string, any>
  is_active?: boolean
  vector_store_id?: string
}

export type ToolType = 'code_interpreter' | 'file_search';

interface Tool {
  type: ToolType;
}

interface CodeInterpreterTool extends Tool {
  type: 'code_interpreter';
}

interface FileSearchTool extends Tool {
  type: 'file_search';
}

export interface ChatMessageAttachment {
  file_id: string;
  tools: (CodeInterpreterTool | FileSearchTool)[];
}

interface FileCitation {
  file_id: string;
  quote?: string;
}

interface FilePath {
  file_id: string;
}

export interface ChatMessageAnnotation {
  type: 'file_citation' | 'file_path';
  text: string;
  file_citation?: FileCitation;
  file_path?: FilePath;
  start_index: number;
  end_index: number;
}

export interface TextContent {
  value: string
  annotations?: ChatMessageAnnotation[]
}

type MessageStatus = 'in_progress' | 'incomplete' | 'completed';

interface IncompleteDetails {
  reason?: string;
  // Add other relevant fields as needed
}

export type MessageContent = {
  type: 'text' | 'image_file' | 'image_url';
  text?: {
    value: string;
    annotations: ChatMessageAnnotation[];
  };
  image_file?: {
    file_id: string;
  };
  image_url?: {
    url: string;
  };
};

export interface ChatMessage {
  id: string;
  object: 'thread.message';
  created_at: number;
  thread_id: string;
  role: 'user' | 'assistant';
  content: MessageContent | MessageContent[];
  assistant_id?: string;
  run_id?: string;
  file_ids?: string[];
  attachments?: ChatMessageAttachment[];
  metadata: Record<string, any>;
}

export interface ChatThread {
  id: string;
  user_id: string;
  assistant_id: string | null;
  status: string;
  messages: ChatMessage[];
  created_at: string | null;
  updated_at: string | null;
  metadata?: Record<string, any>;
  thread_id: string;
  current_files?: Document[];
  title?: string;
  last_message_at: string | null;
  is_active: boolean;
  tool_resources: ToolResources | null; 
  last_run?: string | null;
  last_run_status?: string | null;
  additional_instructions?: string;
}


// types/database/index.ts
import { Json } from '../supabase';

export type ComplianceConcernType = 'medical' | 'financial' | 'legal' | 'other';

export interface Document {
  bucket?: string;
  compliance_concern?: ComplianceConcernType;
  compliance_concern_other?: string | null;
  created_at: string;
  document_id: string;
  facility_id?: string | null;
  file_name?: string | null;
  file_path: string;
  file_size?: string | null;
  file_type?: string | null;
  metadata?: Json[] | null;
  openai_file_id?: string | null;
  patient_id?: string | null;
  processing_error?: string | null;
  processing_status?: string | null;
  updated_at: string;
  user_id: string;
}
export interface ThreadMessage {
  id: string;
  object: string;
  created_at: number;
  thread_id: string;
  role: 'user' | 'assistant';
  content: MessageContent[];
  file_ids: string[];
  assistant_id: string | null;  // <-- This is defined as string | null
  run_id: string | null;
  metadata: Record<string, any> | null;
}