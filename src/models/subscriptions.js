import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['payment', 'refund', 'credit'],
    required: true
  },
  description: String,
  stripePaymentId: String
});

const serviceUsageSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  lastUsed: Date
});

const SubscriptionSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['forfait1', 'forfait2', 'forfait3', 'forfait4'],
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  lastPaymentDate: Date,
  nextPaymentDate: Date,
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled', 'expired'],
    default: 'active'
  },
  tasksUsedThisMonth: {
    type: Number,
    default: 0
  },
  servicesUsed: [serviceUsageSchema],
  transactions: [transactionSchema]
}, { timestamps: true });

// Méthodes statiques
SubscriptionSchema.statics.findActiveByUser = function(userId) {
  return this.findOne({
    clientId: userId,
    status: 'active'
  });
};

// Méthodes d'instance
SubscriptionSchema.methods.getStats = function() {
  const tasksPerPlan = {
    'forfait1': 1,
    'forfait2': 3,
    'forfait3': 3,
    'forfait4': 3
  };
  
  const maxTasks = tasksPerPlan[this.plan] || 0;
  const remainingTasks = Math.max(0, maxTasks - (this.tasksUsedThisMonth || 0));
  
  const today = new Date();
  const nextResetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
  return {
    plan: this.plan,
    remainingTasks,
    maxTasks,
    nextResetDate
  };
};

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);