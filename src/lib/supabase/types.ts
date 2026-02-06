export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      puzzles: {
        Row: {
          id: string;
          puzzle_date: string;
          name: string;
          seed: number;
          created_at: string;
          ladders: Json;
        };
        Insert: {
          id: string;
          puzzle_date: string;
          name: string;
          seed: number;
          created_at: string;
          ladders: Json;
        };
        Update: {
          id?: string;
          puzzle_date?: string;
          name?: string;
          seed?: number;
          created_at?: string;
          ladders?: Json;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          puzzle_date: string;
          participant_key: string;
          user_id: string | null;
          display_name: string;
          total_score: number;
          total_seconds: number;
          ladders_solved: number;
          used_hints: number;
          moves_over_par: number;
          created_at: string;
        };
        Insert: {
          id: string;
          puzzle_date: string;
          participant_key: string;
          user_id?: string | null;
          display_name: string;
          total_score: number;
          total_seconds: number;
          ladders_solved: number;
          used_hints: number;
          moves_over_par: number;
          created_at: string;
        };
        Update: {
          id?: string;
          puzzle_date?: string;
          participant_key?: string;
          user_id?: string | null;
          display_name?: string;
          total_score?: number;
          total_seconds?: number;
          ladders_solved?: number;
          used_hints?: number;
          moves_over_par?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
