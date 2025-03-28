const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testMongoConnection() {
  const uri = process.env.MONGODB_URI;

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000
  });

  try {
    console.log("Tentative de connexion...");
    
    await client.connect();
    
    console.log("✅ Connexion réussie !");
    
    const database = client.db('admin');
    const result = await database.command({ ping: 1 });
    
    console.log("Ping réussi :", result);
    
    await client.close();
  } catch (error) {
    console.error("❌ Erreur de connexion :", {
      message: error.message,
      code: error.code,
      name: error.name
    });
  }
}

testMongoConnection();