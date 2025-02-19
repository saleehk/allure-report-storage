import { z } from '@hono/zod-openapi'

export const CreateReportSchema = z.object({
  name: z.string().min(1).describe('Report name'),
  content: z.object({}).passthrough().describe('Report content')
})

export const ReportResponseSchema = z.object({
  message: z.string(),
  report: z.object({
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string()
  })
})

export const ReportListResponseSchema = z.object({
  reports: z.array(z.object({
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string()
  }))
})

export const ErrorResponseSchema = z.object({
  error: z.string()
})

export const AllureReportResponseSchema = z.object({
  message: z.string(),
  outputDir: z.string()
})

export const StaticFileResponseSchema = z.object({
  type: z.string().describe('Content type of the file'),
  content: z.instanceof(Uint8Array).describe('File content')
})

export const FileUploadSchema = z.object({
  'files[]': z.array(z.any()).describe('Array of files to upload')
})

export type CreateReportRequest = z.infer<typeof CreateReportSchema>
export type ReportResponse = z.infer<typeof ReportResponseSchema>
export type ReportListResponse = z.infer<typeof ReportListResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
export type FileUploadResponse = z.infer<typeof FileUploadSchema> 