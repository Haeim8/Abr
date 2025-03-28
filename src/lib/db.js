// lib/mongodb.js
import mongoose from 'mongoose';

// Variable pour stocker l'état de la connexion
let isConnected = false;

export const connectToDatabase = async () => {
  // Vérification si déjà connecté
  if (isConnected) {
    console.log('✅ Connexion MongoDB déjà active');
    return mongoose.connection;
  }

  // Vérification de la variable d'environnement
  if (!process.env.MONGODB_URI) {
    throw new Error('Veuillez définir la variable d\'environnement MONGODB_URI');
  }

  try {
    console.log('Tentative de connexion à MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    });

    isConnected = true;
    console.log('✅ MongoDB connecté avec succès!');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    throw error;
  }
};

// Gestion globale des événements Mongoose
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('Mongoose connecté à la base de données');
});

mongoose.connection.on('error', (err) => {
  console.error('Erreur de connexion Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('Mongoose déconnecté');
});

// Gestionnaire pour l'arrêt propre de l'application
process.on('SIGINT', async () => {
  if (isConnected) {
    await mongoose.connection.close();
    console.log('Connexion Mongoose fermée suite à l\'arrêt de l\'application');
    process.exit(0);
  }
});