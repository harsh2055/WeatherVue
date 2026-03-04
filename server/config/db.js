const { neon } = require('@neondatabase/serverless');

// This uses the connection string from your Neon dashboard
const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };