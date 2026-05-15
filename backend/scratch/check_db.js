const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lms_db'
  });

  console.log('--- SUBMISSIONS ---');
  const [subs] = await connection.query('DESCRIBE submissions');
  console.table(subs);

  console.log('--- ANNOUNCEMENTS ---');
  const [anns] = await connection.query('DESCRIBE announcements');
  console.table(anns);

  await connection.end();
}

check().catch(console.error);
