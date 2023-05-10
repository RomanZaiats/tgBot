exports.up = async (knex) => {
    await knex.schema.createTable('doctors', (table) => {
        table.increments();
        table.integer('userId'); //doctors ID
        table.string('specialization');
        table.string('address');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
  };
  
  exports.down = async (knex) => {
    await knex.schema.dropTable('doctors');
  };
  