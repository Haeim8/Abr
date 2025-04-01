import nodemailer from 'nodemailer';

// Configuration de test (ne nécessite pas de véritable serveur SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'test@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password',
  },
});

// Fonction simple pour envoyer un email
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // En mode développement, juste logger l'email
    if (process.env.NODE_ENV === 'development') {
      console.log('Email qui serait envoyé:', { to, subject, text });
      return { success: true, info: 'Email en mode développement' };
    }

    // En production, envoyer réellement l'email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Khaja" <no-reply@khaja.fr>',
      to,
      subject,
      text,
      html: html || text,
    });

    return { success: true, info };
  } catch (error) {
    console.error('Erreur d\'envoi d\'email:', error);
    return { success: false, error };
  }
};