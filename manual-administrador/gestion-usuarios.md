# 👥 Gestión de Usuarios

## Introducción

Como **Administrador**, tienes control total sobre los usuarios del sistema. Esta sección te enseña a crear, modificar, activar/desactivar usuarios y gestionar sus permisos de manera segura.

---

## 🎯 Roles del Sistema

### 👨‍💼 Administrador

**Permisos completos:**

- ✅ Gestión total de usuarios
- ✅ Configuración de rutas y embarcaciones
- ✅ Acceso a todos los reportes
- ✅ Configuración del sistema
- ✅ Todas las funciones de vendedor

### 👤 Vendedor

**Permisos operativos:**

- ✅ Gestión de clientes
- ✅ Realizar ventas
- ✅ Generar comprobantes
- ✅ Anular pasajes
- ✅ Reportes básicos
- ❌ NO puede crear usuarios
- ❌ NO accede a configuración

---

## 🚀 Acceder a Gestión de Usuarios

### Desde el Dashboard

```
1. Menú lateral izquierdo
2. Seleccionar "Gestión de Usuarios"
3. La pantalla muestra la lista actual de usuarios
```

### Vista Principal

La pantalla principal muestra:

| Columna           | Descripción                 |
| ----------------- | --------------------------- |
| **Nombre**        | Nombre completo del usuario |
| **Email**         | Correo electrónico (login)  |
| **Username**      | Nombre de usuario           |
| **Rol**           | ADMINISTRADOR / VENDEDOR    |
| **Estado**        | ACTIVO / INACTIVO           |
| **Último Acceso** | Fecha del último login      |
| **Acciones**      | Editar / Cambiar Contraseña |

---

## ➕ Crear Nuevo Usuario

### Paso 1: Iniciar Creación

```
1. Clic en botón "Nuevo Usuario" (esquina superior derecha)
2. Se abre el formulario de registro
```

### Paso 2: Completar Información

#### Datos Personales

| Campo               | Descripción         | Validación                         |
| ------------------- | ------------------- | ---------------------------------- |
| **Nombre Completo** | Nombres y apellidos | Obligatorio, mín. 3 caracteres     |
| **Email**           | Correo para login   | Obligatorio, formato válido, único |
| **Username**        | Nombre de usuario   | Obligatorio, único, sin espacios   |

#### Credenciales de Acceso

| Campo                    | Descripción      | Validación                                            |
| ------------------------ | ---------------- | ----------------------------------------------------- |
| **Contraseña**           | Password inicial | Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número |
| **Confirmar Contraseña** | Repetir password | Debe coincidir exactamente                            |

#### Configuración del Usuario

| Campo              | Descripción              | Opciones                 |
| ------------------ | ------------------------ | ------------------------ |
| **Rol**            | Permisos del usuario     | ADMINISTRADOR / VENDEDOR |
| **Estado Inicial** | Disponibilidad inmediata | ACTIVO / INACTIVO        |

### Paso 3: Validaciones Automáticas

El sistema valida automáticamente:

- ✅ **Email único**: No puede existir otro usuario con el mismo email
- ✅ **Username único**: No puede repetirse el nombre de usuario
- ✅ **Formato de email**: Debe ser válido (@domain.com)
- ✅ **Política de contraseñas**: Cumple requisitos de seguridad

{% hint style="info" %}
💡 **Tip**: Usa emails corporativos como `juan.perez@altoimpacto.com` para mayor profesionalidad
{% endhint %}

### Paso 4: Confirmar Creación

```
1. Revisa toda la información ingresada
2. Clic en "Crear Usuario"
3. El sistema confirma la creación exitosa
```

### Resultado Exitoso

```
✅ Usuario creado exitosamente
👤 Nombre: Juan Pérez García
📧 Email: juan.perez@altoimpacto.com
🔑 Username: jperez
👨‍💼 Rol: VENDEDOR
🟢 Estado: ACTIVO
```

---

## ✏️ Editar Usuario Existente

### Acceder a Edición

```
1. En la lista de usuarios, localiza el usuario deseado
2. Clic en el icono de "Editar" (lápiz) en la columna Acciones
3. Se abre el formulario pre-llenado con datos actuales
```

### Campos Editables

| Campo               | ¿Se puede modificar? | Notas                     |
| ------------------- | -------------------- | ------------------------- |
| **Nombre Completo** | ✅ Sí                | Actualización libre       |
| **Email**           | ❌ No                | Requiere proceso especial |
| **Username**        | ❌ No                | Identificador fijo        |
| **Rol**             | ✅ Sí                | ADMINISTRADOR ↔ VENDEDOR  |
| **Estado**          | ✅ Sí                | ACTIVO ↔ INACTIVO         |

{% hint style="warning" %}
⚠️ **Importante**: Cambiar el rol de un usuario afecta inmediatamente sus permisos. Los usuarios conectados deben cerrar sesión y volver a ingresar.
{% endhint %}

### Guardar Cambios

```
1. Modifica los campos necesarios
2. Clic en "Actualizar Usuario"
3. Confirmación de cambios guardados
```

---

## 🔐 Cambiar Contraseña

### Cuándo Cambiar Contraseñas

- 🔒 Usuario olvidó su contraseña
- 🔄 Rotación de seguridad periódica
- 🚨 Posible compromiso de credenciales
- 👋 Usuario nuevo necesita personalizar

### Proceso de Cambio

```
1. En la lista de usuarios, clic en "Cambiar Contraseña"
2. Aparece formulario específico de contraseña
3. Ingresa nueva contraseña (cumplir política)
4. Confirma la nueva contraseña
5. Clic en "Actualizar Contraseña"
```

### Política de Contraseñas

- 📏 **Mínimo 8 caracteres**
- 🔤 **Al menos 1 letra mayúscula** (A-Z)
- 🔡 **Al menos 1 letra minúscula** (a-z)
- 🔢 **Al menos 1 número** (0-9)
- 🚫 **No usar datos personales** (nombre, email)

#### Ejemplos de Contraseñas Válidas

```
✅ MiClave123
✅ Trabajo2025!
✅ SistemaVenta99
```

#### Ejemplos de Contraseñas Inválidas

```
❌ 12345678 (solo números)
❌ password (solo minúsculas, muy común)
❌ Juan123 (contiene nombre)
```

---

## 🔄 Gestión de Estados

### Estado ACTIVO

- ✅ Usuario puede iniciar sesión
- ✅ Acceso completo según su rol
- ✅ Aparece en reportes de actividad

### Estado INACTIVO

- ❌ No puede iniciar sesión
- ❌ Sesiones activas se cierran automáticamente
- ⚪ Se mantiene en la base de datos
- ℹ️ Útil para usuarios temporales

### Cambiar Estado

```
1. Localiza el usuario en la lista
2. Clic en "Editar"
3. Cambia el "Estado" a ACTIVO/INACTIVO
4. Guarda los cambios
```

{% hint style="danger" %}
⚠️ **Cuidado**: No desactives tu propio usuario administrador. Podrías perder acceso al sistema.
{% endhint %}

---

## 👀 Monitoreo de Usuarios

### Información de Actividad

La lista muestra para cada usuario:

- 🕐 **Último acceso**: Fecha y hora del último login
- 📊 **Frecuencia de uso**: Indicador visual de actividad
- 🎯 **Acciones recientes**: Últimas operaciones realizadas

### Usuarios Inactivos

Identifica usuarios que no han ingresado recientemente:

- 🔴 **+30 días**: Considera desactivar
- 🟡 **7-30 días**: Usuario poco activo
- 🟢 **<7 días**: Usuario activo

---

## 🛡️ Seguridad y Buenas Prácticas

### Creación de Usuarios

1. **Principio de menor privilegio**: Asigna solo los permisos necesarios
2. **Usuarios únicos**: Una cuenta por persona física
3. **Contraseñas temporales**: Que el usuario cambie en primer acceso
4. **Revisión periódica**: Evalúa necesidad de cada cuenta

### Gestión de Accesos

1. **Desactiva inmediatamente** usuarios que dejen la empresa
2. **Rotación de contraseñas** cada 90 días
3. **Monitoreo de actividad** sospechosa
4. **Backup de configuración** antes de cambios masivos

### Roles y Permisos

1. **Máximo 2-3 administradores** para evitar conflictos
2. **Mayoría como vendedores** para operación diaria
3. **Promociones graduales** de vendedor a administrador
4. **Documentar cambios** importantes de roles

---

## 📊 Reportes de Usuarios

### Información Disponible

- 👥 **Total de usuarios**: Activos vs Inactivos
- 🎭 **Distribución por roles**: Admin vs Vendedores
- 📈 **Actividad reciente**: Logins por período
- 🏆 **Usuarios más activos**: Ranking de uso

### Generar Reporte

```
1. Desde "Gestión de Usuarios"
2. Clic en "Generar Reporte"
3. Selecciona período de análisis
4. Descarga en formato Excel/PDF
```

---

## ❓ Preguntas Frecuentes

<details>
<summary><strong>¿Puedo tener dos usuarios administradores?</strong></summary>

Sí, puedes tener múltiples administradores. Sin embargo, se recomienda máximo 2-3 para evitar conflictos de configuración.

</details>

<details>
<summary><strong>¿Qué pasa si desactivo mi propio usuario?</strong></summary>

No puedes desactivar tu propio usuario. El sistema lo previene automáticamente para evitar que pierdas acceso.

</details>

<details>
<summary><strong>¿Los usuarios inactivos ocupan licencias?</strong></summary>

No, este sistema no tiene límite de usuarios. Los usuarios inactivos simplemente no pueden acceder pero mantienen sus datos.

</details>

<details>

---

## 🔗 Enlaces Relacionados

- [🔐 Primer Acceso al Sistema](../guia-inicio/primer-acceso.md)
- [🛣️ Gestión de Rutas](gestion-rutas.md)
- [🚢 Gestión de Embarcaciones](gestion-embarcaciones.md)
- [📊 Reportes Avanzados](reportes-avanzados.md)

---

_¿Necesitas crear usuarios masivamente o tienes casos especiales? Contacta al equipo de soporte técnico._
