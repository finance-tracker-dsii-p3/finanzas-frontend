# Pendientes HU-04 — Cuentas (banco/billetera/tarjeta) con saldo inicial

Este documento lista las funcionalidades y campos mencionados en HU-04 que aún no están implementados en el backend o frontend.

---

## Campos faltantes en el modelo de cuentas

### 1. Campo `gmf_exempt` (Exenta GMF)
- **Estado**: ✅ **Implementado** (Backend y Frontend)
- **Responsable**: ✅ Completado
- **Descripción**: Campo booleano que indica si la cuenta está exenta del GMF (Gravamen a los Movimientos Financieros). Este campo debe influir en los cálculos de saldo cuando se realizan transacciones.
- **Ubicación**: Modelo `Account` en el backend, formulario en el frontend
- **Nota**: El campo está disponible en el formulario de creación/edición de cuentas. La lógica de cálculo de saldo considerando GMF debe implementarse en el backend cuando se procesen transacciones.

---

### 2. Campo `expiration_date` (Fecha de vencimiento para tarjetas de crédito)
- **Estado**: ✅ **Implementado** (Backend y Frontend)
- **Responsable**: ✅ Completado
- **Descripción**: Campo de fecha (formato "YYYY-MM-DD") que indica la fecha de vencimiento de una tarjeta de crédito.
- **Ubicación**: Modelo `Account` en el backend, formulario en el frontend (solo para tarjetas)
- **Nota**: El campo está disponible en el formulario cuando se selecciona "Tarjeta de Crédito".

---

### 3. Campo `credit_limit` (Límite de crédito)
- **Estado**: ✅ **Implementado** (Backend y Frontend)
- **Responsable**: ✅ Completado
- **Descripción**: Campo numérico que indica el límite de crédito de una tarjeta. Debe ser mayor a cero.
- **Ubicación**: Modelo `Account` en el backend, formulario en el frontend (solo para tarjetas)
- **Validación**: El frontend valida que sea mayor a cero si se proporciona.

---

### 4. Campos `cut_off_day` y `payment_due_day` — NO se implementan
- **Estado**: ❌ **No se implementarán en cuentas**
- **Razón**: Estos campos son para **FACTURAS**, no para **CUENTAS**
- **Descripción**: 
  - `cut_off_day`: Día del mes en que se corta el estado de cuenta
  - `payment_due_day`: Día del mes en que vence el pago
- **Ubicación futura**: Módulo de facturas (HU futura)
- **Nota importante**: 
  - Las cuentas solo manejan saldos y movimientos
  - Las fechas de corte y pago pertenecen al módulo de facturas
  - El frontend NO debe incluir estos campos en el formulario de cuentas

---

## Funcionalidades pendientes

### 5. Validación de eliminación con mensaje de confirmación mejorado
- **Estado**: ✅ Implementado básicamente
- **Responsable**: 🟡 **Frontend** (mejoras opcionales)
- **Descripción**: Actualmente se valida la eliminación y se muestra un mensaje de confirmación. Se podría mejorar con un modal más elegante en lugar de `window.confirm()`.
- **Mejora sugerida**: Crear un componente `ConfirmDeleteModal` para reemplazar `window.confirm()`

---

### 6. Cálculo de saldo considerando GMF
- **Estado**: ❌ No implementado
- **Responsable**: 🔴 **Backend**
- **Descripción**: Cuando una cuenta NO está exenta de GMF (`gmf_exempt = False`), los movimientos deben aplicar el GMF (4x1000) en los cálculos de saldo.
- **Acción requerida**:
  - Modificar la lógica de cálculo de saldo en movimientos
  - Aplicar GMF cuando `account.gmf_exempt = False`
  - Actualizar los cálculos de balance total

---

### 7. Campos de tarjetas de crédito — COMPLETADO
- **Estado**: ✅ **Implementado completamente**
- **Responsable**: ✅ Completado
- **Descripción**: Campos específicos para tarjetas de crédito en el formulario de cuentas.
- **Campos implementados**:
  - ✅ `expiration_date` — Fecha de vencimiento de la tarjeta (formato: "YYYY-MM-DD")
  - ✅ `credit_limit` — Límite de crédito (debe ser > 0)
- **Campos NO implementados (y no se implementarán)**:
  - ❌ `cut_off_day` — Es para facturas, no para cuentas
  - ❌ `payment_due_day` — Es para facturas, no para cuentas
- **Nota**: Los campos de corte y pago serán parte del módulo de facturas en una HU futura.

---

### 8. Interfaz para campo "Exenta GMF"
- **Estado**: ✅ **Implementado**
- **Responsable**: ✅ Completado
- **Descripción**: Checkbox en el formulario de creación/edición de cuentas para marcar si la cuenta está exenta de GMF.
- **Nota**: El campo está disponible en el formulario con texto de ayuda explicando qué es GMF.

---

## Resumen de responsabilidades

### ✅ Completado

#### Backend (Django)
- ✅ Campo `gmf_exempt` implementado en el modelo `Account`
- ✅ Campo `expiration_date` implementado en el modelo `Account`
- ✅ Campo `credit_limit` implementado en el modelo `Account`
- ✅ Serializers actualizados con los nuevos campos
- ✅ Validaciones implementadas en el backend
- ✅ Migraciones de base de datos actualizadas

#### Frontend (React)
- ✅ Checkbox "Exenta GMF" en el formulario de cuentas
- ✅ Campo de fecha de vencimiento (`expiration_date`) para tarjetas
- ✅ Campo de límite de crédito (`credit_limit`) para tarjetas
- ✅ Validaciones en el frontend
- ✅ Mensajes de error y ayuda contextual

### 🔴 Pendiente (depende de otro módulo)

#### Backend (Django)
- ⏳ Implementar lógica de cálculo de saldo considerando GMF
  - **Nota**: Se implementará cuando exista el modelo de transacciones/movimientos
  - El campo `gmf_exempt` ya está listo y guardándose correctamente
  - La lógica de cálculo se aplicará al procesar transacciones

### ❌ No se implementará (son para facturas)

#### Backend y Frontend
- ❌ `cut_off_day` — No se implementa (es para facturas)
- ❌ `payment_due_day` — No se implementa (es para facturas)
- **Razón**: Estos campos pertenecen al módulo de facturas, no al módulo de cuentas

---

## Notas adicionales

- ✅ Los endpoints principales para CRUD de cuentas están implementados y funcionando.
- ✅ La validación de eliminación (verificar movimientos) está implementada en el backend y se usa en el frontend.
- ✅ El tipo de cuenta (activo/pasivo) está implementado y funciona correctamente.
- ✅ El saldo inicial se guarda y muestra correctamente.
- ✅ Los campos `gmf_exempt`, `expiration_date` y `credit_limit` están implementados y funcionando.

## Aclaración importante

### Campos que NO se implementan en cuentas

Los campos `cut_off_day` (día de corte) y `payment_due_day` (día de pago) **NO se implementan** en el módulo de cuentas porque:

1. **Son para facturas, no para cuentas**: Las cuentas solo manejan saldos y movimientos financieros.
2. **Pertenecen a otra HU**: Estos campos serán parte de una Historia de Usuario futura relacionada con facturas.
3. **Separación de responsabilidades**: Las fechas de corte y pago son características de facturas/tarjetas de crédito como productos financieros, no de las cuentas en sí.

### Lo que SÍ está implementado para tarjetas

- ✅ `expiration_date` — Fecha de vencimiento de la tarjeta física (ej: "2025-12-31")
- ✅ `credit_limit` — Límite de crédito de la tarjeta

### Lógica de GMF

El campo `gmf_exempt` está implementado y se guarda correctamente. La lógica de cálculo de saldo considerando GMF se implementará cuando exista el módulo de transacciones/movimientos, ya que el GMF se aplica a las transacciones, no a las cuentas directamente.

---

**Última actualización**: Actualizado con aclaración sobre campos de facturas
**HU relacionada**: HU-04 — Cuentas (banco/billetera/tarjeta) con saldo inicial

