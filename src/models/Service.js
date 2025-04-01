import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  unit: {
    type: String, // 'm²', 'unités', 'fois'
    required: true
  },
  category: {
    type: String,
    required: true
  },
  availability: {
    immediate: {
      type: Boolean,
      default: true
    },
    after6months: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);