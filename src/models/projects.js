// models/projects.js
import mongoose from 'mongoose';

// Schéma pour les projets
const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  professional: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional' },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'in_progress', 'completed', 'cancelled'], 
    default: 'draft' 
  },
  category: { 
    type: String, 
    enum: ['plomberie', 'électricité', 'peinture', 'menuiserie', 'maçonnerie', 'jardinage', 'rénovation', 'autre'], 
    required: true 
  },
  location: {
    address: String,
    city: String,
    postalCode: String,
    region: String
  },
  budget: { type: Number },
  estimatedCost: { type: Number },
  finalCost: { type: Number },
  startDate: Date,
  endDate: Date,
  rooms: [{
    type: { type: String, enum: ['salon', 'cuisine', 'salle_de_bain', 'chambre', 'autre'] },
    name: String,
    area: Number, // en m²
    workDetails: String
  }],
  photos: [String], // URLs des photos
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Schéma pour les abonnements
const SubscriptionSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  plan: { 
    type: String, 
    enum: ['basic', 'premium', 'famille'], 
    default: 'basic' 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'cancelled', 'pending'], 
    default: 'pending' 
  },
  monthlyPayment: { type: Number, required: true },
  totalSaved: { type: Number, default: 0 },
  savingsGoal: { type: Number },
  projectGoal: { type: String },
  startDate: { type: Date },
  nextPaymentDate: { type: Date },
  paymentHistory: [{
    amount: Number,
    date: Date,
    status: { type: String, enum: ['success', 'failed', 'pending'] }
  }],
  autoRenew: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Schéma pour les devis
const QuoteSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  professional: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true },
  description: { type: String },
  totalPrice: { type: Number, required: true },
  materialCosts: { type: Number },
  laborCosts: { type: Number },
  taxRate: { type: Number, default: 20 }, // TVA en %
  taxAmount: { type: Number },
  validUntil: { type: Date },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'], 
    default: 'draft' 
  },
  rooms: [{
    name: String,
    area: Number,
    workDetails: String,
    pricePerSquareMeter: Number,
    totalPrice: Number
  }],
  materials: [{
    name: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  labor: {
    hours: Number,
    rate: Number,
    total: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Mise à jour du champ updatedAt avant chaque enregistrement
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

SubscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

QuoteSchema.pre('save', function(next) {
  // Calcul automatique de la TVA
  this.taxAmount = (this.totalPrice * this.taxRate) / 100;
  this.updatedAt = Date.now();
  next();
});

export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
export const Quote = mongoose.models.Quote || mongoose.model('Quote', QuoteSchema);