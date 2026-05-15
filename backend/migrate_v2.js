const db = require('./db');

async function migrate() {
  try {
    console.log('Starting migration v2...');

    // Add status to users
    const [userColumns] = await db.query('SHOW COLUMNS FROM users LIKE "status"');
    if (userColumns.length === 0) {
      console.log('Adding "status" to users table...');
      await db.query("ALTER TABLE users ADD COLUMN status ENUM('active', 'blocked') NOT NULL DEFAULT 'active' AFTER role");
    }

    // Add is_published to courses
    const [courseColumns] = await db.query('SHOW COLUMNS FROM courses LIKE "is_published"');
    if (courseColumns.length === 0) {
      console.log('Adding "is_published" to courses table...');
      await db.query("ALTER TABLE courses ADD COLUMN is_published BOOLEAN DEFAULT TRUE AFTER teacher_id");
    }

    console.log('✅ Migration v2 completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
