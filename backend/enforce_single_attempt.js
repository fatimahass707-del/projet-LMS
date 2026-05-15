const mysql = require('mysql2/promise');
require('dotenv').config();

async function enforceSingleAttempt() {
  console.log('🚀 Enforcing single attempt for quizzes...');
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_db'
    });

    console.log('✅ Connected to database');

    // 1. Remove duplicate submissions if any exist (keep the earliest one)
    console.log('🧹 Cleaning up any existing duplicate submissions...');
    await connection.query(`
      DELETE s1 FROM submissions s1
      INNER JOIN submissions s2 
      WHERE s1.id > s2.id 
      AND s1.student_id = s2.student_id 
      AND s1.quiz_id = s2.quiz_id
    `);

    // 2. Add unique constraint
    console.log('🔗 Adding UNIQUE constraint (student_id, quiz_id) to submissions table...');
    try {
        await connection.query('ALTER TABLE submissions ADD UNIQUE KEY unique_student_quiz (student_id, quiz_id)');
        console.log('🎉 UNIQUE constraint added successfully!');
    } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
            console.log('⚠️ Constraint already exists.');
        } else {
            throw err;
        }
    }

    await connection.end();
  } catch (err) {
    console.error('❌ ERROR during migration:', err);
  } finally {
    process.exit();
  }
}

enforceSingleAttempt();
