import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { UserRole } from "@/types";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  // Configuración de sesión
  session: {
    strategy: "jwt",
    maxAge: 1 * 60 * 60, // 1 hora (como especifica el requerimiento)
  },

  // Páginas personalizadas
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },

  // Proveedores de autenticación
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
        // Validar que las credenciales existan
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Credenciales incompletas");
          return null;
        }

        try {
          // Buscar el usuario en la base de datos
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.email },
                { username: credentials.email }, // Permitir login con username también
              ],
              activo: true, // Solo usuarios activos pueden iniciar sesión
            },
          });

          if (!user) {
            console.log("❌ Usuario no encontrado:", credentials.email);
            return null;
          }

          // Verificar la contraseña
          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("❌ Contraseña incorrecta para:", credentials.email);
            return null;
          }

          console.log("✅ Login exitoso:", user.email);

          // Retornar los datos del usuario para la sesión
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

  // Callbacks para manejar JWT y sesión
  callbacks: {
    // Callback del JWT - se ejecuta cada vez que se crea un token
    async jwt({ token, user }) {
      if (user) {
        // Añadir datos personalizados al token
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },

    // Callback de sesión - se ejecuta cada vez que se accede a la sesión
    async session({ session, token }) {
      if (token) {
        // Añadir datos del token a la sesión
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.username = token.username as string;
      }
      return session;
    },

    // Callback de redirect - controla redirecciones después del login
    async redirect({ url, baseUrl }) {
      // Si la URL es relativa, usar la baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Si la URL pertenece al mismo origen, permitir
      else if (new URL(url).origin === baseUrl) return url;
      // Caso contrario, redirigir al dashboard
      return `${baseUrl}/dashboard`;
    },
  },

  // Configuraciones adicionales
  jwt: {
    // Tiempo de vida del token (1 hora)
    maxAge: 60 * 60, // 1 hora
  },

  // Configuración de cookies
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

  // Eventos para logging
  events: {
    async signIn({ user }) {
      console.log(`✅ Usuario ${user.email} inició sesión`);
    },
    async signOut() {
      console.log(`👋 Usuario cerró sesión`);
    },
  },

  // Configuración de debug (solo en desarrollo)
  debug: process.env.NODE_ENV === "development",
};
