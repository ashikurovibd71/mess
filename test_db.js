const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mess_db',
  password: 'password', // check if password is correct from env
  port: 5432,
});

pool.query('SELECT id, name, email FROM users', (err, res) => {
  if (err) console.error(err);
  else console.log(res.rows);
  pool.end();
});
