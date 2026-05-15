const db = require('./db');
async function fix() {
  await db.query('UPDATE users SET role = "admin" WHERE email = "admin@lms.com"');
  console.log('✅ Role admin@lms.com updated to ADMIN');
  process.exit();
}
fix();
