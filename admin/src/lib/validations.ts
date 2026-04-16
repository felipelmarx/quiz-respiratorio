import { z } from 'zod'

export const quizScoresSchema = z.object({
  padrao: z.number().min(0).max(12),
  sintomas: z.number().min(0).max(12),
  consciencia: z.number().min(0).max(3),
  tolerancia: z.number().min(0).max(6),
})

export const quizProfileSchema = z.enum([
  'funcional',
  'atencao_moderada',
  'disfuncao',
  'disfuncao_severa',
])

// Qualitative lead metadata captured by the Stories-style qualification form.
// Kept permissive (passthrough) because the quiz client evolves faster than
// the admin, and we don't want new optional fields to break submissions.
// All numeric wellbeing values are 1-10 sliders.
export const extraDataSchema = z
  .object({
    wellbeing_before: z.number().int().min(1).max(10).nullable().optional(),
    wellbeing_after: z.number().int().min(1).max(10).nullable().optional(),
    wellbeing_delta: z.number().int().min(-10).max(10).nullable().optional(),
    problems: z.array(z.string().max(50)).max(20).optional(),
    pains: z.array(z.string().max(50)).max(20).optional(),
    commitment: z.enum(['committed', 'maybe', 'unsure']).optional(),
    schedule: z.array(z.string().max(20)).max(10).optional(),
    source: z.string().max(50).optional(),
  })
  .passthrough()

export const quizSubmissionSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).trim().toLowerCase(),
  phone: z.string().max(20).optional(),
  referral: z.string().email().max(255).optional().or(z.literal('')),
  instructor_slug: z.string().max(100).optional(),
  answers: z.record(z.string().max(50), z.union([z.string(), z.number(), z.boolean(), z.null()])).refine(
    (obj) => Object.keys(obj).length <= 50,
    'Máximo de 50 respostas'
  ),
  scores: quizScoresSchema,
  total_score: z.number().min(0).max(33),
  profile: quizProfileSchema,
  // Optional qualitative metadata from Stories-style qualification form
  extra_data: extraDataSchema.optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido').trim().toLowerCase(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const instructorCreateSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(100).trim(),
  email: z.string().email('Email inválido').trim().toLowerCase(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  whatsapp: z.string().max(20).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug: apenas letras minúsculas, números e hífens').optional(),
  profissao: z.string().max(100).optional(),
  cidade: z.string().max(100).optional(),
  nome_clinica: z.string().max(200).optional(),
})

export const signupSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  name: z.string().min(2, 'Nome obrigatório').max(100).trim(),
  email: z.string().email('Email inválido').max(255).trim().toLowerCase(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  whatsapp: z.string().max(20).optional(),
  profissao: z.string().max(100).optional(),
  cidade: z.string().max(100).optional(),
})

export const instructorUpdateSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  whatsapp: z.string().max(20).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  is_active: z.boolean().optional(),
  profissao: z.string().max(100).optional(),
  cidade: z.string().max(100).optional(),
  nome_clinica: z.string().max(200).optional(),
  license_expires_at: z.string().datetime().nullable().optional(),
})

export const permissionsSchema = z.object({
  view_dashboard: z.boolean(),
  view_responses: z.boolean(),
  view_contacts: z.boolean(),
  export_data: z.boolean(),
  manage_settings: z.boolean(),
})
