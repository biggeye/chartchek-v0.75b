export type RunStatus = 
  | 'queued' 
  | 'in_progress' 
  | 'completed' 
  | 'failed' 
  | 'cancelled'
  | 'expired'
  | 'cancelling'
  | 'requires_action'

export interface Run {
  id: string
  object: 'run'
  thread_id: string
  assistant_id: string
  status: RunStatus
  created_at: number
  started_at?: number | null
  completed_at?: number | null
  last_error?: string | null
  metadata?: Record<string, any> | null
}

export interface RunStep {
  id: string
  object: 'run.step'
  run_id: string
  type: 'message_creation' | 'tool_calls'
  status: RunStatus
  created_at: number
  completed_at?: number | null
  metadata?: Record<string, any> | null
}
