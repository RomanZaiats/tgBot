exports.up = async (knex) => {
    await knex.schema.createTable('appointments', (table) => {
        table.increments();
        table.integer('userId');
        table.integer('doctorId');
        table.string('datetime');
        table.boolean('isHappened').notNullable().defaultTo(false);
        table.string('summaryPath');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
  };
  
  exports.down = async (knex) => {
    await knex.schema.dropTable('appointments');
  };
  