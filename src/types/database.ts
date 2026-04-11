export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  is_platform_admin: boolean
  is_banned: boolean
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'is_platform_admin' | 'is_banned' | 'created_at'>
        Update: Partial<Pick<Profile, 'username' | 'avatar_url' | 'bio'>>
      }
    }
  }
}
