// src/app/api/notifications/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Notification from '@/models/notifications';
import notificationService from '@/lib/notificationService';

// GET: Récupérer les notifications de l'utilisateur
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    
    await connectToDatabase();
    
    // Construire la requête
    const query = { userId: session.user.id };
    if (unreadOnly) {
      query.read = false;
    }
    
    // Récupérer les notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // Compter les notifications non lues
    const unreadCount = await Notification.countDocuments({ 
      userId: session.user.id,
      read: false 
    });
    
    return NextResponse.json({ 
      notifications,
      unreadCount
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Créer une nouvelle notification
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Vérifier les autorisations: seuls les admins ou le système peuvent créer des notifications
    const isSystem = request.headers.get('x-api-key') === process.env.INTERNAL_API_KEY;
    if (!isSystem && (!session || session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    const notificationData = await request.json();
    
    // Validation
    if (!notificationData.userId || !notificationData.title || !notificationData.message) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Créer la notification via le service
    const notification = await notificationService.createNotification(notificationData);
    
    return NextResponse.json({
      success: true,
      notification: {
        id: notification._id.toString(),
        title: notification.title
      }
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT: Marquer des notifications comme lues
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    const { notificationIds, markAll } = await request.json();
    
    await connectToDatabase();
    
    if (markAll) {
      // Marquer toutes les notifications de l'utilisateur comme lues
      await Notification.updateMany(
        { userId: session.user.id },
        { $set: { read: true } }
      );
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Marquer des notifications spécifiques comme lues
      await notificationService.markAsRead(session.user.id, notificationIds);
    } else {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notifications marquées comme lues'
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}