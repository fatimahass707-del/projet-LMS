const db = require('./db');
const bcrypt = require('bcrypt');

async function updatePasswords() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    const [result] = await db.query('UPDATE users SET password_hash = ?', [hash]);
    console.log(`✅ ${result.affectedRows} passwords updated successfully!`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

updatePasswords();
