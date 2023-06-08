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

  app.patch(
    '/:id',
    {
      preHandler: checkSessionIdExists,
    },
    async (req, res) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const updateMealSchema = z.object({
        name: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        createdAt: z.string().nullable().optional(),
        isInDiet: z.boolean().nullable().optional(),
      })

      const { sessionId } = req.cookies
      const { id } = getMealParamsSchema.parse(req.params)
      const updateInput = updateMealSchema.parse(req.body)

      const meal = await knex('meals')
        .where('sessionId', sessionId)
        .andWhere('id', id)
        .select()
        .first()

      if (!meal) {
        return res.status(400).send({
          message: 'MEAL_NOT_FOUND',
        })
      }

      await knex('meals')
        .update({
          name: updateInput.name ?? meal.name,
          description: updateInput.description ?? meal.description,
          createdAt: updateInput.createdAt ?? meal.createdAt,
          isInDiet: updateInput.isInDiet ?? meal.isInDiet,
        })
        .where('id', id)
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: checkSessionIdExists,
    },
    async (req) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { sessionId } = req.cookies
      const { id } = getMealParamsSchema.parse(req.params)

      await knex('meals')
        .delete()
        .where('id', id)
        .andWhere('sessionId', sessionId)
    },
  )

  app.get(
    '/',
    {
      preHandler: checkSessionIdExists,
    },
    async (req) => {
      const { sessionId } = req.cookies

      const meals = await knex('meals').where('sessionId', sessionId).select()

      return { meals }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: checkSessionIdExists,
    },
    async (req) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { sessionId } = req.cookies
      const { id } = getMealParamsSchema.parse(req.params)

      const meal = await knex('meals')
        .where('sessionId', sessionId)
        .andWhere('id', id)
        .select()
        .first()

      return { meal }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: checkSessionIdExists,
    },
    async (req) => {
      const { sessionId } = req.cookies

      const meals = await knex('meals').where('sessionId', sessionId)

      const mealsInDiet = meals.filter((meal) => meal.isInDiet)
      const mealsNotInDiet = meals.filter((meal) => !meal.isInDiet)

      return {
        totalMeals: meals.length,
        mealsInDiet: mealsInDiet.length,
        mealsNotInDiet: mealsNotInDiet.length,
      }
    },
  )
}
