import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'devis', 'mission', 'paiement'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  link: String,
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedType: {
    type: String,
    enum: ['project', 'quote', 'mission', 'payment', 'subscription']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);