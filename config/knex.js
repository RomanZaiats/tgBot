module.exports = {
    client: 'pg',
    connection: 'postgres://postgres:postgres@localhost:5432/patient-bot-db',
    timezone: 'UTC',
    debug: false,
    migrations: {
      directory: '../migrations',
    },
    seeds: {
      directory: '../seeds',
    },
  };
  