const db = require('./db');

async function fixDatabase() {
  try {
    console.log('Connexion à la base de données...');
    
    // 1. Vérifier si la colonne order_num existe
    const [columns] = await db.query('SHOW COLUMNS FROM chapters');
    const hasOrderNum = columns.some(c => c.Field === 'order_num');

    if (!hasOrderNum) {
      console.log("Ajout de la colonne 'order_num' à la table 'chapters'...");
      await db.query('ALTER TABLE chapters ADD COLUMN order_num INT DEFAULT 1');
      console.log('✅ Colonne ajoutée avec succès !');
    } else {
      console.log("✅ La colonne 'order_num' existe déjà.");
    }

    console.log('Base de données prête.');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('❌ ERREUR : Impossible de se connecter à MySQL. Vérifiez que votre serveur (XAMPP/WAMP) est bien DÉMARRÉ.');
    } else {
      console.error('❌ Erreur lors de la réparation :', err.message);
    }
    process.exit(1);
  }
}

fixDatabase();
