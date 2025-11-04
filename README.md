# 🚢 Sistema Web de Gestión de Ventas de Pasajes Fluviales

## Alto Impacto Travel - Iquitos, Loreto

Sistema integral de gestión de pasajes fluviales diseñado para automatizar y optimizar las operaciones comerciales de la microempresa Alto Impacto Travel, ubicada en Jr. Fitzcarrald 513, Iquitos.

---

## 📋 Descripción del Proyecto

Este sistema web aborda la necesidad crítica de automatizar los procesos manuales de venta de pasajes fluviales, mejorando significativamente la experiencia del cliente y el control operacional.

---

## 🎯 Características Principales

### Módulos del Sistema

#### 🔐 Autenticación y Seguridad

- Login seguro con validación de credenciales
- Encriptación SHA-256 para contraseñas
- Control de acceso basado en roles (RBAC)
- Sesiones con timeout automático (60 minutos)

#### 👥 Gestión de Usuarios

- Creación y administración de usuarios
- Roles: Administrador y Vendedor
- Validación de datos y unicidad de email

#### 🗺️ Gestión de Rutas

- CRUD completo de rutas fluviales
- Validación de puertos origen/destino
- Asignación de embarcaciones a rutas
- Control de precios (S/0 - S/1000)

#### 🚤 Gestión de Embarcaciones

- Catálogo de embarcaciones
- Capacidad: 10-200 pasajeros
- Control de disponibilidad automático
- Desactivación lógica

#### ⚓ Gestión de Puertos

- CRUD de puertos de embarque
- Validación de direcciones
- Control de estado activo/inactivo

#### 👤 Gestión de Clientes

- Registro con DNI único (8 dígitos)
- Búsqueda por DNI o nombre
- Historial de compras
- Validación en tiempo real

#### 💰 Proceso de Venta

- Verificación de disponibilidad en tiempo real
- Numeración automática de ventas
- Cálculo automático de totales
- Múltiples métodos de pago
- **Proceso completo en máximo 3 minutos**

#### 🧾 Generación de Comprobantes

- **4 formatos disponibles:**
  - Formato A4 con logotipo
  - Ticket térmico 80mm
  - PDF descargable
  - Imagen JPG/PNG (max 2MB)
- Numeración correlativa obligatoria

#### ❌ Gestión de Anulaciones

- Anulación con motivo obligatorio
- Liberación inmediata de asientos
- Trazabilidad completa (fecha, hora, usuario)
- Solo pasajes no vencidos

#### 📊 Reportes y Estadísticas

- Reportes diarios automáticos
- Filtros por fecha, ruta, embarcación, vendedor
- Exportación a PDF y Excel
- Gráficos estadísticos
- Generación en ≤5 segundos

---

## 🛠️ Stack Tecnológico

### Frontend

- **Next.js** - Framework React para desarrollo web moderno
- **Tailwind CSS** - Styling responsive y rápido
- **TypeScript** - Tipado estático para mayor robustez

### Backend

- **Next.js API Routes** - Backend integrado
- **Prisma ORM** - Gestión intuitiva de base de datos
- **NextAuth.js** - Autenticación lista para usar

### Base de Datos

- **PostgreSQL** - Base de datos relacional robusta
- **Supabase/Railway** - Hosting de base de datos (gratis)

### Deployment

- **Vercel** - Deploy automático desde GitHub
- **GitHub** - Control de versiones

---

## 🚀 Instalación y Configuración

## 👥 Usuarios del Sistema

### Administrador (1 persona)

- **Perfil:** 40 años promedio, nivel tecnológico intermedio
- **Acceso:** Control total del sistema
- **Funciones:**
  - Dashboard ejecutivo
  - Gestión de usuarios y permisos
  - Reportes detallados y estadísticas
  - Análisis de tendencias

### Vendedores (4 personas)

- **Perfil:** 30 años promedio, nivel tecnológico básico
- **Acceso:** Operaciones de venta
- **Funciones:**
  - Procesamiento rápido de ventas
  - Consulta de rutas y precios
  - Generación de comprobantes
  - Búsqueda de clientes

---

## 🚀 Instalación y Configuración

### Prerrequisitos

```bash
- Node.js 18+
- PostgreSQL 14+
- Git
- npm o yarn
```

### Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/alto-impacto-travel.git
cd alto-impacto-travel
```

2. **Instalar dependencias**

```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/alto_impacto"
NEXTAUTH_SECRET="tu-secret-key-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Configurar base de datos**

```bash
npx prisma migrate dev
npx prisma db seed
```

5. **Iniciar servidor de desarrollo**

```bash
npm run dev
# o
yarn dev
```

Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📖 Documentación Técnica

### Arquitectura del Sistema

```
┌─────────────────────────────────────────┐
│          Frontend (Next.js)              │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │Dashboard │  │  Ventas  │  │Reportes││
│  └──────────┘  └──────────┘  └────────┘│
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       API Routes (Next.js Backend)       │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │   Auth   │  │   CRUD   │  │Reports ││
│  └──────────┘  └──────────┘  └────────┘│
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Prisma ORM Layer                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      PostgreSQL Database                 │
│  ┌──────┐  ┌────────┐  ┌──────────────┐│
│  │Users │  │ Routes │  │Transactions  ││
│  └──────┘  └────────┘  └──────────────┘│
└─────────────────────────────────────────┘
```

---

## 📦 Deployment

### Deployment en Vercel (Recomendado)

1. **Conectar repositorio GitHub con Vercel**
2. **Configurar variables de entorno en Vercel**
3. **Deploy automático en cada push a main**

```bash
# Build de producción
npm run build

# Preview local de producción
npm run start
```

---

## 📚 Recursos de Aprendizaje

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NextAuth.js Guide](https://next-auth.js.org/getting-started/introduction)

---

## 👨‍💻 Equipo de Desarrollo

- Angie Dayana Cabanillas Rondona
- Dan Willy Chasnamote Navarro
- Elias Daniel Nogueira Del Aguila
- Leonardo Danilo Alvarado Silvano
- Niquelson Freddy Romero Rosario
- Paulo Ricardo Meza Espinoza
- Roy Junior Torres Rios
- Rufino Anselmo Valles Garcia

---

## 📄 Licencia

Este proyecto es de **código abierto** y está disponible libremente para su uso, modificación y distribución.

---

## 📞 Contacto

**Alto Impacto Travel**

- 📍 Dirección: Jr. Fitzcarrald 513, Iquitos, Loreto, Perú

---

**Hecho con ❤️ en Iquitos, Loreto - Perú 🇵🇪**
