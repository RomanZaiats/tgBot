exports.up = async (knex) => {
  await knex.schema.createTable('users', (table) => {
      table.increments();
      table.integer('tgId');
      table.integer('chatId');
      table.boolean('isAdmin').notNullable().defaultTo(false);
      table.boolean('isDoctor').notNullable().defaultTo(false);
      table.string('firstName');
      table.string('lastName');
      table.string('username');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('users');
};
