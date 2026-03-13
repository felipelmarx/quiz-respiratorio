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

export const quizSubmissionSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).trim().toLowerCase(),
  phone: z.string().max(20).optional(),
  referral: z.string().email().max(255).optional().or(z.literal('')),
  instructor_slug: z.string().max(100).optional(),
  answers: z.record(z.string(), z.unknown()),
  scores: quizScoresSchema,
  total_score: z.number().min(0).max(33),
  profile: quizProfileSchema,
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
})

export const instructorUpdateSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  whatsapp: z.string().max(20).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  is_active: z.boolean().optional(),
})
