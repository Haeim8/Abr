// src/lib/subscriptionService.js

/**
 * Service pour gérer les abonnements et le suivi des tâches
 */

// Définition des forfaits avec leurs limites
const subscriptionPlans = {
    forfait1: {
      name: 'Forfait 1',
      price: 39,
      tasksPerMonth: 1,
      limits: {
        assemblage_meubles: { quantity: 1, unit: 'meuble' },
        taille_haie: { quantity: 10, unit: 'm²' },
        tonte_pelouse: { quantity: 100, unit: 'm²' },
        menage_interieur: { quantity: 15, unit: 'm²' },
        refection_joint: { quantity: 1, unit: 'salle de bain' },
        nettoyage_karcher: { quantity: 15, unit: 'm²' },
        pose_accessoires: { quantity: 3, unit: 'unité' },
        entretien_luminaires: { quantity: 5, unit: 'unité' },
        entretien_maison: { quantity: 3, unit: 'unité' },
        arrosage_plantes: { quantity: 10, unit: 'm²' },
        remplacement_electrique: { quantity: 3, unit: 'unité' },
        debroussaillage: { quantity: 5, unit: 'm²' },
        // Services disponibles après 6 mois
        refection_peinture: { quantity: 5, unit: 'm²', requiredMonths: 6 },
        pose_papier_peint: { quantity: 5, unit: 'm²', requiredMonths: 6 }
      }
    },
    forfait2: {
      name: 'Forfait 2',
      price: 99,
      tasksPerMonth: 3,
      limits: {
        assemblage_meubles: { quantity: 1, unit: 'meuble' },
        taille_haie: { quantity: 15, unit: 'm²' },
        tonte_pelouse: { quantity: 100, unit: 'm²' },
        menage_interieur: { quantity: 15, unit: 'm²' },
        refection_peinture: { quantity: 5, unit: 'm²' },
        refection_joint: { quantity: 1, unit: 'salle de bain' },
        nettoyage_karcher: { quantity: 15, unit: 'm²' },
        pose_accessoires: { quantity: 3, unit: 'unité' },
        entretien_luminaires: { quantity: 5, unit: 'unité' },
        entretien_maison: { quantity: 3, unit: 'unité' },
        arrosage_plantes: { quantity: 15, unit: 'm²' },
        remplacement_electrique: { quantity: 3, unit: 'unité' },
        pose_papier_peint: { quantity: 5, unit: 'm²' },
        debroussaillage: { quantity: 5, unit: 'm²' }
      }
    },
    forfait3: {
      name: 'Forfait 3',
      price: 139,
      tasksPerMonth: 3,
      limits: {
        depannage_serrurier: { quantity: 1, unit: 'fois/an' },
        assemblage_meubles: { quantity: 1, unit: 'meuble' },
        taille_haie: { quantity: 20, unit: 'm²' },
        tonte_pelouse: { quantity: 150, unit: 'm²' },
        menage_interieur: { quantity: 20, unit: 'm²' },
        refection_peinture: { quantity: 10, unit: 'm²' },
        refection_joint: { quantity: 1, unit: 'salle de bain' },
        nettoyage_karcher: { quantity: 30, unit: 'm²' },
        pose_accessoires: { quantity: 5, unit: 'unité' },
        entretien_luminaires: { quantity: 5, unit: 'unité' },
        entretien_maison: { quantity: 3, unit: 'unité' },
        arrosage_plantes: { quantity: 25, unit: 'm²' },
        remplacement_electrique: { quantity: 5, unit: 'unité' },
        pose_papier_peint: { quantity: 10, unit: 'm²' },
        pose_carrelage: { quantity: 2, unit: 'm²' },
        pose_parquet: { quantity: 2, unit: 'm²' },
        debroussaillage: { quantity: 10, unit: 'm²' },
        refection_joints_carrelage: { quantity: 2, unit: 'm²' }
      }
    },
    forfait4: {
      name: 'Forfait 4',
      price: 189,
      tasksPerMonth: 3,
      limits: {
        depannage_serrurier: { quantity: 1, unit: 'fois/an' },
        depannage_plomberie: { quantity: 1, unit: 'fois/mois' },
        assemblage_meubles: { quantity: 1, unit: 'meuble' },
        taille_haie: { quantity: 25, unit: 'm²' },
        tonte_pelouse: { quantity: 200, unit: 'm²' },
        menage_interieur: { quantity: 35, unit: 'm²' },
        refection_peinture: { quantity: 10, unit: 'm²' },
        refection_joint: { quantity: 1, unit: 'salle de bain' },
        nettoyage_karcher: { quantity: 30, unit: 'm²' },
        pose_accessoires: { quantity: 5, unit: 'unité' },
        entretien_luminaires: { quantity: 5, unit: 'unité' },
        entretien_maison: { quantity: 3, unit: 'unité' },
        arrosage_plantes: { quantity: 30, unit: 'm²' },
        remplacement_electrique: { quantity: 5, unit: 'unité' },
        pose_papier_peint: { quantity: 10, unit: 'm²' },
        pose_carrelage: { quantity: 2, unit: 'm²' },
        pose_parquet: { quantity: 2, unit: 'm²' },
        ramonage: { quantity: 1, unit: 'fois/mois' },
        debroussaillage: { quantity: 15, unit: 'm²' },
        refection_joints_carrelage: { quantity: 2, unit: 'm²' }
      }
    }
  };
  
  /**
   * Récupère les informations d'un forfait
   * @param {string} planId - Identifiant du forfait
   * @returns {Object} - Informations du forfait
   */
  export const getPlanInfo = (planId) => {
    return subscriptionPlans[planId] || null;
  };
  
  /**
   * Récupère la liste des services disponibles pour un forfait
   * @param {string} planId - Identifiant du forfait
   * @param {number} subscribedMonths - Nombre de mois d'abonnement
   * @returns {Array} - Liste des services disponibles
   */
  export const getAvailableServices = (planId, subscribedMonths = 0) => {
    const plan = getPlanInfo(planId);
    if (!plan) return [];
  
    const services = [];
    
    for (const [serviceId, serviceInfo] of Object.entries(plan.limits)) {
      // Vérifier si le service nécessite un nombre minimal de mois d'abonnement
      if (serviceInfo.requiredMonths && subscribedMonths < serviceInfo.requiredMonths) {
        continue;
      }
      
      services.push({
        id: serviceId,
        limit: serviceInfo.quantity,
        unit: serviceInfo.unit,
        requiredMonths: serviceInfo.requiredMonths || 0
      });
    }
    
    return services;
  };
  
  /**
   * Calcule le nombre de jours avant la réinitialisation des tâches mensuelles
   * @returns {number} - Nombre de jours restants
   */
  export const getDaysUntilReset = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const diffTime = nextMonth - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  /**
   * Vérifie si un utilisateur peut effectuer une tâche dans son forfait
   * @param {Object} userSubscription - Abonnement de l'utilisateur
   * @param {string} serviceId - Identifiant du service
   * @param {number} quantity - Quantité demandée
   * @returns {Object} - Résultat de la vérification
   */
  export const canUseService = (userSubscription, serviceId, quantity = 1) => {
    if (!userSubscription || !userSubscription.planId) {
      return {
        canUse: false,
        reason: 'no_subscription',
        message: 'Vous n\'avez pas d\'abonnement actif.'
      };
    }
    
    const { planId, startDate, tasksUsedThisMonth, servicesUsed = [] } = userSubscription;
    const plan = getPlanInfo(planId);
    
    if (!plan) {
      return {
        canUse: false,
        reason: 'invalid_plan',
        message: 'Forfait non reconnu.'
      };
    }
    
    // Vérifier si l'utilisateur a des tâches disponibles ce mois-ci
    if (tasksUsedThisMonth >= plan.tasksPerMonth) {
      return {
        canUse: false,
        reason: 'monthly_tasks_exceeded',
        message: `Vous avez déjà utilisé vos ${plan.tasksPerMonth} tâches disponibles ce mois-ci.`
      };
    }
    
    // Calculer le nombre de mois d'abonnement
    const subscriptionStartDate = new Date(startDate);
    const today = new Date();
    const monthsDiff = (today.getFullYear() - subscriptionStartDate.getFullYear()) * 12 + 
                      today.getMonth() - subscriptionStartDate.getMonth();
    
    // Vérifier si le service existe dans le forfait
    if (!plan.limits[serviceId]) {
      return {
        canUse: false,
        reason: 'service_not_available',
        message: 'Ce service n\'est pas disponible dans votre forfait.'
      };
    }
    
    // Vérifier si le service nécessite un nombre minimal de mois d'abonnement
    const requiredMonths = plan.limits[serviceId].requiredMonths || 0;
    if (requiredMonths > monthsDiff) {
      return {
        canUse: false,
        reason: 'service_not_yet_available',
        message: `Ce service sera disponible après ${requiredMonths} mois d'abonnement.`,
        availableAfter: requiredMonths - monthsDiff
      };
    }
    
    // Vérifier si la quantité demandée dépasse la limite mensuelle
    const serviceLimit = plan.limits[serviceId].quantity;
    const serviceUnit = plan.limits[serviceId].unit;
    
    // Trouver l'utilisation actuelle du service ce mois-ci
    const serviceUsage = servicesUsed.find(s => s.serviceId === serviceId);
    const usedQuantity = serviceUsage ? serviceUsage.quantity : 0;
    
    if (usedQuantity + quantity > serviceLimit) {
      return {
        canUse: false,
        reason: 'service_limit_exceeded',
        message: `Vous avez dépassé la limite de ${serviceLimit} ${serviceUnit} pour ce service.`,
        usedQuantity,
        limit: serviceLimit,
        remainingQuantity: Math.max(0, serviceLimit - usedQuantity)
      };
    }
    
    return {
      canUse: true,
      remainingTasks: plan.tasksPerMonth - tasksUsedThisMonth,
      remainingQuantity: serviceLimit - usedQuantity,
      serviceLimit,
      serviceUnit
    };
  };
  
  /**
   * Marque un service comme utilisé dans l'abonnement d'un utilisateur
   * @param {Object} userSubscription - Abonnement de l'utilisateur
   * @param {string} serviceId - Identifiant du service
   * @param {number} quantity - Quantité utilisée
   * @returns {Object} - Abonnement mis à jour
   */
  export const useService = (userSubscription, serviceId, quantity = 1) => {
    // Vérifier d'abord si le service peut être utilisé
    const checkResult = canUseService(userSubscription, serviceId, quantity);
    
    if (!checkResult.canUse) {
      return {
        ...userSubscription,
        error: checkResult
      };
    }
    
    // Créer une copie de l'abonnement pour mise à jour
    const updatedSubscription = {
      ...userSubscription,
      tasksUsedThisMonth: (userSubscription.tasksUsedThisMonth || 0) + 1,
      servicesUsed: [...(userSubscription.servicesUsed || [])]
    };
    
    // Mettre à jour l'utilisation du service
    const serviceIndex = updatedSubscription.servicesUsed.findIndex(s => s.serviceId === serviceId);
    
    if (serviceIndex >= 0) {
      // Mettre à jour l'utilisation existante
      updatedSubscription.servicesUsed[serviceIndex] = {
        ...updatedSubscription.servicesUsed[serviceIndex],
        quantity: updatedSubscription.servicesUsed[serviceIndex].quantity + quantity,
        lastUsed: new Date()
      };
    } else {
      // Ajouter une nouvelle entrée d'utilisation
      updatedSubscription.servicesUsed.push({
        serviceId,
        quantity,
        lastUsed: new Date()
      });
    }
    
    return updatedSubscription;
  };
  
  /**
   * Réinitialise les compteurs d'utilisation pour un nouveau mois
   * @param {Object} userSubscription - Abonnement de l'utilisateur
   * @returns {Object} - Abonnement mis à jour
   */
  export const resetMonthlyUsage = (userSubscription) => {
    if (!userSubscription) return null;
    
    return {
      ...userSubscription,
      tasksUsedThisMonth: 0,
      servicesUsed: [] // Réinitialiser tous les services utilisés
    };
  };
  
  /**
   * Calcule le temps d'abonnement en mois
   * @param {Date|string} startDate - Date de début d'abonnement
   * @returns {number} - Nombre de mois d'abonnement
   */
  export const calculateSubscriptionDuration = (startDate) => {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    const today = new Date();
    
    return (today.getFullYear() - start.getFullYear()) * 12 + 
           (today.getMonth() - start.getMonth());
  };
  
  /**
   * Récupère les statistiques d'utilisation d'un abonnement
   * @param {Object} userSubscription - Abonnement de l'utilisateur
   * @returns {Object} - Statistiques d'utilisation
   */
  export const getSubscriptionStats = (userSubscription) => {
    if (!userSubscription || !userSubscription.planId) {
      return {
        hasSubscription: false
      };
    }
    
    const { planId, startDate, tasksUsedThisMonth, servicesUsed = [] } = userSubscription;
    const plan = getPlanInfo(planId);
    
    if (!plan) {
      return {
        hasSubscription: true,
        error: 'invalid_plan'
      };
    }
    
    const subscriptionMonths = calculateSubscriptionDuration(startDate);
    const daysUntilReset = getDaysUntilReset();
    
    return {
      hasSubscription: true,
      planId,
      planName: plan.name,
      price: plan.price,
      startDate,
      subscriptionMonths,
      tasksPerMonth: plan.tasksPerMonth,
      tasksUsedThisMonth: tasksUsedThisMonth || 0,
      tasksRemaining: Math.max(0, plan.tasksPerMonth - (tasksUsedThisMonth || 0)),
      servicesUsed,
      daysUntilReset,
      nextResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    };
  };
  
  /**
   * Récupère les services spécifiques disponibles pour un abonnement
   * @param {Object} userSubscription - Abonnement de l'utilisateur
   * @returns {Array} - Liste des services avec leur disponibilité
   */
  export const getSubscriptionServices = (userSubscription) => {
    if (!userSubscription || !userSubscription.planId) return [];
    
    const { planId, startDate, servicesUsed = [] } = userSubscription;
    const plan = getPlanInfo(planId);
    
    if (!plan) return [];
    
    const subscriptionMonths = calculateSubscriptionDuration(startDate);
    const result = [];
    
    // Créer une liste de tous les services avec leur disponibilité
    for (const [serviceId, serviceInfo] of Object.entries(plan.limits)) {
      // Vérifier si le service est disponible en fonction du nombre de mois d'abonnement
      const requiredMonths = serviceInfo.requiredMonths || 0;
      const isAvailable = subscriptionMonths >= requiredMonths;
      
      // Obtenir l'utilisation actuelle
      const serviceUsage = servicesUsed.find(s => s.serviceId === serviceId);
      const usedQuantity = serviceUsage ? serviceUsage.quantity : 0;
      
      result.push({
        id: serviceId,
        name: getServiceName(serviceId),
        isAvailable,
        requiredMonths,
        limit: serviceInfo.quantity,
        unit: serviceInfo.unit,
        usedQuantity,
        remainingQuantity: Math.max(0, serviceInfo.quantity - usedQuantity),
        unlockInMonths: isAvailable ? 0 : requiredMonths - subscriptionMonths
      });
    }
    
    return result;
  };
  
  /**
   * Obtient le nom lisible d'un service à partir de son ID
   * @param {string} serviceId - Identifiant du service
   * @returns {string} - Nom du service
   */
  export const getServiceName = (serviceId) => {
    const serviceNames = {
      assemblage_meubles: 'Assemblage de meubles',
      taille_haie: 'Taille de haie',
      tonte_pelouse: 'Tonte de pelouse',
      menage_interieur: 'Ménage intérieur',
      refection_joint: 'Réfection joint sanitaire',
      nettoyage_karcher: 'Nettoyage Karcher',
      pose_accessoires: 'Pose d\'accessoires muraux',
      entretien_luminaires: 'Entretien luminaires',
      entretien_maison: 'Entretien maison',
      arrosage_plantes: 'Arrosage plantes',
      remplacement_electrique: 'Remplacement appareillage électrique',
      debroussaillage: 'Débroussaillage',
      refection_peinture: 'Réfection peinture blanche',
      pose_papier_peint: 'Pose papier peint',
      pose_carrelage: 'Pose de carrelage',
      pose_parquet: 'Pose de parquet flottant',
      refection_joints_carrelage: 'Réfection joints carrelage',
      depannage_serrurier: 'Dépannage serrurier',
      depannage_plomberie: 'Dépannage plomberie',
      ramonage: 'Ramonage cheminée'
    };
    
    return serviceNames[serviceId] || serviceId;
  };
  
  export default {
    getPlanInfo,
    getAvailableServices,
    canUseService,
    useService,
    resetMonthlyUsage,
    calculateSubscriptionDuration,
    getSubscriptionStats,
    getSubscriptionServices,
    getDaysUntilReset,
    getServiceName
  };