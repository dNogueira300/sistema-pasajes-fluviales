// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";

// Definir el tipo de roles como union type
type UserRole = "ADMINISTRADOR" | "VENDEDOR" | "OPERADOR_EMBARCACION";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      username: string;
      role: UserRole;
      estadoOperador?: string | null;
      embarcacionAsignadaId?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string;
    role: UserRole;
    estadoOperador?: string | null;
    embarcacionAsignadaId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;
    role: UserRole;
    estadoOperador?: string | null;
    embarcacionAsignadaId?: string | null;
  }
}
