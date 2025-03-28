import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { google } from 'googleapis';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/users';

// Configuration OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
);

// Créer un client Calendar
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Crée un nouveau rendez-vous dans Google Calendar
 * @route POST /api/calendar
 */
export async function POST(request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    // Extraire les données de la requête
    const body = await request.json();
    const { 
      title,
      description,
      startDateTime,
      endDateTime,
      location,
      attendeeEmails = [],
      projectId,
      offerId,
      recurrence = null
    } = body;

    // Validation des données
    if (!title || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: 'Le titre, la date de début et la date de fin sont requis' },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    await connectToDatabase();

    // Récupérer l'utilisateur et ses tokens Google
    const user = await User.findById(session.user.id);
    if (!user || !user.googleTokens) {
      return NextResponse.json(
        { error: 'Vous devez connecter votre compte Google pour utiliser cette fonctionnalité' },
        { status: 400 }
      );
    }

    // Configurer les tokens pour l'authentification
    oauth2Client.setCredentials(user.googleTokens);

    // Rafraîchir le token si nécessaire
    if (user.googleTokens.expiry_date < Date.now()) {
      const { tokens } = await oauth2Client.refreshToken(user.googleTokens.refresh_token);
      
      // Mettre à jour les tokens dans la base de données
      user.googleTokens = { ...user.googleTokens, ...tokens };
      await user.save();
      
      // Mettre à jour les tokens pour l'authentification
      oauth2Client.setCredentials(user.googleTokens);
    }

    // Préparer les participants
    const attendees = attendeeEmails.map(email => ({ email }));

    // Ajouter l'email de l'utilisateur s'il n'est pas déjà dans la liste
    if (!attendees.some(attendee => attendee.email === user.email)) {
      attendees.push({ email: user.email });
    }

    // Créer l'événement
    const event = {
      summary: title,
      description,
      location,
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: 'Europe/Paris',
      },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 jour avant
          { method: 'popup', minutes: 60 }, // 1 heure avant
        ],
      },
    };

    // Ajouter la récurrence si spécifiée
    if (recurrence) {
      event.recurrence = recurrence;
    }

    // Insérer l'événement dans le calendrier
    const calendarResponse = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all', // Envoyer des mises à jour par email aux participants
    });

    // Stocker les métadonnées de l'événement pour référence future
    const eventMetadata = {
      eventId: calendarResponse.data.id,
      htmlLink: calendarResponse.data.htmlLink,
      projectId,
      offerId,
      createdBy: session.user.id,
    };

    // Vous pourriez stocker ces métadonnées dans un modèle Event ou dans le modèle Project

    return NextResponse.json(
      { 
        success: true, 
        message: 'Rendez-vous créé avec succès', 
        event: calendarResponse.data 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du rendez-vous' },
      { status: 500 }
    );
  }
}

/**
 * Récupère les prochains rendez-vous de l'utilisateur
 * @route GET /api/calendar
 */
export async function GET(request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    // Extraire les paramètres de la requête
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    
    // Connexion à la base de données
    await connectToDatabase();

    // Récupérer l'utilisateur et ses tokens Google
    const user = await User.findById(session.user.id);
    if (!user || !user.googleTokens) {
      return NextResponse.json(
        { error: 'Vous devez connecter votre compte Google pour utiliser cette fonctionnalité' },
        { status: 400 }
      );
    }

    // Configurer les tokens pour l'authentification
    oauth2Client.setCredentials(user.googleTokens);

    // Rafraîchir le token si nécessaire
    if (user.googleTokens.expiry_date < Date.now()) {
      const { tokens } = await oauth2Client.refreshToken(user.googleTokens.refresh_token);
      
      // Mettre à jour les tokens dans la base de données
      user.googleTokens = { ...user.googleTokens, ...tokens };
      await user.save();
      
      // Mettre à jour les tokens pour l'authentification
      oauth2Client.setCredentials(user.googleTokens);
    }

    // Récupérer les événements
    const calendarResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return NextResponse.json(
      { 
        success: true, 
        events: calendarResponse.data.items 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des rendez-vous' },
      { status: 500 }
    );
  }
}