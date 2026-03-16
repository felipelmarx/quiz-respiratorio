export type UserRole = 'master' | 'instructor'

export type Permission =
  | 'view_dashboard'
  | 'view_responses'
  | 'view_contacts'
  | 'export_data'
  | 'manage_settings'

export type UserPermissions = Record<Permission, boolean>

export const ALL_PERMISSIONS: Permission[] = [
  'view_dashboard',
  'view_responses',
  'view_contacts',
  'export_data',
  'manage_settings',
]

export const DEFAULT_PERMISSIONS: UserPermissions = {
  view_dashboard: true,
  view_responses: true,
  view_contacts: true,
  export_data: true,
  manage_settings: true,
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_dashboard: 'Ver Dashboard',
  view_responses: 'Ver Respostas',
  view_contacts: 'Ver Contatos',
  export_data: 'Exportar Dados',
  manage_settings: 'Configurações',
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: UserRole
          whatsapp: string | null
          avatar_url: string | null
          slug: string | null
          is_active: boolean
          permissions: UserPermissions
          profissao: string | null
          cidade: string | null
          nome_clinica: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: UserRole
          whatsapp?: string | null
          avatar_url?: string | null
          slug?: string | null
          is_active?: boolean
          permissions?: UserPermissions
          profissao?: string | null
          cidade?: string | null
          nome_clinica?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: UserRole
          whatsapp?: string | null
          avatar_url?: string | null
          slug?: string | null
          is_active?: boolean
          permissions?: UserPermissions
          profissao?: string | null
          cidade?: string | null
          nome_clinica?: string | null
          updated_at?: string
        }
      }
      quiz_leads: {
        Row: {
          id: string
          instructor_id: string | null
          name: string
          email: string
          phone: string | null
          referral: string | null
          created_at: string
        }
        Insert: {
          id?: string
          instructor_id?: string | null
          name: string
          email: string
          phone?: string | null
          referral?: string | null
          created_at?: string
        }
        Update: {
          instructor_id?: string | null
          name?: string
          email?: string
          phone?: string | null
          referral?: string | null
        }
      }
      quiz_responses: {
        Row: {
          id: string
          lead_id: string | null
          instructor_id: string | null
          answers: Record<string, unknown>
          scores: Record<string, number>
          total_score: number
          profile: string
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          instructor_id?: string | null
          answers: Record<string, unknown>
          scores: Record<string, number>
          total_score: number
          profile: string
          created_at?: string
        }
        Update: {
          answers?: Record<string, unknown>
          scores?: Record<string, number>
          total_score?: number
          profile?: string
        }
      }
      invite_tokens: {
        Row: {
          id: string
          token: string
          is_active: boolean
          created_by: string
          created_at: string
          deactivated_at: string | null
        }
        Insert: {
          id?: string
          token: string
          is_active?: boolean
          created_by: string
          created_at?: string
          deactivated_at?: string | null
        }
        Update: {
          is_active?: boolean
          deactivated_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          details: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details?: Record<string, unknown> | null
          created_at?: string
        }
        Update: Record<string, never>
      }
    }
  }
}

export interface InviteToken {
  id: string
  token: string
  is_active: boolean
  created_by: string
  created_at: string
  deactivated_at: string | null
}

export interface QuizScores {
  padrao: number
  sintomas: number
  consciencia: number
  tolerancia: number
}

export type QuizProfile = 'funcional' | 'atencao_moderada' | 'disfuncao' | 'disfuncao_severa'

export interface QuizSubmission {
  name: string
  email: string
  phone?: string
  referral?: string
  instructor_slug?: string
  answers: Record<string, unknown>
  scores: QuizScores
  total_score: number
  profile: QuizProfile
}

export interface DashboardStats {
  totalLeads: number
  totalResponses: number
  averageScore: number
  profileDistribution: Record<QuizProfile, number>
  recentLeads: Database['public']['Tables']['quiz_leads']['Row'][]
}
