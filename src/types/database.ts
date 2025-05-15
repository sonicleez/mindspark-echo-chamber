
// Custom type definitions for Supabase tables
export interface Item {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  tags?: string[];
  dateAdded: Date;
  summary?: string;
}

export interface Profile {
  id: string;
  username?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Database schema representation for Supabase
export interface Database {
  public: {
    Tables: {
      items: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          url: string | null;
          tags: string[] | null;
          summary: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          url?: string | null;
          tags?: string[] | null;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          url?: string | null;
          tags?: string[] | null;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
