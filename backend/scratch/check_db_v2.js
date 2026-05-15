const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'lms_db'
  });

  const [subs] = await connection.query('DESCRIBE submissions');
  console.log('Submissions:', subs.map(f => f.Field));

  const [anns] = await connection.query('DESCRIBE announcements');
  console.log('Announcements:', anns.map(f => f.Field));

  await connection.end();
}

check().catch(console.error);
