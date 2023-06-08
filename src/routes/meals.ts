import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', async (req, res) => {
    const insertMealSchema = z.object({
      name: z.string(),
      description: z.string(),
      createdAt: z.string(),
      isInDiet: z.boolean(),
    })

    const { name, description, createdAt, isInDiet } = insertMealSchema.parse(
      req.body,
    )

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      res.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })
    }

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      createdAt,
      isInDiet,
      sessionId,
    })

    return res.status(201).send()
  })

  app.get(
    '/',
    {
      preHandler: checkSessionIdExists,
    },
    async (req) => {
      const { sessionId } = req.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      return { transactions }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: checkSessionIdExists,
    },
    async (req) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionParamsSchema.parse(req.params)
      const { sessionId } = req.cookies
      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      return { transaction }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: checkSessionIdExists,
    },
    async (req) => {
      const { sessionId } = req.cookies

      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return { summary }
    },
  )
}
