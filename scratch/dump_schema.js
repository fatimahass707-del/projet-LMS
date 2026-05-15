const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function dumpSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lms_db'
  });

  try {
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    for (const tableName of tableNames) {
      console.log(`\n--- TABLE: ${tableName} ---`);
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      console.table(columns);
      
      const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
      console.log(createTable[0]['Create Table']);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

dumpSchema();
