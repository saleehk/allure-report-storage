import { z } from '@hono/zod-openapi'

export const CreateProjectSchema = z.object({
  name: z.string().min(1).describe('Project name')
})

export const ProjectResponseSchema = z.object({
  message: z.string(),
  project: z.string()
})

export const ErrorResponseSchema = z.object({
  error: z.string()
})

export const ProjectListResponseSchema = z.object({
  projects: z.array(z.string())
})

export type CreateProjectRequest = z.infer<typeof CreateProjectSchema>
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema> 