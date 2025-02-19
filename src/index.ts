#!/usr/bin/env node
import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { logger } from 'hono/logger'
import { swaggerUI } from '@hono/swagger-ui'
import { createProjectRoutes } from './routes/project.js'
import { createReportRoutes } from './routes/report.js'

const app = new OpenAPIHono()
app.use(logger())

// Get root directory from environment variable
const ROOT_DIR = process.env.ROOT_DIR || './storage'

// Mount routes
app.route('/', createProjectRoutes(ROOT_DIR))
app.route('/', createReportRoutes(ROOT_DIR))

app.get(
  '/ui',
  swaggerUI({
    url: '/doc'
  })
)

app.doc('/doc', {
  info: {
    title: 'Allure Report Storage API',
    version: 'v1',
    description: 'API for managing allure report projects and their storage'
  },
  openapi: '3.1.0'
})

serve({
  fetch: app.fetch,
  port: 3050
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
