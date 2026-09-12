export interface Clip {
  slug: string;
  title: string | null;
  thumb: string | null;
  channel: string | null;
  creatorName: string | null;
  duration: number | null;
  createdAt: string | null;
  viewCount: number | null;
  categoryId: string | null;
  source: 'manual' | 'api';
}

export interface HelixClip {
  id: string;
  title: string;
  thumbnail_url: string;
  broadcaster_name: string;
  creator_name: string;
  duration: number;
  created_at: string;
  view_count: number;
  game_id: string;
}

export interface HelixGame {
  id: string;
  name: string;
}

export interface HelixUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  description: string;
  broadcaster_type: string;
  view_count: number;
  created_at: string;
}

export interface ChannelInfo {
  id: string;
  login: string;
  displayName: string;
  profileImageUrl: string;
  description: string;
  broadcasterType: string;
  totalViewCount: number;
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  clips: Clip[];
}

export type Section = 'clips' | 'tools';
