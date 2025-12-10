# 📊 Análisis de Cobertura de Código

## Estado Actual
- **Cobertura actual**: 35%
- **Umbral requerido**: 45%
- **Déficit**: 10 puntos porcentuales

## Estrategia para Aumentar Cobertura

### 🎯 Prioridad Alta (Mayor Impacto, Menor Esfuerzo)

#### 1. **Utils con 0% o baja cobertura** (Impacto: ~3-5%)
- ✅ `cookieUtils.ts` - Ya tiene 100% (según reporte local)
- ⚠️ `authErrorHandler.ts` - 13.33% (fácil de mejorar)
- ⚠️ `financingCategoryUtils.ts` - 2.5% (fácil de mejorar)

**Acción**: Agregar tests para casos faltantes en `authErrorHandler` y `financingCategoryUtils`.

#### 2. **Servicios con tests pero 0% de cobertura** (Impacto: ~5-8%)
Estos servicios tienen archivos `.test.ts` pero muestran 0% en CI:
- `accountService.ts` - Tiene `accountService.test.ts` pero muestra 0%
- `baseCurrencyService.ts` - Tiene `baseCurrencyService.test.ts` pero muestra 0%
- `exchangeRateService.ts` - Tiene `exchangeRateService.test.ts` pero muestra 0%

**Acción**: Verificar que los tests se ejecuten correctamente y cubran todos los métodos.

#### 3. **Puntos de entrada simples** (Impacto: ~1-2%)
- `App.tsx` - 0% (73 líneas) - Componente de rutas, fácil de testear
- `main.tsx` - 0% (14 líneas) - Punto de entrada, muy fácil de testear

**Acción**: Agregar tests básicos de renderizado.

### 🎯 Prioridad Media (Impacto Moderado)

#### 4. **Componentes pequeños con 0%** (Impacto: ~2-3%)
- `FinanceAnimation.tsx` - 0% (53 líneas)
- `ConfirmModal.tsx` - Ya tiene 86.84%, mejorar casos edge
- `ProtectedRoute.tsx` - Ya tiene 100% ✅

#### 5. **Servicios sin tests** (Impacto: ~3-5%)
- `creditCardPlanService.ts` - 0% (sin test)
- `ruleService.ts` - 0% (sin test)
- `analyticsService.ts` - 0% (sin test)

**Acción**: Agregar tests básicos para métodos principales.

### 🎯 Prioridad Baja (Mayor Esfuerzo)

#### 6. **Páginas completas con 0%** (Impacto: ~5-10% pero mucho esfuerzo)
- `Dashboard.tsx` - 0% (974 líneas) - Muy grande
- `Budgets.tsx` - 0% (606 líneas)
- `Goals.tsx` - 0% (308 líneas)
- `Reports.tsx` - 0% (238 líneas)
- `CardDetail.tsx` - 0% (361 líneas)

**Acción**: Agregar tests básicos de renderizado inicial (no toda la funcionalidad).

## Plan de Acción Recomendado

### Fase 1: Quick Wins (Puede alcanzar 45%+)
1. ✅ Mejorar `authErrorHandler.test.ts` - Agregar casos faltantes
2. ✅ Mejorar `financingCategoryUtils.test.ts` - Agregar más casos
3. ✅ Agregar test básico para `App.tsx`
4. ✅ Agregar test básico para `main.tsx`
5. ✅ Verificar y mejorar tests de servicios existentes

**Estimado**: +8-12% de cobertura

### Fase 2: Componentes Pequeños
1. Agregar test para `FinanceAnimation.tsx`
2. Mejorar cobertura de `ConfirmModal.tsx` al 100%
3. Agregar tests básicos para servicios sin tests

**Estimado**: +3-5% de cobertura adicional

### Fase 3: Páginas Principales (Opcional)
1. Agregar tests básicos de renderizado para páginas grandes
2. Agregar tests de integración para flujos críticos

**Estimado**: +5-10% de cobertura adicional

## Archivos por Categoría

### ✅ Alta Cobertura (>80%)
- `cookieUtils.ts` - 100%
- `ProtectedRoute.tsx` - 100%
- `Login.tsx` - 94.83%
- `Register.tsx` - 95.91%
- `ConfirmModal.tsx` - 86.84%
- `currencyUtils.ts` - 87.09%

### ⚠️ Cobertura Media (40-80%)
- `Categories.tsx` - 69.83%
- `Accounts.tsx` - 60.75%
- `Movements.tsx` - 67.27%
- `NewAccountModal.tsx` - 72.11%
- `NewMovementModal.tsx` - 53.87%

### ❌ Baja Cobertura (<40%)
- `AlertCenter.tsx` - 18.67%
- `AlertContext.tsx` - 44.34%
- `AuthContext.tsx` - 51.02%
- `BudgetContext.tsx` - 48.91%
- `CategoryContext.tsx` - 57.55%

### ❌ Sin Cobertura (0%)
- `App.tsx`
- `main.tsx`
- `Dashboard.tsx`
- `Budgets.tsx`
- `Goals.tsx`
- `Reports.tsx`
- `CardDetail.tsx`
- `FinanceAnimation.tsx`
- Y muchos más...

## Notas Importantes

1. **Discrepancia entre local y CI**: El reporte muestra `vitest v2.1.9` en CI pero localmente tenemos `v4.0.15`. Esto puede causar diferencias en el reporte.

2. **Servicios con tests pero 0%**: Algunos servicios tienen archivos de test pero muestran 0% de cobertura. Esto sugiere que:
   - Los tests no se están ejecutando correctamente en CI
   - Los tests no cubren realmente el código
   - Hay un problema de configuración

3. **Estrategia recomendada**: Enfocarse en Fase 1 (Quick Wins) para alcanzar el 45% rápidamente, luego continuar con las demás fases según necesidad.


