import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { ProjectService } from '../services/ProjectService.js'
import {
  CreateProjectSchema,
  ProjectResponseSchema,
  ErrorResponseSchema,
  ProjectListResponseSchema
} from '../types/project.js'

export const createProjectRoutes = (rootDir: string) => {
  const router = new OpenAPIHono()
  const projectService = new ProjectService(rootDir)

  router.openapi(
    createRoute({
      method: 'post',
      path: '/projects',
      request: {
        body: {
          content: {
            'application/json': {
              schema: CreateProjectSchema
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Project created successfully',
          content: {
            'application/json': {
              schema: ProjectResponseSchema
            }
          }
        },
        400: {
          description: 'Invalid request or project already exists',
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
        const { name } = await c.req.json()
        await projectService.createProject(name)
        return c.json({
          message: 'Project created successfully',
          project: name
        }, 201)
      } catch (error) {
        return c.json({
          error: 'Failed to create project'
        }, 400)
      }
    }
  )

  router.openapi(
    createRoute({
      method: 'get',
      path: '/projects',
      responses: {
        200: {
          description: 'List of all projects',
          content: {
            'application/json': {
              schema: ProjectListResponseSchema
            }
          }
        }
      }
    }),
    async (c) => {
      const projects = await projectService.listProjects()
      return c.json({ projects })
    }
  )

  router.openapi(
    createRoute({
      method: 'delete',
      path: '/projects/{name}',
      request: {
        params: CreateProjectSchema
      },
      responses: {
        200: {
          description: 'Project deleted successfully',
          content: {
            'application/json': {
              schema: ProjectResponseSchema
            }
          }
        },
        404: {
          description: 'Project not found',
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
        const { name } = c.req.param()
        await projectService.deleteProject(name)
        return c.json({
          message: 'Project deleted successfully',
          project: name
        }, 200)
      } catch (error) {
        return c.json({
          error: 'Project not found or could not be deleted'
        }, 404)
      }
    }
  )

  return router
} 