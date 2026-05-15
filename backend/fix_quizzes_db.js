const mysql = require('mysql2/promise');
require('dotenv').config();

async function runFix() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1', // Use IP directly
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lms_db'
  });

  try {
    console.log('Verifying quizzes table...');
    const [rows] = await connection.query('DESCRIBE quizzes');
    const hasCourseId = rows.some(r => r.Field === 'course_id');
    
    if (!hasCourseId) {
      console.log('Adding missing course_id column...');
      await connection.query('ALTER TABLE quizzes ADD COLUMN course_id INT NOT NULL AFTER id');
      await connection.query('ALTER TABLE quizzes ADD CONSTRAINT fk_quiz_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE');
      console.log('FIX SUCCESSFUL!');
    } else {
      console.log('Column already exists.');
    }
  } catch (err) {
    console.error('FIX FAILED:', err);
  } finally {
    await connection.end();
  }
}

runFix();
