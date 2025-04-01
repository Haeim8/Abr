// /models/Plan.js
import mongoose from 'mongoose';

const PlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  commitment: {
    type: Number,
    default: 6, // 6 mois par défaut
  },
  popular: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.models.Plan || mongoose.model('Plan', PlanSchema);