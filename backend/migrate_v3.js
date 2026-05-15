const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  console.log('🚀 Début de la migration v3 (Direct IP)...');
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_db'
    });

    console.log('✅ Connexion OK');

    const [subCols] = await connection.query('DESCRIBE submissions');
    if (!subCols.some(c => c.Field === 'total')) {
      console.log('➕ Ajout total...');
      await connection.query('ALTER TABLE submissions ADD COLUMN total INT DEFAULT 0 AFTER score');
    }

    const [annCols] = await connection.query('DESCRIBE announcements');
    if (!annCols.some(c => c.Field === 'title')) {
      console.log('➕ Ajout title...');
      await connection.query('ALTER TABLE announcements ADD COLUMN title VARCHAR(200) NOT NULL AFTER teacher_id');
    }

    console.log('🎉 Migration v3 terminée !');
    await connection.end();
  } catch (err) {
    console.error('❌ ERREUR :', err);
  } finally {
    process.exit();
  }
}
migrate();
