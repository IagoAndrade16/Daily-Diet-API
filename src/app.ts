import fastify from 'fastify'
import { dietRoutes } from './routes/transactions'
import cookie from '@fastify/cookie'

export const app = fastify()

app.register(cookie)

app.register(dietRoutes, {
  prefix: 'dietRoutes',
})
