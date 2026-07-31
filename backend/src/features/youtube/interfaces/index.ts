export interface IYoutubeSyncLog {
  id?: string;
  channel_id: string;
  video_id?: string;
  status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
}

export interface IVideoMetadata {
  youtube_video_id: string;
  title: string;
  description: string;
  published_date: Date;
  thumbnail_url: string | null;
  duration: number;
  views: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}
