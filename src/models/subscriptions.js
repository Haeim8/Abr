// src/models/subscriptions.js
import mongoose from 'mongoose';

// Schéma pour suivre l'utilisation des services
const ServiceUsageSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
});

// Schéma pour les transactions de paiement
const PaymentTransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'sepa_direct_debit'],
    default: 'card'
  },
  stripePaymentIntentId: String,
  stripeInvoiceId: String,
  date: {
    type: Date,
    default: Date.now
  }
});

// Schéma principal pour les abonnements
const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    enum: ['forfait1', 'forfait2', 'forfait3', 'forfait4'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  // Champs pour suivre l'utilisation
  tasksUsedThisMonth: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now // Date de dernière réinitialisation des compteurs
  },
  servicesUsed: [ServiceUsageSchema],
  
  // Champs pour le paiement
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'sepa_direct_debit'],
    default: 'card'
  },
  payments: [PaymentTransactionSchema],
  
  // Paramètres de l'abonnement
  autoRenew: {
    type: Boolean,
    default: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  
  // Nombre de mois d'engagement restant
  remainingCommitmentMonths: {
    type: Number,
    default: 6 // 6 mois d'engagement par défaut
  },
  
  // Remarques ou notes
  notes: String
}, { timestamps: true });

// Méthode pour vérifier si l'abonnement est actif
SubscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && (!this.endDate || new Date() < this.endDate);
};

// Méthode pour vérifier si un utilisateur peut utiliser un service
SubscriptionSchema.methods.canUseService = function(serviceId, quantity = 1) {
  const { subscriptionService } = require('../lib/subscriptionService');
  
  return subscriptionService.canUseService(
    {
      planId: this.planId,
      startDate: this.startDate,
      tasksUsedThisMonth: this.tasksUsedThisMonth,
      servicesUsed: this.servicesUsed
    },
    serviceId,
    quantity
  );
};

// Méthode pour utiliser un service
SubscriptionSchema.methods.useService = async function(serviceId, quantity = 1) {
  const { subscriptionService } = require('../lib/subscriptionService');
  
  const result = subscriptionService.useService(
    {
      planId: this.planId,
      startDate: this.startDate,
      tasksUsedThisMonth: this.tasksUsedThisMonth,
      servicesUsed: this.servicesUsed.map(s => ({
        serviceId: s.serviceId,
        quantity: s.quantity,
        lastUsed: s.lastUsed
      }))
    },
    serviceId,
    quantity
  );
  
  if (result.error) {
    return { success: false, error: result.error };
  }
  
  this.tasksUsedThisMonth = result.tasksUsedThisMonth;
  
  // Mettre à jour les services utilisés
  this.servicesUsed = result.servicesUsed.map(s => ({
    serviceId: s.serviceId,
    quantity: s.quantity,
    lastUsed: s.lastUsed
  }));
  
  await this.save();
  
  return { success: true, subscription: this };
};

// Méthode pour réinitialiser les compteurs mensuels
SubscriptionSchema.methods.resetMonthlyUsage = async function() {
  this.tasksUsedThisMonth = 0;
  this.servicesUsed = [];
  this.lastResetDate = new Date();
  await this.save();
  return this;
};

// Méthode pour annuler l'abonnement à la fin de la période
SubscriptionSchema.methods.cancelAtEnd = async function() {
  this.cancelAtPeriodEnd = true;
  await this.save();
  return this;
};

// Méthode pour pauser l'abonnement
SubscriptionSchema.methods.pause = async function() {
  this.status = 'paused';
  await this.save();
  return this;
};

// Méthode pour réactiver l'abonnement
SubscriptionSchema.methods.reactivate = async function() {
  this.status = 'active';
  this.cancelAtPeriodEnd = false;
  await this.save();
  return this;
};

// Méthode pour récupérer les statistiques de l'abonnement
SubscriptionSchema.methods.getStats = function() {
  const { subscriptionService } = require('../lib/subscriptionService');
  
  return subscriptionService.getSubscriptionStats({
    planId: this.planId,
    startDate: this.startDate,
    tasksUsedThisMonth: this.tasksUsedThisMonth,
    servicesUsed: this.servicesUsed.map(s => ({
      serviceId: s.serviceId,
      quantity: s.quantity,
      lastUsed: s.lastUsed
    }))
  });
};

// Méthode statique pour trouver l'abonnement actif d'un utilisateur
SubscriptionSchema.statics.findActiveByUser = function(userId) {
  return this.findOne({
    user: userId,
    status: 'active',
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: new Date() } }
    ]
  });
};

// Éviter l'erreur "Cannot overwrite model once compiled"
const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;