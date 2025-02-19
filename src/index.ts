import { serve } from '@hono/node-server'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { logger } from 'hono/logger'
import { swaggerUI } from '@hono/swagger-ui'

const app = new OpenAPIHono()
app.use(logger())

app.openapi(
  createRoute({
    method: 'get',
    path: '/hello',
    responses: {
      200: {
        description: 'Respond a message',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string()
            })
          }
        }
      }
    }
  }),
  (c) => {
    return c.json({
      message: 'hello'
    })
  }
)

app.get(
  '/ui',
  swaggerUI({
    url: '/doc'
  })
)

app.doc('/doc', {
  info: {
    title: 'An API',
    version: 'v1'
  },
  openapi: '3.1.0'
})

serve({
  fetch: app.fetch,
  port: 3050
}, (info) => {
  console.log(`Server is running on http://${info.address}:${info.port}`)
})
