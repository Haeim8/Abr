
// src/app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/users';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        try {
          // S'assurer que la connexion à la base de données est établie
          await connectToDatabase();
          console.log("Connexion à MongoDB réussie pour auth");
          
          // Vérifier que le modèle est bien importé
          if (!User) {
            console.error("Modèle User non disponible");
            throw new Error("Erreur interne du serveur");
          }
          
          // Rechercher l'utilisateur par email
          const user = await User.findOne({ email: credentials.email }).select('+password');
          
          if (!user) {
            console.log("Utilisateur non trouvé");
            return null;
          }
          
          // Vérifier le mot de passe
          const isMatch = await user.matchPassword(credentials.password);
          
          if (!isMatch) {
            console.log("Mot de passe incorrect");
            return null;
          }
          
          // Retourner l'utilisateur sans le mot de passe
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role
          };
        } catch (error) {
          console.error("Erreur d'authentification:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // Ajouter des données supplémentaires au token JWT lors de la connexion
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      // Ajouter des données au session client
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };