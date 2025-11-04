# 💰 Realizar Ventas

## Introducción

La **venta de pasajes** es el proceso principal del sistema. En esta sección aprenderás a procesar ventas de manera rápida y eficiente, reduciendo el tiempo de atención de 15 minutos a solo 3 minutos.

---

## 🎯 Antes de Empezar

### Prerequisitos

- ✅ Sesión iniciada como **Vendedor** o **Administrador**
- ✅ Cliente identificado (DNI disponible)
- ✅ Conocer detalles del viaje requerido

### Información que Necesitas

- 🆔 **DNI del cliente** (obligatorio)
- 🛣️ **Ruta del viaje** (origen → destino)
- 📅 **Fecha de viaje**
- 🕐 **Hora preferida**
- 🏭 **Puerto de embarque**
- 👥 **Cantidad de pasajes**

---

## 🚀 Proceso de Venta Paso a Paso

### **Paso 1: Acceder al Módulo de Ventas**

1. Desde el **Dashboard principal**, haz clic en **"Nueva Venta"**
2. El sistema abrirá el formulario de venta en **3 pasos**

---

### **Paso 2: Información del Cliente**

#### 2.1 Buscar Cliente Existente

```
1. Ingresa el DNI del cliente en el campo de búsqueda
2. Presiona Enter o clic en "Buscar"
3. El sistema mostrará los datos si el cliente está registrado
```

**🔍 Resultado de la Búsqueda:**

- ✅ **Cliente encontrado**: Se llenan automáticamente los datos
- ❌ **Cliente nuevo**: Aparece formulario de registro

#### 2.2 Registrar Cliente Nuevo

Si el cliente no existe, completa:

| Campo               | Descripción            | Requerido   |
| ------------------- | ---------------------- | ----------- |
| **DNI**             | 8-10 dígitos numéricos | ✅ Sí       |
| **Nombre Completo** | Nombres y apellidos    | ✅ Sí       |
| **Teléfono**        | Número de contacto     | ⚪ Opcional |
| **Email**           | Correo electrónico     | ⚪ Opcional |
| **Nacionalidad**    | País de origen         | ⚪ Opcional |

{% hint style="warning" %}
⚠️ **Importante**: El DNI debe ser único en el sistema. Si aparece error "DNI ya registrado", verifica los datos.
{% endhint %}

#### 2.3 Validaciones Automáticas

El sistema validará:

- ✅ DNI con formato correcto (8-10 dígitos)
- ✅ Nombre completo obligatorio
- ✅ Email con formato válido (@domain.com)
- ✅ Teléfono con formato nacional (+51 999-999-999)

**➡️ Clic en "Continuar" para el siguiente paso**

---

### **Paso 3: Detalles del Viaje**

#### 3.1 Seleccionar Ruta

```
1. Despliega el selector "Ruta"
2. Elige la ruta deseada (Ej: "Iquitos → Yurimaguas")
3. El sistema carga automáticamente las embarcaciones disponibles
```

#### 3.2 Configurar Viaje

Completa la información del viaje:

| Campo                  | Descripción                 | Ejemplo        |
| ---------------------- | --------------------------- | -------------- |
| **Dirección**          | Ida o Vuelta                | "Ida"          |
| **Precio Unitario**    | Precio por pasaje           | S/ 120.00      |
| **Embarcación**        | Nave que realizará el viaje | "Eduardo III"  |
| **Puerto de Embarque** | Lugar de salida             | "Puerto Henry" |
| **Fecha de Viaje**     | Día del viaje               | "25/11/2025"   |
| **Hora de Viaje**      | Hora de salida              | "06:00 AM"     |
| **Hora de Embarque**   | Llegada al puerto           | "05:30 AM"     |
| **Cantidad**           | Número de pasajes           | 2              |

#### 3.3 Verificación de Disponibilidad

El sistema verifica automáticamente:

- ✅ **Asientos disponibles** en la embarcación
- ✅ **Fecha válida** (no puede ser en el pasado)
- ✅ **Hora de embarque** anterior a hora de viaje
- ✅ **Capacidad suficiente** para la cantidad solicitada

{% hint style="success" %}
✅ **Disponibilidad Confirmada**: Aparece mensaje verde "Asientos disponibles"
{% endhint %}

{% hint style="danger" %}
❌ **Sin Disponibilidad**: Mensaje rojo "Sin asientos disponibles para esta fecha"

- **Solución**: Selecciona otra fecha o embarcación
  {% endhint %}

**➡️ Clic en "Continuar" para el resumen final**

---

### **Paso 4: Pago y Confirmación**

#### 4.1 Resumen de la Venta

El sistema muestra:

```
📋 RESUMEN DE VENTA
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Cliente: Juan Pérez García
🆔 DNI: 12345678
🛣️ Ruta: Iquitos → Yurimaguas
📅 Fecha: 25/11/2025 - 06:00 AM
🚢 Embarcación: Eduardo III
🏭 Puerto: Puerto Henry
👥 Pasajes: 2
💰 Precio unitario: S/ 120.00
━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 TOTAL: S/ 240.00
```

#### 4.2 Método de Pago

Selecciona el método de pago:

- 💵 **Efectivo**
- 💳 **Tarjeta**
- 📱 **Transferencia**
- 🔄 **Híbrido** (combinación de métodos)

#### 4.3 Confirmar Venta

```
1. Revisa todos los datos cuidadosamente
2. Confirma el método de pago con el cliente
3. Clic en "CONFIRMAR VENTA"
```

---

## ✅ Resultado Exitoso

### Lo que Sucede Automáticamente

1. 🎫 **Número de venta generado**: Ej. "AIT-2025-001234"
2. 📊 **Asientos reservados** en la embarcación
3. 🗄️ **Venta registrada** en la base de datos
4. ⏰ **Timestamp** de la transacción guardado

### Pantalla de Confirmación

```
🎉 ¡VENTA REALIZADA EXITOSAMENTE!

📄 Número de Venta: AIT-2025-001234
👤 Cliente: Juan Pérez García
💰 Total: S/ 240.00
📅 Creada: 04/11/2025 14:30

[📄 Generar Comprobante]  [🆕 Nueva Venta]
```

---

## 🧾 Generar Comprobante

Inmediatamente después de la venta, puedes generar comprobantes:

### Formatos Disponibles

1. **📄 PDF A4**: Para impresión estándar
2. **🎫 Ticket 80mm**: Para impresoras térmicas
3. **🖼️ Imagen PNG**: Para envío por WhatsApp
4. **📧 Envío por Email**: Directo al cliente

### Proceso Rápido

```
1. Clic en "Generar Comprobante"
2. Selecciona formato deseado
3. El archivo se genera automáticamente
4. Descarga o imprime según necesites
```

---

## ⚠️ Situaciones Especiales

### 🚫 Sin Disponibilidad

**Problema**: "Sin asientos disponibles"
**Solución**:

1. Verifica otras fechas cercanas

### ❌ Error en Datos del Cliente

**Problema**: DNI ya registrado con datos diferentes
**Solución**:

1. Verifica si es el mismo cliente
2. Actualiza datos si es necesario
3. Contacta al administrador si hay conflicto

### 🔄 Cliente Cambia de Opinión

**Problema**: Cliente quiere modificar la venta
**Solución**:

1. **Antes de confirmar**: Modifica directamente
2. **Después de confirmar**: Anula y crea nueva venta

---

## ❓ Preguntas Frecuentes

<details>
<summary><strong>¿Puedo vender más pasajes que la capacidad de la embarcación?</strong></summary>

No, el sistema no permite sobrevender. La validación es automática y te impedirá continuar si no hay suficientes asientos disponibles.

</details>

<details>
<summary><strong>¿Qué hago si el sistema se traba durante una venta?</strong></summary>

1. **No cierres el navegador** - Los datos se guardan automáticamente
2. Actualiza la página (F5)
3. Si persiste, contacta soporte técnico
4. Los datos no se perderán
</details>

<details>
<summary><strong>¿Puedo hacer ventas para fechas muy futuras?</strong></summary>

Sí, no hay límite superior de fecha. Sin embargo, se recomienda vender con máximo 60 días de anticipación por políticas comerciales.

</details>

---

## 🔗 Enlaces Relacionados

- [🧑‍🤝‍🧑 Gestión de Clientes](gestion-clientes.md)
- [🧾 Generar Comprobantes](generar-comprobantes.md)
- [❌ Anular Pasajes](anular-pasajes.md)
- [📊 Reportes de Ventas](reportes-basicos.md)

---

_¿Necesitas ayuda adicional? Contacta al equipo de soporte o revisa la sección de [errores comunes](../solucion-problemas/errores-comunes.md)._
