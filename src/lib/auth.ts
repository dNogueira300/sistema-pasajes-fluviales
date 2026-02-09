// lib/auth.ts - Configuración con redirección por rol
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types";
import { sanitizeEmail } from "@/lib/utils/sanitize";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 3600, // 1 hora en segundos
  },

  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email o Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Credenciales incompletas");
          throw new Error("CredentialsSignin");
        }

        try {
          const sanitizedInput = sanitizeEmail(credentials.email);

          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: sanitizedInput, activo: true },
                { username: sanitizedInput, activo: true },
              ],
            },
            select: {
              id: true,
              email: true,
              username: true,
              nombre: true,
              apellido: true,
              password: true,
              role: true,
              activo: true,
              estadoOperador: true,
              embarcacionAsignadaId: true,
            },
          });

          if (!user) {
            console.log("❌ Usuario no encontrado:", credentials.email);
            throw new Error("CredentialsSignin");
          }

          // Verificar si el usuario está activo
          if (!user.activo) {
            console.log("❌ Usuario inactivo:", credentials.email);
            throw new Error("UserInactive");
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("❌ Contraseña incorrecta para:", credentials.email);
            throw new Error("CredentialsSignin");
          }

          console.log("✅ Login exitoso:", user.email, "Rol:", user.role);

          return {
            id: user.id,
            email: user.email,
            name: `${user.nombre} ${user.apellido}`,
            username: user.username,
            role: user.role as UserRole,
            estadoOperador: user.estadoOperador,
            embarcacionAsignadaId: user.embarcacionAsignadaId,
          };
        } catch (error) {
          console.error("❌ Error en autenticación:", error);

          // Si ya es un error conocido, relanzarlo
          if (error instanceof Error) {
            throw error;
          }

          // Para errores de base de datos u otros errores inesperados
          throw new Error("CredentialsSignin");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
        token.estadoOperador = user.estadoOperador;
        token.embarcacionAsignadaId = user.embarcacionAsignadaId;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.username = token.username as string;
        session.user.estadoOperador = token.estadoOperador;
        session.user.embarcacionAsignadaId = token.embarcacionAsignadaId;
      }
      return session;
    },
  },

  jwt: {
    maxAge: 3600, // 1 hora en segundos
  },

  // Configuración de la cookie para producción
  cookies: {
    sessionToken: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Secure-" : ""
      }next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // useSecureCookies en producción
  useSecureCookies: process.env.NODE_ENV === "production",

  debug: false,
};
