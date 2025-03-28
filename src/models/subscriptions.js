// src/models/subscriptions.js
import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['forfait1', 'forfait2', 'forfait3', 'forfait4'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'suspended', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  amount: {
    type: Number,
    required: true
  },
  // Information sur l'utilisation des tâches
  tasksUsed: {
    type: Number,
    default: 0
  },
  maxTasks: {
    type: Number,
    required: true
  },
  // Liste des tâches utilisées ce mois-ci
  currentMonthTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  // Renouvellement
  renewalDate: {
    type: Date
  },
  // Historique des paiements
  paymentHistory: [{
    amount: Number,
    date: Date,
    status: {
      type: String,
      enum: ['successful', 'failed', 'pending'],
      default: 'pending'
    },
    transactionId: String
  }],
  // Stripe
  stripeCustomerId: {
    type: String
  },
  stripeSubscriptionId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid', 'pending'],
    default: 'pending'
  },
  // Dates de création et mise à jour
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Méthode pour vérifier si l'utilisateur peut encore faire des tâches ce mois-ci
SubscriptionSchema.methods.canUseTask = function() {
  return this.status === 'active' && this.tasksUsed < this.maxTasks;
};

// Méthode pour calculer le nombre de tâches restantes
SubscriptionSchema.methods.remainingTasks = function() {
  return Math.max(0, this.maxTasks - this.tasksUsed);
};

// Méthode pour réinitialiser les tâches utilisées au début du mois
SubscriptionSchema.methods.resetMonthlyTasks = function() {
  this.tasksUsed = 0;
  this.currentMonthTasks = [];
  this.updatedAt = new Date();
  return this.save();
};

// Fonction statique pour trouver l'abonnement actif d'un utilisateur
SubscriptionSchema.statics.findActiveForUser = function(userId) {
  return this.findOne({ userId, status: 'active' });
};

// Vérifier si le modèle existe déjà pour éviter les erreurs en mode développement avec hot-reload
const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;