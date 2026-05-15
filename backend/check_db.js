const db = require('./db');

async function checkSchema() {
  try {
    const [columns] = await db.query('SHOW COLUMNS FROM chapters');
    console.log('Columns in chapters table:', columns.map(c => c.Field));
    process.exit(0);
  } catch (err) {
    console.error('Error checking schema:', err);
    process.exit(1);
  }
}

checkSchema();
