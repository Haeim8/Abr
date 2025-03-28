// src/lib/subscriptionLogic.js

/**
 * Calcule les tâches disponibles pour un utilisateur en fonction de son abonnement
 * @param {Object} userSubscription - Objet contenant les informations d'abonnement
 * @param {Date} subscriptionStartDate - Date de début de l'abonnement
 * @returns {Object} - Informations sur les tâches disponibles
 */
export const calculateAvailableTasks = (userSubscription, subscriptionStartDate) => {
  // Récupérer le forfait de l'abonnement
  const { plan, tasksUsedThisMonth } = userSubscription;
  
  // Nombre de tâches par forfait
  const tasksPerPlan = {
    'forfait1': 1,
    'forfait2': 3,
    'forfait3': 3,
    'forfait4': 3
  };
  
  // Nombre maximum de tâches par mois
  const maxTasks = tasksPerPlan[plan] || 0;
  
  // Nombre de tâches restantes ce mois-ci
  const remainingTasks = Math.max(0, maxTasks - (tasksUsedThisMonth || 0));
  
  // Calculer le nombre de mois depuis le début de l'abonnement
  const today = new Date();
  const startDate = new Date(subscriptionStartDate);
  const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 +
                    (today.getMonth() - startDate.getMonth());
  
  // Déterminer quelles options sont disponibles en fonction du nombre de mois
  const availableOptions = getAvailableServicesByPlan(plan, monthsDiff);
  
  return {
    plan,
    remainingTasks,
    maxTasks,
    monthsSubscribed: monthsDiff,
    availableOptions,
    // Date de réinitialisation des tâches (1er du mois prochain)
    nextResetDate: new Date(today.getFullYear(), today.getMonth() + 1, 1)
  };
};

/**
 * Récupère les services disponibles en fonction du forfait et de la durée d'abonnement
 * @param {string} planName - Nom du forfait
 * @param {number} months - Nombre de mois d'abonnement
 * @returns {Array} - Liste des services disponibles
 */
export const getAvailableServicesByPlan = (planName, months) => {
  // Services de base disponibles pour tous les forfaits
  const baseServices = [
    { id: 'assemblage_meubles', name: 'Assemblage de meubles', unit: 'meuble' },
    { id: 'tonte_pelouse', name: 'Tonte de pelouse', unit: 'm²' },
    { id: 'menage_interieur', name: 'Ménage intérieur', unit: 'm²' },
    { id: 'refection_joint', name: 'Réfection joint sanitaire', unit: 'salle de bain' },
    { id: 'nettoyage_karcher', name: 'Nettoyage extérieur Karcher', unit: 'm²' },
    { id: 'pose_accessoires', name: 'Pose d\'accessoires muraux', unit: 'unités' },
    { id: 'entretien_luminaires', name: 'Entretien luminaires', unit: 'unités' },
    { id: 'entretien_maison', name: 'Entretien divers maison', unit: 'unités' },
    { id: 'arrosage_plantes', name: 'Arrosage plantes', unit: 'm²' },
    { id: 'remplacement_electrique', name: 'Remplacement appareillage électrique', unit: 'unités' },
    { id: 'debroussaillage', name: 'Débroussaillage', unit: 'm²' }
  ];
  
  // Services disponibles après 6 mois
  const after6MonthsServices = [
    { id: 'refection_peinture', name: 'Réfection peinture blanche', unit: 'm²' },
    { id: 'pose_papier_peint', name: 'Pose papier peint', unit: 'm²' }
  ];
  
  // Services spécifiques au forfait 3
  const forfait3Services = [
    { id: 'depannage_serrurier', name: 'Dépannage serrurier', unit: 'intervention' },
    { id: 'pose_carrelage', name: 'Pose de carrelage', unit: 'm²' },
    { id: 'pose_parquet', name: 'Pose de parquet flottant', unit: 'm²' },
    { id: 'refection_joints_carrelage', name: 'Réfection joints carrelage', unit: 'm²' }
  ];
  
  // Services spécifiques au forfait 4
  const forfait4Services = [
    { id: 'depannage_plomberie', name: 'Dépannage plomberie', unit: 'intervention' },
    { id: 'ramonage', name: 'Ramonage cheminée/insert', unit: 'intervention' }
  ];
  
  // Déterminer les limites en fonction du forfait
  const limits = getLimitsByPlan(planName);
  
  // Appliquer les limites aux services
  const servicesWithLimits = baseServices.map(service => ({
    ...service,
    limit: limits[service.id] || 0
  }));
  
  // Ajouter les services après 6 mois si applicable
  let availableServices = [...servicesWithLimits];
  
  if (months >= 6) {
    const after6ServicesWithLimits = after6MonthsServices.map(service => ({
      ...service,
      limit: limits[service.id] || 0
    }));
    availableServices = [...availableServices, ...after6ServicesWithLimits];
  }
  
  // Ajouter les services spécifiques au forfait 3
  if (planName === 'forfait3' || planName === 'forfait4') {
    const forfait3ServicesWithLimits = forfait3Services.map(service => ({
      ...service,
      limit: limits[service.id] || 0
    }));
    availableServices = [...availableServices, ...forfait3ServicesWithLimits];
  }
  
  // Ajouter les services spécifiques au forfait 4
  if (planName === 'forfait4') {
    const forfait4ServicesWithLimits = forfait4Services.map(service => ({
      ...service,
      limit: limits[service.id] || 0
    }));
    availableServices = [...availableServices, ...forfait4ServicesWithLimits];
  }
  
  return availableServices;
};

/**
 * Récupère les limites de services par forfait
 * @param {string} planName - Nom du forfait
 * @returns {Object} - Limites par service
 */
export const getLimitsByPlan = (planName) => {
  const limits = {
    'forfait1': {
      'assemblage_meubles': 1,
      'taille_haie': 10,
      'tonte_pelouse': 100,
      'menage_interieur': 15,
      'refection_peinture': 5,
      'refection_joint': 1,
      'nettoyage_karcher': 15,
      'pose_accessoires': 3,
      'entretien_luminaires': 5,
      'entretien_maison': 3,
      'arrosage_plantes': 10,
      'remplacement_electrique': 3,
      'pose_papier_peint': 5,
      'debroussaillage': 5
    },
    'forfait2': {
      'assemblage_meubles': 1,
      'taille_haie': 15,
      'tonte_pelouse': 100,
      'menage_interieur': 15,
      'refection_peinture': 5,
      'refection_joint': 1,
      'nettoyage_karcher': 15,
      'pose_accessoires': 3,
      'entretien_luminaires': 5,
      'entretien_maison': 3,
      'arrosage_plantes': 15,
      'remplacement_electrique': 3,
      'pose_papier_peint': 5,
      'debroussaillage': 5
    },
    'forfait3': {
      'assemblage_meubles': 1,
      'taille_haie': 20,
      'tonte_pelouse': 150,
      'menage_interieur': 20,
      'refection_peinture': 10,
      'refection_joint': 1,
      'nettoyage_karcher': 30,
      'pose_accessoires': 5,
      'entretien_luminaires': 5,
      'entretien_maison': 3,
      'arrosage_plantes': 25,
      'remplacement_electrique': 5,
      'pose_papier_peint': 10,
      'debroussaillage': 10,
      'depannage_serrurier': 1,
      'pose_carrelage': 2,
      'pose_parquet': 2,
      'refection_joints_carrelage': 2
    },
    'forfait4': {
      'assemblage_meubles': 1,
      'taille_haie': 25,
      'tonte_pelouse': 200,
      'menage_interieur': 35,
      'refection_peinture': 10,
      'refection_joint': 1,
      'nettoyage_karcher': 30,
      'pose_accessoires': 5,
      'entretien_luminaires': 5,
      'entretien_maison': 3,
      'arrosage_plantes': 30,
      'remplacement_electrique': 5,
      'pose_papier_peint': 10,
      'debroussaillage': 15,
      'depannage_serrurier': 1,
      'pose_carrelage': 2,
      'pose_parquet': 2,
      'refection_joints_carrelage': 2,
      'depannage_plomberie': 1,
      'ramonage': 1
    }
  };
  
  return limits[planName] || {};
};

/**
 * Vérifie si un utilisateur peut effectuer une tâche spécifique
 * @param {Object} userSubscription - Abonnement de l'utilisateur
 * @param {string} serviceId - ID du service demandé
 * @param {number} quantity - Quantité demandée
 * @returns {Object} - Résultat de la vérification
 */
export const canUseService = (userSubscription, serviceId, quantity = 1) => {
  const { plan, tasksUsedThisMonth, servicesUsed, startDate } = userSubscription;
  
  // Nombre de tâches par forfait
  const tasksPerPlan = {
    'forfait1': 1,
    'forfait2': 3,
    'forfait3': 3,
    'forfait4': 3
  };
  
  // Vérifier si l'utilisateur a dépassé son quota de tâches mensuelles
  if (tasksUsedThisMonth >= tasksPerPlan[plan]) {
    return {
      canUse: false,
      reason: 'quota_mensuel_depasse',
      message: 'Vous avez atteint votre quota mensuel de tâches.'
    };
  }
  
  // Calculer le nombre de mois depuis le début de l'abonnement
  const today = new Date();
  const subscriptionStart = new Date(startDate);
  const monthsDiff = (today.getFullYear() - subscriptionStart.getFullYear()) * 12 +
                    (today.getMonth() - subscriptionStart.getMonth());
  
  // Vérifier si le service est disponible pour ce forfait et cette durée
  const availableServices = getAvailableServicesByPlan(plan, monthsDiff);
  const service = availableServices.find(s => s.id === serviceId);
  
  if (!service) {
    return {
      canUse: false,
      reason: 'service_non_disponible',
      message: 'Ce service n\'est pas disponible dans votre forfait actuel.'
    };
  }
  
  // Vérifier si certains services nécessitent 6 mois d'abonnement
  const servicesAfter6Months = ['refection_peinture', 'pose_papier_peint'];
  if (servicesAfter6Months.includes(serviceId) && monthsDiff < 6) {
    return {
      canUse: false,
      reason: 'duree_insuffisante',
      message: 'Ce service sera disponible après 6 mois d\'abonnement.'
    };
  }
  
  // Vérifier si l'utilisateur a déjà utilisé ce service ce mois-ci
  const serviceUsage = servicesUsed?.find(s => s.serviceId === serviceId);
  const usedQuantity = serviceUsage ? serviceUsage.quantity : 0;
  
  // Vérifier si la quantité demandée dépasse la limite
  const limits = getLimitsByPlan(plan);
  const serviceLimit = limits[serviceId] || 0;
  
  if (usedQuantity + quantity > serviceLimit) {
    return {
      canUse: false,
      reason: 'limite_service_depassee',
      message: `Vous avez dépassé la limite de ${serviceLimit} ${service.unit} pour ce service.`,
      currentUsage: usedQuantity,
      limit: serviceLimit
    };
  }
  
  return {
    canUse: true,
    remainingQuantity: serviceLimit - usedQuantity
  };
};

/**
 * Met à jour l'utilisation d'un service pour un utilisateur
 * @param {Object} userSubscription - Abonnement de l'utilisateur
 * @param {string} serviceId - ID du service utilisé
 * @param {number} quantity - Quantité utilisée
 * @returns {Object} - Abonnement mis à jour
 */
export const useService = (userSubscription, serviceId, quantity = 1) => {
  // Vérifier si l'utilisateur peut utiliser ce service
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
  
  // Mettre à jour ou ajouter l'utilisation du service
  const serviceIndex = updatedSubscription.servicesUsed.findIndex(s => s.serviceId === serviceId);
  
  if (serviceIndex >= 0) {
    // Mettre à jour l'utilisation existante
    updatedSubscription.servicesUsed[serviceIndex] = {
      ...updatedSubscription.servicesUsed[serviceIndex],
      quantity: updatedSubscription.servicesUsed[serviceIndex].quantity + quantity,
      lastUsed: new Date()
    };
  } else {
    // Ajouter une nouvelle utilisation
    updatedSubscription.servicesUsed.push({
      serviceId,
      quantity,
      lastUsed: new Date()
    });
  }
  
  return updatedSubscription;
};

/**
 * Calcule le nombre de jours avant réinitialisation des tâches mensuelles
 * @returns {number} - Nombre de jours restants
 */
export const getDaysUntilReset = () => {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const diffTime = nextMonth - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};