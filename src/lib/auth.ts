// lib/auth.ts - Configuración con redirección por rol
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { UserRole } from "@/types";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 1 * 60 * 60, // 1 hora
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
        email: {
          label: "Email o Usuario",
          type: "text",
          placeholder: "usuario@ejemplo.com o username",
        },
        password: {
          label: "Contraseña",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Credenciales incompletas");
          return null;
        }

        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.email },
                { username: credentials.email },
              ],
              activo: true,
            },
          });

          if (!user) {
            console.log("❌ Usuario no encontrado:", credentials.email);
            return null;
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("❌ Contraseña incorrecta para:", credentials.email);
            return null;
          }

          console.log("✅ Login exitoso:", user.email, "Rol:", user.role);

          return {
            id: user.id,
            email: user.email,
            name: `${user.nombre} ${user.apellido}`,
            username: user.username,
            role: user.role as UserRole,
          };
        } catch (error) {
          console.error("❌ Error en autenticación:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.username = token.username as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback:", { url, baseUrl });

      // Si es una URL relativa, combinar con baseUrl
      if (url.startsWith("/")) {
        const fullUrl = `${baseUrl}${url}`;
        console.log("✅ Redirecting to relative URL:", fullUrl);
        return fullUrl;
      }

      // Si la URL pertenece al mismo origen, permitir
      if (url.startsWith(baseUrl)) {
        console.log("✅ Same origin redirect:", url);
        return url;
      }

      // Para login, no redirigir aquí (se maneja en el cliente)
      if (url.includes("/api/auth/signin") || url.includes("/login")) {
        console.log("⚠️ Login detected, default redirect");
        return baseUrl;
      }

      // Para cualquier otra URL externa, redirigir a la base
      console.log("⚠️ External URL redirect:", url);
      return baseUrl;
    },
  },

  jwt: {
    maxAge: 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  events: {
    async signIn({ user }) {
      console.log(`✅ Usuario ${user.email} inició sesión`);
    },
    async signOut() {
      console.log(`👋 Usuario cerró sesión`);
    },
  },

  debug: process.env.NODE_ENV === "development",
};
