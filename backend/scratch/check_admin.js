const db = require('../db');
async function check() {
  const [users] = await db.query('SELECT name, email, role FROM users WHERE email = "admin@lms.com"');
  console.table(users);
  process.exit();
}
check();
