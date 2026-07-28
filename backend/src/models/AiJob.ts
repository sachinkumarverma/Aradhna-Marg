export interface AiJob {
  id: string;
  job_name: string;
  content_type: string;
  action_type: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  total_items: number;
  processed_items: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAiJobDTO {
  job_name: string;
  content_type: string;
  action_type: string;
  total_items?: number;
}
