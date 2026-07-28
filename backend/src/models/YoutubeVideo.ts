export type YoutubeImportStatus = 'NEW' | 'REVIEWED' | 'LINKED' | 'IGNORED';

export interface YoutubeVideo {
  id: string;
  youtubeVideoId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  youtubeUrl: string;
  publishedAt: string;
  duration?: string;
  channelId: string;
  channelName: string;
  viewCount: number;
  likeCount: number;
  tags?: string[];
  playlist?: string;
  importStatus: YoutubeImportStatus;
  linkedBhajanId?: string | null;
  lastSynced: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncHistory {
  id: string;
  startedAt: string;
  completedAt?: string;
  videosImported: number;
  videosUpdated: number;
  videosIgnored: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
}
