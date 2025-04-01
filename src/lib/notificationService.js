// src/lib/notificationService.js
import Notification from '@/models/notifications';
import { sendEmail } from '@/lib/email';

const notificationService = {
  // Envoyer une notification client pour un devis reçu
  notifyClientQuoteReceived: async (userId, quoteData) => {
    await Notification.create({
      userId,
      title: 'Nouveau devis reçu',
      message: `Vous avez reçu un devis pour votre projet "${quoteData.projectTitle}"`,
      type: 'devis',
      link: `/quotes/${quoteData.quoteId}`,
      relatedId: quoteData.quoteId,
      relatedType: 'quote'
    });
    
    // Optionnel: envoyer aussi un email
    const user = await User.findById(userId);
    if (user && user.email) {
      await sendEmail({
        to: user.email,
        subject: 'Nouveau devis reçu',
        text: `Vous avez reçu un nouveau devis pour votre projet "${quoteData.projectTitle}". Connectez-vous pour le consulter.`
      });
    }
  },

  // Notifier un professionnel d'une demande de devis
  notifyProfessionalQuoteRequest: async (userId, projectData) => {
    await Notification.create({
      userId,
      title: 'Nouvelle demande de devis',
      message: `Une demande de devis a été reçue pour un projet de ${projectData.category}`,
      type: 'devis',
      link: `/projects/${projectData.projectId}`,
      relatedId: projectData.projectId,
      relatedType: 'project'
    });
  },

  // Notifier un travailleur occasionnel d'une mission disponible
  notifyWorkerMissionAvailable: async (userId, missionData) => {
    await Notification.create({
      userId,
      title: 'Nouvelle mission disponible',
      message: `Une mission de ${missionData.serviceType} est disponible près de chez vous`,
      type: 'mission',
      link: `/missions/${missionData.missionId}`,
      relatedId: missionData.missionId,
      relatedType: 'mission'
    });
  },

  // Notification générique
  createNotification: async (notificationData) => {
    return await Notification.create(notificationData);
  },

  // Marquer des notifications comme lues
  markAsRead: async (userId, notificationIds) => {
    return await Notification.updateMany(
      { _id: { $in: notificationIds }, userId },
      { $set: { read: true } }
    );
  },

  // Récupérer les notifications non lues
  getUnreadCount: async (userId) => {
    return await Notification.countDocuments({ userId, read: false });
  }
};

export default notificationService;