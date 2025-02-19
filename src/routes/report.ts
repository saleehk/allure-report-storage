import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { ReportService } from '../services/ReportService.js'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { lookup } from 'mime-types'
import {
  CreateReportSchema,
  ReportResponseSchema,
  ReportListResponseSchema,
  ErrorResponseSchema,
  FileUploadSchema,
  AllureReportResponseSchema,
  StaticFileResponseSchema
} from '../types/report.js'
import type { ErrorResponse } from '../types/report.js'
import { z } from '@hono/zod-openapi'

const ProjectParamSchema = z.object({
  projectId: z.string().min(1).describe('Project ID')
})

const ReportParamSchema = z.object({
  projectId: z.string().min(1).describe('Project ID'),
  reportName: z.string().min(1).describe('Report name')
})

// Define a schema for binary data response
const BinaryResponseSchema = z.object({
  type: z.string(),
  content: z.instanceof(Buffer)
})

export const createReportRoutes = (rootDir: string) => {
  const router = new OpenAPIHono()
  const reportService = new ReportService(rootDir)

  // Create Report
  router.openapi(
    createRoute({
      method: 'post',
      path: '/projects/{projectId}/reports',
      request: {
        params: ProjectParamSchema,
        body: {
          content: {
            'application/json': {
              schema: CreateReportSchema
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Report created successfully',
          content: {
            'application/json': {
              schema: ReportResponseSchema
            }
          }
        },
        400: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    async (c) => {
      try {
        const { projectId } = c.req.param()
        const report = await c.req.json()
        const metadata = await reportService.createReport(projectId, report)
        
        return c.json({
          message: 'Report created successfully',
          report: metadata
        }, 201)
      } catch (error) {
        return c.json({
          error: 'Failed to create report'
        }, 400)
      }
    }
  )

  // List Reports
  router.openapi(
    createRoute({
      method: 'get',
      path: '/projects/{projectId}/reports',
      request: {
        params: ProjectParamSchema
      },
      responses: {
        200: {
          description: 'List of reports',
          content: {
            'application/json': {
              schema: ReportListResponseSchema
            }
          }
        }
      }
    }),
    async (c) => {
      const { projectId } = c.req.param()
      const reports = await reportService.listReports(projectId)
      return c.json({ reports })
    }
  )

  // Get Report
  router.openapi(
    createRoute({
      method: 'get',
      path: '/projects/{projectId}/reports/{reportName}',
      request: {
        params: ReportParamSchema
      },
      responses: {
        200: {
          description: 'Report content',
          content: {
            'application/json': {
              schema: z.object({}).passthrough()
            }
          }
        },
        404: {
          description: 'Report not found',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    async (c) => {
      try {
        const { projectId, reportName } = c.req.param()
        const report = await reportService.getReport(projectId, reportName)
        return c.json(report)
      } catch (error) {
        return c.json({
          error: 'Report not found'
        }, 404)
      }
    }
  )

  // Update Report
  router.openapi(
    createRoute({
      method: 'put',
      path: '/projects/{projectId}/reports/{reportName}',
      request: {
        params: ReportParamSchema,
        body: {
          content: {
            'application/json': {
              schema: z.object({}).passthrough()
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Report updated successfully',
          content: {
            'application/json': {
              schema: ReportResponseSchema
            }
          }
        },
        404: {
          description: 'Report not found',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    async (c) => {
      try {
        const { projectId, reportName } = c.req.param()
        const content = await c.req.json()
        const metadata = await reportService.updateReport(projectId, reportName, content)
        
        return c.json({
          message: 'Report updated successfully',
          report: metadata
        })
      } catch (error) {
        return c.json({
          error: 'Report not found'
        }, 404)
      }
    }
  )

  // Delete Report
  router.openapi(
    createRoute({
      method: 'delete',
      path: '/projects/{projectId}/reports/{reportName}',
      request: {
        params: ReportParamSchema
      },
      responses: {
        200: {
          description: 'Report deleted successfully',
          content: {
            'application/json': {
              schema: z.object({
                message: z.string()
              })
            }
          }
        },
        404: {
          description: 'Report not found',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    async (c) => {
      try {
        const { projectId, reportName } = c.req.param()
        await reportService.deleteReport(projectId, reportName)
        return c.json({
          message: 'Report deleted successfully'
        })
      } catch (error) {
        return c.json({
          error: 'Report not found'
        }, 404)
      }
    }
  )

  // Upload Files to Report
  router.openapi(
    createRoute({
      method: 'post',
      path: '/projects/{projectId}/reports/{reportName}/files',
      request: {
        params: ReportParamSchema,
        body: {
          content: {
            'multipart/form-data': {
              schema: FileUploadSchema
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Files uploaded successfully',
          content: {
            'application/json': {
              schema: z.object({
                message: z.string(),
                files: z.array(z.object({
                  filename: z.string(),
                  path: z.string()
                }))
              })
            }
          }
        },
        400: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    async (c) => {
      try {
        const { projectId, reportName } = c.req.param()
        const formData = await c.req.formData()
        const files: File[] = []

        // Collect all files from form data
        for (const [key, value] of formData.entries()) {
          if (key === 'files[]' && value instanceof File) {
            files.push(value)
          }
        }

        if (files.length === 0) {
          return c.json({
            error: 'No files provided'
          }, 400)
        }

        const uploadedFiles = await reportService.uploadFiles(projectId, reportName, files)
        
        return c.json({
          message: 'Files uploaded successfully',
          files: uploadedFiles
        }, 201)
      } catch (error) {
        console.error('File upload error:', error)
        return c.json({
          error: 'Failed to upload files'
        }, 400)
      }
    }
  )

  // Generate Allure Report
  router.openapi(
    createRoute({
      method: 'post',
      path: '/projects/{projectId}/reports/{reportName}/generate-allure',
      request: {
        params: ReportParamSchema
      },
      responses: {
        200: {
          description: 'Allure report generated successfully',
          content: {
            'application/json': {
              schema: AllureReportResponseSchema
            }
          }
        },
        400: {
          description: 'Failed to generate report',
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          }
        }
      }
    }),
    async (c) => {
      try {
        const { projectId, reportName } = c.req.param()
        const result = await reportService.generateAllureReport(projectId, reportName)
        
        return c.json({
          message: 'Allure report generated successfully',
          outputDir: result.outputDir
        })
      } catch (error) {
        if (error instanceof Error) {
          return c.json({
            error: error.message
          }, 400)
        }
        return c.json({
          error: 'Failed to generate Allure report'
        }, 400)
      }
    }
  )

  // Serve Allure Report Root
  router.openapi(
    createRoute({
      method: 'get',
      path: '/projects/{projectId}/reports/{reportName}/allure',
      request: {
        params: z.object({
          projectId: z.string().min(1).describe('Project ID'),
          reportName: z.string().min(1).describe('Report name')
        })
      },
      responses: {
        302: {
          description: 'Redirect to index.html',
          headers: {
            Location: {
              description: 'Redirect location',
              schema: z.string()
            }
          }
        }
      }
    }),
    async (c) => {
      const { projectId, reportName } = c.req.param()
      return c.redirect(`/projects/${projectId}/reports/${reportName}/allure/index.html`)
    }
  )

  // Serve Allure Report Files
  router.get('/projects/:projectId/reports/:reportName/allure/*', async (c) => {
    const { projectId, reportName } = c.req.param()
    const filepath = c.req.path.split('/allure/')[1] || 'index.html'

    try {
      const reportBasePath = await reportService.getAllureReportPath(projectId, reportName)
      const fullPath = join(reportBasePath, filepath)

      // Ensure the requested file is within the report directory
      if (!fullPath.startsWith(reportBasePath)) {
        return new Response(
          JSON.stringify({ error: 'Invalid file path' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      try {
        const content = await readFile(fullPath)
        const contentType = lookup(fullPath) || 'application/octet-stream'
        
        // Return the file content with appropriate content type
        return new Response(content, {
          status: 200,
          headers: { 'Content-Type': contentType }
        })
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error reading file:', error.message)
        }
        return new Response(
          JSON.stringify({ error: 'File not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error getting report path:', error.message)
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  })

  return router
} 