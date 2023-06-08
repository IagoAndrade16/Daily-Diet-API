import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('meals', function (table) {
    table.uuid('id').primary()
    table.string('name', 255).notNullable()
    table.string('description', 255).notNullable()
    table.timestamp('createdAt').notNullable()
    table.string('sessionId').index()
    table.boolean('isInDiet').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('meals')
}
