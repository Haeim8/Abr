import { calculateAvailableTasks, getAvailableServicesByPlan, canUseService, useService } from '@/models/subscriptionLogic';

const subscriptionService = {
  getSubscriptionServices: function({ planId, startDate, servicesUsed }) {
    const subscription = {
      plan: planId,
      startDate,
      servicesUsed
    };
    
    // Calculer le nombre de mois depuis le début de l'abonnement
    const today = new Date();
    const subscriptionStart = new Date(startDate);
    const monthsDiff = (today.getFullYear() - subscriptionStart.getFullYear()) * 12 +
                      (today.getMonth() - subscriptionStart.getMonth());
    
    return getAvailableServicesByPlan(planId, monthsDiff);
  },
  
  canUseService,
  useService,
  calculateAvailableTasks
};

export default subscriptionService;