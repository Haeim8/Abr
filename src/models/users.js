
// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Vérifiez si le modèle existe déjà pour éviter l'erreur "Cannot overwrite model once compiled"
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Veuillez fournir un email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Veuillez fournir un mot de passe'],
    minlength: 6,
    select: false, // Ne pas inclure par défaut dans les requêtes
  },
  name: {
    type: String,
    required: [true, 'Veuillez fournir un nom'],
  },
  role: {
    type: String,
    enum: ['client', 'professional', 'admin'],
    default: 'client',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Pré-hook: Hachage du mot de passe avant enregistrement
UserSchema.pre('save', async function(next) {
  // Seulement hacher le mot de passe s'il a été modifié ou est nouveau
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour vérifier le mot de passe
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Éviter l'erreur "OverwriteModelError: Cannot overwrite model once compiled"
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;