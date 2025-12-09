# Análisis Pre-Implementación HU-16 - Planes de Cuotas

## 📋 Resumen de Hallazgos

### ✅ Lo que ya está implementado:

1. **Estructura de servicios**: Patrón consistente con `getAuthHeaders()`, manejo de errores, etc.
2. **Componentes base**: `CardDetail.tsx` y `InstallmentCalendar.tsx` ya existen (aunque básicos)
3. **Manejo de monedas**: Sistema de conversión de monedas implementado (`currencyUtils.ts`)
4. **Transferencias**: El servicio de transacciones maneja type=3 (transferencias)
5. **Cuentas de crédito**: Estructura completa con `CreditCardDetails` y propiedades necesarias

### ⚠️ Ajustes necesarios antes de implementar:

#### 1. **Manejo de Montos (CRÍTICO)**
- **Backend espera**: Montos en **centavos** (ej: 1200000 = $1.200.000)
- **Frontend trabaja**: Montos en **pesos** (ej: 1200000 = $1.200.000)
- **Conversión necesaria**: Usar `pesosToCents()` o `Math.round(amount * 100)` antes de enviar
- **Ubicación**: En `NewMovementModal.tsx` ya se usa `convertToCents()` para transacciones

**Ajuste requerido**: 
- Los montos que vienen del backend están en centavos, pero al mostrar se dividen por 100
- Los montos que se envían al backend deben estar en centavos
- Verificar que `formatMoney()` y `formatMoneyFromPesos()` manejen correctamente los centavos

#### 2. **Monedas (IMPORTANTE)**
- **Validación**: El backend valida que las cuentas tengan la misma moneda al hacer pagos
- **Estructura**: `Account.currency: 'COP' | 'USD' | 'EUR'`
- **Manejo actual**: Ya existe validación de monedas en `NewMovementModal` para metas

**Ajuste requerido**:
- Validar que `source_account` y `credit_card_account` tengan la misma moneda antes de crear plan
- Mostrar advertencia si las monedas no coinciden
- Usar el sistema de conversión existente si es necesario

#### 3. **Categoría de Financiamiento (CRÍTICO)**
- **Requisito**: Los intereses deben registrarse en categoría "Financiamiento"
- **Estado actual**: No hay verificación de existencia de esta categoría
- **Riesgo**: Si no existe, el backend rechazará la creación del plan

**Ajuste requerido**:
- Verificar existencia de categoría "Financiamiento" tipo "expense"
- Si no existe, crearla automáticamente o mostrar error claro
- Permitir seleccionar categoría de financiamiento al crear plan

#### 4. **Estructura de Respuestas del Backend**
- **Formato**: `{ status: "success", data: {...} }` o `{ status: "success", data: { count, results } }`
- **Errores**: `{ field_name: ["error"] }` o `{ non_field_errors: ["error"] }`
- **Consistencia**: Algunos endpoints devuelven directamente el objeto, otros dentro de `data`

**Ajuste requerido**:
- Crear función helper para normalizar respuestas del backend
- Manejar ambos formatos de respuesta
- Extraer datos de `data` cuando exista

#### 5. **Fechas**
- **Formato esperado**: ISO `YYYY-MM-DD`
- **Manejo actual**: Ya se usa este formato en transacciones

**Ajuste requerido**: Ninguno, ya está correcto

#### 6. **Tasas de Interés**
- **Backend espera**: String decimal (ej: "2.00" = 2%)
- **Frontend maneja**: Números (ej: 2.0)
- **Conversión**: Convertir número a string con 2 decimales antes de enviar

**Ajuste requerido**:
- Convertir `interestRate` de número a string: `interestRate.toFixed(2)`
- Validar rango (0-100% probablemente)

#### 7. **Componentes Existentes**
- **CardDetail.tsx**: Existe pero usa datos mock (`installmentPlans` está vacío)
- **InstallmentCalendar.tsx**: Existe pero calcula cuotas localmente (no usa datos del backend)

**Ajuste requerido**:
- Conectar `CardDetail` con servicio de planes
- Actualizar `InstallmentCalendar` para usar datos del backend
- Agregar funcionalidad de crear plan desde compra
- Agregar funcionalidad de registrar pago

#### 8. **Dashboard Integration**
- **Endpoint**: `/api/dashboard/` incluye sección `credit_cards`
- **Estado actual**: Dashboard no muestra información de tarjetas de crédito

**Ajuste requerido**:
- Integrar datos de `credit_cards` del dashboard
- Mostrar próximos pagos
- Mostrar resumen mensual

## 🔧 Plan de Implementación

### Fase 1: Servicio Base
1. Crear `creditCardPlanService.ts` con todos los endpoints
2. Implementar funciones helper para normalizar respuestas
3. Manejar conversión de montos (centavos ↔ pesos)
4. Manejar conversión de tasas (número ↔ string)

### Fase 2: Validaciones y Utilidades
1. Función para verificar/crear categoría "Financiamiento"
2. Validación de monedas entre cuentas
3. Validación de que la transacción sea un gasto (type=2)
4. Validación de que la transacción pertenezca a la tarjeta

### Fase 3: Componentes de UI
1. Modal para crear plan de cuotas desde una compra
2. Actualizar `CardDetail` para mostrar planes reales
3. Actualizar `InstallmentCalendar` para usar datos del backend
4. Modal para registrar pago de cuota
5. Modal para editar plan de cuotas

### Fase 4: Integración
1. Integrar en vista de movimientos (botón "Crear plan" en gastos de tarjeta)
2. Integrar en `CardDetail` (mostrar planes activos)
3. Integrar en Dashboard (próximos pagos, resumen mensual)
4. Actualizar reportes si es necesario

## 📝 Notas Importantes

1. **Montos**: Siempre convertir a centavos antes de enviar al backend
2. **Monedas**: Validar coincidencia antes de crear plan o registrar pago
3. **Categoría**: Verificar existencia de "Financiamiento" antes de crear plan
4. **Transferencias**: Los pagos de capital son transferencias (type=3), no gastos
5. **Intereses**: Los intereses son gastos (type=2) en categoría "Financiamiento"
6. **Edición**: Solo se pueden editar planes con cuotas futuras (las pagadas se mantienen)
7. **Tasas**: Enviar como string con 2 decimales (ej: "2.00")

## 🚨 Puntos de Atención

1. **Conversión de montos**: El backend trabaja en centavos, el frontend en pesos
2. **Formato de tasas**: Backend espera string, frontend maneja números
3. **Estructura de respuestas**: Puede variar entre endpoints
4. **Categoría de financiamiento**: Debe existir antes de crear planes
5. **Monedas**: Deben coincidir entre cuentas involucradas

