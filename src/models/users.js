// src/models/users.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez fournir un nom'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'Veuillez fournir un email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide'
    ]
  },
  password: {
    type: String,
    required: [true, 'Veuillez fournir un mot de passe'],
    minlength: 8,
    select: false // Ne pas inclure par défaut dans les requêtes
  },
  role: {
    type: String,
    enum: ['client', 'professional', 'casual', 'admin'],
    default: 'client'
  },
  // Champ pour distinguer le CEO des autres admins
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  
  // Permissions détaillées pour les administrateurs
  permissions: {
    users: {
      view: { type: Boolean, default: true },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    professionals: {
      view: { type: Boolean, default: true },
      edit: { type: Boolean, default: false },
      verify: { type: Boolean, default: false }
    },
    subscriptions: {
      view: { type: Boolean, default: true },
      edit: { type: Boolean, default: false }
    },
    rates: {
      view: { type: Boolean, default: true },
      edit: { type: Boolean, default: false }
    },
    transactions: {
      view: { type: Boolean, default: true },
      process: { type: Boolean, default: false }
    },
    disputes: {
      view: { type: Boolean, default: true },
      resolve: { type: Boolean, default: false }
    },
    reports: {
      view: { type: Boolean, default: true },
      export: { type: Boolean, default: false }
    }
  },
  
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  // Champs spécifiques au client
  housing: {
    type: {
      type: String,
      enum: ['apartment', 'house'],
      default: 'apartment'
    },
    roomCount: {
      type: Number,
      default: 1
    },
    area: {
      type: Number,
      default: 0
    },
    hasGarden: {
      type: Boolean,
      default: false
    },
    gardenArea: {
      type: Number,
      default: 0
    }
  },
  workPriorities: {
    type: [String],
    default: []
  },
  // Champs spécifiques au professionnel
  professional: {
    companyName: {
      type: String,
      trim: true
    },
    siret: {
      type: String,
      trim: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    specialties: {
      type: [String],
      default: []
    },
    hourlyRate: {
      type: Number,
      default: 0
    },
    squareMeterRates: {
      type: Map,
      of: Number,
      default: {}
    },
    availability: {
      type: [{
        day: String,
        available: Boolean,
        startTime: String,
        endTime: String
      }],
      default: []
    },
    description: {
      type: String,
      trim: true
    },
    verificationDocuments: {
      idDocument: {
        type: String,
        trim: true
      },
      bankInfo: {
        type: String,
        trim: true
      },
      uploadedAt: {
        type: Date
      }
    }
  },
  // Google Calendar Integration
  googleTokens: {
    access_token: String,
    refresh_token: String,
    scope: String,
    token_type: String,
    expiry_date: Number
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  // Statut du compte (actif/inactif)
  active: {
    type: Boolean,
    default: true
  }
});

// Middleware pour hasher le mot de passe avant de sauvegarder
UserSchema.pre('save', async function(next) {
  // Ne pas rehacher le mot de passe s'il n'a pas été modifié
  if (!this.isModified('password')) {
    next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour vérifier si le mot de passe est correct
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Vérifier si le modèle existe déjà pour éviter les erreurs en mode développement avec hot-reload
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;