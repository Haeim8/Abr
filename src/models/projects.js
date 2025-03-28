// src/models/projects.js
import mongoose from 'mongoose';

// Schéma pour le modèle Project
const ProjectSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  serviceType: {
    type: String
  },
  quantity: {
    type: Number,
    default: 1
  },
  address: {
    type: Object
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

// Schéma pour le modèle Quote
const QuoteSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  details: {
    type: String
  },
  validUntil: {
    type: Date
  }
}, { timestamps: true });

// Créer les modèles avec vérification s'ils existent déjà
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Quote = mongoose.models.Quote || mongoose.model('Quote', QuoteSchema);

// Exporter les deux modèles
export { Project, Quote };
export default Project;