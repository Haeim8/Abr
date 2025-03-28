// src/models/projects.js
import mongoose from 'mongoose';

// Définition du schéma Project
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
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  serviceType: {
    type: String,
    required: true
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

// Éviter l'erreur "Cannot overwrite model once compiled"
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

export default Project;