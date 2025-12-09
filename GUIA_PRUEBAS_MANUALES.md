# 📋 Guía de Pruebas Manuales - eBalance

Esta guía proporciona una lista completa de funcionalidades y casos de prueba para verificar que la aplicación funciona correctamente.

---

## 📑 Índice

1. [Autenticación](#1-autenticación)
2. [Cuentas](#2-cuentas)
3. [Categorías](#3-categorías)
4. [Movimientos/Transacciones](#4-movimientostransacciones)
5. [Presupuestos](#5-presupuestos)
6. [Alertas de Presupuesto](#6-alertas-de-presupuesto)
7. [Dashboard](#7-dashboard)
8. [Perfil de Usuario](#8-perfil-de-usuario)

---

## 1. Autenticación

### 1.1. Registro de Usuario

**Caso 1.1.1: Registro exitoso**
- [ ] Ir a la página de registro
- [ ] Completar todos los campos requeridos:
  - Nombre
  - Apellido
  - Número de identificación
  - Username
  - Email
  - Teléfono (opcional)
  - Contraseña (mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial)
  - Confirmar contraseña
- [ ] Hacer clic en "Crear cuenta"
- [ ] **Verificar:** Se muestra mensaje de éxito o redirección a login
- [ ] **Verificar:** El botón muestra "Creando cuenta..." durante el proceso

**Caso 1.1.2: Validación de contraseña**
- [ ] Intentar registrar con contraseña corta (< 8 caracteres)
- [ ] **Verificar:** Se muestra mensaje de error indicando que la contraseña es muy corta
- [ ] Intentar registrar con contraseña sin mayúscula
- [ ] **Verificar:** Se muestra indicador de que falta mayúscula
- [ ] Intentar registrar con contraseña sin número
- [ ] **Verificar:** Se muestra indicador de que falta número
- [ ] Intentar registrar con contraseña sin carácter especial
- [ ] **Verificar:** Se muestra indicador de que falta carácter especial

**Caso 1.1.3: Contraseñas no coinciden**
- [ ] Ingresar contraseña y confirmación diferente
- [ ] **Verificar:** Se muestra mensaje "Las contraseñas no coinciden"

**Caso 1.1.4: Email duplicado**
- [ ] Intentar registrar con un email ya existente
- [ ] **Verificar:** Se muestra mensaje "Ya existe un usuario con este email"

**Caso 1.1.5: Username duplicado**
- [ ] Intentar registrar con un username ya existente
- [ ] **Verificar:** Se muestra mensaje "Ya existe un usuario con este nombre de usuario"

### 1.2. Inicio de Sesión

**Caso 1.2.1: Login exitoso**
- [ ] Ir a la página de login
- [ ] Ingresar username y contraseña válidos
- [ ] Hacer clic en "Iniciar sesión"
- [ ] **Verificar:** Se redirige al Dashboard
- [ ] **Verificar:** El botón muestra "Iniciando sesión..." durante el proceso

**Caso 1.2.2: Credenciales incorrectas**
- [ ] Intentar iniciar sesión con contraseña incorrecta
- [ ] **Verificar:** Se muestra mensaje "Contraseña incorrecta"
- [ ] Intentar iniciar sesión con username inexistente
- [ ] **Verificar:** Se muestra mensaje "Usuario no encontrado"

**Caso 1.2.3: Mostrar/ocultar contraseña**
- [ ] Ingresar contraseña
- [ ] Hacer clic en el icono de ojo
- [ ] **Verificar:** La contraseña se muestra como texto plano
- [ ] Hacer clic nuevamente
- [ ] **Verificar:** La contraseña se oculta

### 1.3. Recuperación de Contraseña

**Caso 1.3.1: Solicitar recuperación**
- [ ] Ir a "¿Olvidaste tu contraseña?"
- [ ] Ingresar email registrado
- [ ] Hacer clic en "Enviar"
- [ ] **Verificar:** Se muestra mensaje de confirmación

**Caso 1.3.2: Email no registrado**
- [ ] Intentar recuperar contraseña con email no registrado
- [ ] **Verificar:** Se muestra mensaje "No existe un usuario con este email"

---

## 2. Cuentas

### 2.1. Crear Cuenta

**Caso 2.1.1: Crear cuenta de ahorros**
- [ ] Ir a la sección "Cuentas"
- [ ] Hacer clic en "Nueva cuenta"
- [ ] Completar:
  - Nombre: "Cuenta Ahorros Bancolombia"
  - Tipo: Banco
  - Categoría: Cuenta de ahorros
  - Banco: Bancolombia
  - Moneda: COP
  - Saldo inicial: 1000000
- [ ] Hacer clic en "Guardar"
- [ ] **Verificar:** La cuenta aparece en la lista
- [ ] **Verificar:** El saldo se muestra correctamente

**Caso 2.1.2: Crear tarjeta de crédito**
- [ ] Crear nueva cuenta
- [ ] Tipo: Tarjeta de crédito
- [ ] Completar:
  - Nombre: "Visa Bancolombia"
  - Banco: Bancolombia
  - Límite de crédito: 5000000
  - Fecha de vencimiento: (fecha futura)
  - Saldo inicial: -500000 (debe ser negativo o cero)
- [ ] **Verificar:** La tarjeta se crea correctamente
- [ ] **Verificar:** El saldo se muestra como negativo

**Caso 2.1.3: Crear billetera digital**
- [ ] Crear nueva cuenta
- [ ] Tipo: Billetera digital
- [ ] Categoría: Nequi
- [ ] **Verificar:** Se muestra correctamente en la lista

**Caso 2.1.4: Validaciones**
- [ ] Intentar crear cuenta sin nombre
- [ ] **Verificar:** Se muestra error "Este campo es requerido"
- [ ] Intentar crear tarjeta con saldo positivo
- [ ] **Verificar:** Se muestra error "Las tarjetas de crédito no pueden tener saldo positivo"
- [ ] Intentar crear cuenta con nombre duplicado
- [ ] **Verificar:** Se muestra error "Ya tienes una cuenta con este nombre"

### 2.2. Editar Cuenta

**Caso 2.2.1: Editar nombre**
- [ ] Hacer clic en el botón de editar de una cuenta
- [ ] Cambiar el nombre
- [ ] Guardar
- [ ] **Verificar:** El nombre se actualiza en la lista

**Caso 2.2.2: Actualizar saldo**
- [ ] Editar una cuenta
- [ ] Cambiar el saldo
- [ ] **Verificar:** El nuevo saldo se refleja correctamente

### 2.3. Eliminar Cuenta

**Caso 2.3.1: Eliminar cuenta sin movimientos**
- [ ] Hacer clic en eliminar de una cuenta sin transacciones
- [ ] **Verificar:** Aparece modal de confirmación
- [ ] Confirmar eliminación
- [ ] **Verificar:** La cuenta desaparece de la lista

**Caso 2.3.2: Eliminar cuenta con movimientos**
- [ ] Intentar eliminar cuenta que tiene transacciones
- [ ] **Verificar:** Aparece mensaje indicando que tiene movimientos asociados
- [ ] Confirmar eliminación
- [ ] **Verificar:** La cuenta se elimina correctamente

**Caso 2.3.3: Eliminar cuenta con saldo**
- [ ] Intentar eliminar cuenta con saldo diferente de cero
- [ ] **Verificar:** Se muestra mensaje de advertencia
- [ ] **Verificar:** Se puede confirmar o cancelar

### 2.4. Activar/Desactivar Cuenta

**Caso 2.4.1: Desactivar cuenta**
- [ ] Hacer clic en el toggle de activar/desactivar
- [ ] **Verificar:** La cuenta se marca como inactiva
- [ ] **Verificar:** No aparece en listas de cuentas activas

**Caso 2.4.2: Activar cuenta**
- [ ] Activar una cuenta previamente desactivada
- [ ] **Verificar:** La cuenta vuelve a estar activa

### 2.5. Visualización de Saldo

**Caso 2.5.1: Mostrar/ocultar saldo**
- [ ] Hacer clic en el icono de ojo para ocultar saldo
- [ ] **Verificar:** El saldo se muestra como "••••"
- [ ] Hacer clic nuevamente
- [ ] **Verificar:** El saldo se muestra nuevamente

---

## 3. Categorías

### 3.1. Crear Categoría

**Caso 3.1.1: Crear categoría de gasto**
- [ ] Ir a la sección "Categorías"
- [ ] Hacer clic en "Nueva categoría"
- [ ] Completar:
  - Nombre: "Transporte"
  - Tipo: Gasto
  - Color: Seleccionar color
  - Icono: Seleccionar icono
- [ ] Guardar
- [ ] **Verificar:** La categoría aparece en la lista de gastos

**Caso 3.1.2: Crear categoría de ingreso**
- [ ] Crear nueva categoría
- [ ] Tipo: Ingreso
- [ ] Nombre: "Salario"
- [ ] **Verificar:** Aparece en la lista de ingresos

**Caso 3.1.3: Validaciones**
- [ ] Intentar crear categoría sin nombre
- [ ] **Verificar:** Se muestra error
- [ ] Intentar crear categoría con nombre muy corto (< 2 caracteres)
- [ ] **Verificar:** Se muestra error
- [ ] Intentar crear categoría duplicada (mismo nombre y tipo)
- [ ] **Verificar:** Se muestra error "Ya tienes una categoría de {tipo} llamada..."

### 3.2. Editar Categoría

**Caso 3.2.1: Cambiar nombre**
- [ ] Editar una categoría
- [ ] Cambiar el nombre
- [ ] **Verificar:** El nombre se actualiza

**Caso 3.2.2: Cambiar color**
- [ ] Editar categoría
- [ ] Seleccionar nuevo color
- [ ] **Verificar:** El color se actualiza en la lista

**Caso 3.2.3: Editar categoría del sistema**
- [ ] Intentar editar una categoría por defecto (is_default=true)
- [ ] **Verificar:** Se muestra mensaje de que no se puede editar

### 3.3. Eliminar Categoría

**Caso 3.3.1: Eliminar categoría sin transacciones**
- [ ] Eliminar categoría sin movimientos asociados
- [ ] **Verificar:** Se elimina correctamente

**Caso 3.3.2: Eliminar categoría con transacciones**
- [ ] Intentar eliminar categoría con transacciones
- [ ] **Verificar:** Aparece opción de reasignar transacciones
- [ ] Seleccionar categoría de reasignación
- [ ] Confirmar
- [ ] **Verificar:** Las transacciones se reasignan y la categoría se elimina

**Caso 3.3.3: Eliminar categoría del sistema**
- [ ] Intentar eliminar categoría por defecto
- [ ] **Verificar:** Se muestra error "No puedes eliminar una categoría del sistema"

### 3.4. Activar/Desactivar Categoría

**Caso 3.4.1: Desactivar categoría**
- [ ] Desactivar una categoría
- [ ] **Verificar:** No aparece en listas de categorías activas

---

## 4. Movimientos/Transacciones

### 4.1. Crear Movimiento

#### 4.1.1. Ingreso

**Caso 4.1.1.1: Crear ingreso simple**
- [ ] Ir a "Movimientos"
- [ ] Hacer clic en "Nuevo movimiento"
- [ ] Seleccionar tipo: Ingreso
- [ ] Completar:
  - Cuenta origen: Seleccionar cuenta
  - Categoría: Seleccionar categoría de ingreso
  - Monto: 2000000
  - Fecha: (fecha actual)
  - Nota: "Salario mensual"
- [ ] Guardar
- [ ] **Verificar:** El movimiento aparece en la lista
- [ ] **Verificar:** El saldo de la cuenta aumenta

**Caso 4.1.1.2: Ingreso con IVA**
- [ ] Crear ingreso
- [ ] Seleccionar modo: Total
- [ ] Ingresar:
  - Total: 119000
  - IVA (%): 19
- [ ] **Verificar:** Se calcula automáticamente:
  - Base: 100000
  - IVA: 19000
  - Total: 119000

#### 4.1.2. Gasto

**Caso 4.1.2.1: Crear gasto simple**
- [ ] Crear nuevo movimiento
- [ ] Tipo: Gasto
- [ ] Completar campos requeridos
- [ ] **Verificar:** El saldo de la cuenta disminuye

**Caso 4.1.2.2: Gasto con IVA y GMF**
- [ ] Crear gasto
- [ ] Modo: Total
- [ ] Total: 200000
- [ ] IVA (%): 15
- [ ] Cuenta: Cuenta bancaria (no tarjeta de crédito, no exenta)
- [ ] **Verificar:** Se calcula:
  - Base: 173913
  - IVA: 26087
  - GMF (4x1000): 800
  - Total: 200800

**Caso 4.1.2.3: Gasto en tarjeta de crédito (sin GMF)**
- [ ] Crear gasto
- [ ] Cuenta: Tarjeta de crédito
- [ ] Total: 100000
- [ ] IVA: 19%
- [ ] **Verificar:** NO se aplica GMF
- [ ] **Verificar:** Solo se calcula Base e IVA

**Caso 4.1.2.4: Gasto en cuenta exenta de GMF**
- [ ] Crear gasto en cuenta marcada como exenta de GMF
- [ ] **Verificar:** NO se aplica GMF

**Caso 4.1.2.5: Gasto que excede saldo disponible**
- [ ] Crear gasto mayor al saldo de la cuenta
- [ ] **Verificar:** Aparece modal de advertencia (no alert del navegador)
- [ ] **Verificar:** Se puede confirmar o cancelar

**Caso 4.1.2.6: Gasto que excede límite de crédito**
- [ ] Crear gasto en tarjeta que excede el límite disponible
- [ ] **Verificar:** Aparece modal de advertencia
- [ ] **Verificar:** Muestra crédito disponible vs monto del gasto

#### 4.1.3. Transferencia

**Caso 4.1.3.1: Transferencia simple**
- [ ] Crear nuevo movimiento
- [ ] Tipo: Transferencia
- [ ] Cuenta origen: Seleccionar
- [ ] Cuenta destino: Seleccionar (diferente a origen)
- [ ] Monto: 500000
- [ ] **Verificar:** El saldo de origen disminuye
- [ ] **Verificar:** El saldo de destino aumenta
- [ ] **Verificar:** NO se puede seleccionar categoría

**Caso 4.1.3.2: Transferencia con misma cuenta**
- [ ] Intentar transferir de una cuenta a sí misma
- [ ] **Verificar:** Se muestra error "La cuenta destino debe ser diferente"

#### 4.1.4. Modos de Cálculo

**Caso 4.1.4.1: Modo Base**
- [ ] Crear gasto
- [ ] Modo: Base
- [ ] Ingresar Base: 100000
- [ ] IVA: 19%
- [ ] **Verificar:** Se calcula:
  - Base: 100000
  - IVA: 19000
  - Total: 119000

**Caso 4.1.4.2: Modo Total**
- [ ] Crear gasto
- [ ] Modo: Total
- [ ] Ingresar Total: 119000
- [ ] IVA: 19%
- [ ] **Verificar:** Se calcula:
  - Base: 100000 (119000 / 1.19)
  - IVA: 19000
  - Total: 119000

**Caso 4.1.4.3: Cambiar entre modos**
- [ ] Ingresar valores en modo Base
- [ ] Cambiar a modo Total
- [ ] **Verificar:** Los campos se limpian o se recalculan

### 4.2. Validaciones de Movimientos

**Caso 4.2.1: Campos requeridos**
- [ ] Intentar crear movimiento sin cuenta origen
- [ ] **Verificar:** Se muestra error
- [ ] Intentar crear movimiento sin monto
- [ ] **Verificar:** Se muestra error
- [ ] Intentar crear ingreso/gasto sin categoría
- [ ] **Verificar:** Se muestra error

**Caso 4.2.2: Monto inválido**
- [ ] Intentar crear movimiento con monto 0
- [ ] **Verificar:** Se muestra error "El monto debe ser mayor a cero"
- [ ] Intentar crear movimiento con monto negativo
- [ ] **Verificar:** Se muestra error

**Caso 4.2.3: IVA fuera de rango**
- [ ] Intentar ingresar IVA mayor a 30%
- [ ] **Verificar:** Se muestra error "La tasa de IVA debe estar entre 0 y 30%"
- [ ] Intentar ingresar IVA negativo
- [ ] **Verificar:** Se muestra error

**Caso 4.2.4: Categoría incorrecta**
- [ ] Crear ingreso con categoría de gasto
- [ ] **Verificar:** Se muestra error "La categoría debe ser de tipo Ingreso"
- [ ] Crear gasto con categoría de ingreso
- [ ] **Verificar:** Se muestra error "La categoría debe ser de tipo Gasto"

### 4.3. Editar Movimiento

**Caso 4.3.1: Editar monto**
- [ ] Abrir detalle de un movimiento
- [ ] Hacer clic en "Editar"
- [ ] Cambiar el monto
- [ ] Guardar
- [ ] **Verificar:** El movimiento se actualiza
- [ ] **Verificar:** Los saldos de las cuentas se recalculan

**Caso 4.3.2: Editar categoría**
- [ ] Editar movimiento
- [ ] Cambiar categoría
- [ ] **Verificar:** Se actualiza correctamente

### 4.4. Eliminar Movimiento

**Caso 4.4.1: Eliminar movimiento**
- [ ] Abrir detalle de movimiento
- [ ] Hacer clic en "Eliminar"
- [ ] **Verificar:** Aparece modal de confirmación (no window.confirm)
- [ ] Confirmar
- [ ] **Verificar:** El movimiento desaparece
- [ ] **Verificar:** Los saldos de las cuentas se revierten

### 4.5. Duplicar Movimiento

**Caso 4.5.1: Duplicar movimiento**
- [ ] Abrir detalle de movimiento
- [ ] Hacer clic en "Duplicar"
- [ ] **Verificar:** Se abre modal con los mismos datos
- [ ] Modificar fecha o monto
- [ ] Guardar
- [ ] **Verificar:** Se crea un nuevo movimiento

### 4.6. Filtrar y Buscar Movimientos

**Caso 4.6.1: Filtrar por tipo**
- [ ] Seleccionar filtro "Gastos"
- [ ] **Verificar:** Solo se muestran gastos
- [ ] Seleccionar "Ingresos"
- [ ] **Verificar:** Solo se muestran ingresos

**Caso 4.6.2: Buscar por texto**
- [ ] Ingresar texto en el buscador
- [ ] **Verificar:** Se filtran movimientos por nota, etiqueta o cuenta

**Caso 4.6.3: Mostrar desglose fiscal**
- [ ] Activar checkbox "Mostrar desglose fiscal"
- [ ] **Verificar:** Se muestran columnas de Base, IVA, GMF

### 4.7. Crear Categoría desde Movimiento

**Caso 4.7.1: Crear categoría rápida**
- [ ] Al crear movimiento, hacer clic en "+ Nueva categoría"
- [ ] Completar nombre
- [ ] Guardar
- [ ] **Verificar:** La categoría se crea
- [ ] **Verificar:** Se selecciona automáticamente en el movimiento
- [ ] **Verificar:** La página NO se queda en blanco

### 4.8. Inputs de Monto

**Caso 4.8.1: Sin flechas spinner**
- [ ] Abrir modal de nuevo movimiento
- [ ] Hacer clic en campo de monto
- [ ] **Verificar:** NO aparecen flechas arriba/abajo en el input

**Caso 4.8.2: Sin cambio con rueda del mouse**
- [ ] Enfocar campo de monto
- [ ] Usar rueda del mouse
- [ ] **Verificar:** El valor NO cambia

---

## 5. Presupuestos

### 5.1. Crear Presupuesto

**Caso 5.1.1: Crear presupuesto mensual en modo Base**
- [ ] Ir a "Presupuestos"
- [ ] Hacer clic en "Nuevo presupuesto"
- [ ] Completar:
  - Categoría: Seleccionar categoría de gasto
  - Límite: 500000
  - Modo de cálculo: Base
  - Período: Mensual
  - Umbral de alerta: 80%
  - Moneda: COP
- [ ] Guardar
- [ ] **Verificar:** El presupuesto aparece en la lista
- [ ] **Verificar:** Se muestra barra de progreso

**Caso 5.1.2: Crear presupuesto en modo Total**
- [ ] Crear presupuesto
- [ ] Modo: Total
- [ ] **Verificar:** El cálculo considera el total (base + impuestos)

**Caso 5.1.3: Validaciones**
- [ ] Intentar crear presupuesto sin categoría
- [ ] **Verificar:** Se muestra error
- [ ] Intentar crear presupuesto con monto 0
- [ ] **Verificar:** Se muestra error "El monto debe ser mayor a cero"
- [ ] Intentar crear presupuesto para categoría de ingreso
- [ ] **Verificar:** Se muestra error "Solo se pueden crear presupuestos para categorías de gasto"
- [ ] Intentar crear presupuesto duplicado (misma categoría y período)
- [ ] **Verificar:** Se muestra error

### 5.2. Ver Presupuestos

**Caso 5.2.1: Lista de presupuestos**
- [ ] Ir a "Presupuestos"
- [ ] **Verificar:** Se muestran todos los presupuestos activos
- [ ] **Verificar:** Se muestra:
  - Nombre de categoría
  - Límite
  - Gastado
  - Porcentaje
  - Barra de progreso
  - Estado (Bueno/Advertencia/Excedido)
  - Moneda

**Caso 5.2.2: Barras de progreso**
- [ ] Verificar colores de barras:
  - Verde: < 80%
  - Amarillo: 80-99%
  - Rojo: ≥ 100%

**Caso 5.2.3: Proyección de gasto**
- [ ] Ver detalle de presupuesto
- [ ] **Verificar:** Se muestra:
  - Promedio diario
  - Proyección a fin de mes
  - Días restantes
  - Alerta si se proyecta exceder

**Caso 5.2.4: Ver movimientos del presupuesto**
- [ ] Hacer clic en "Ver movimientos"
- [ ] **Verificar:** Se abre lista de movimientos filtrada por categoría y mes

### 5.3. Editar Presupuesto

**Caso 5.3.1: Cambiar límite**
- [ ] Editar presupuesto
- [ ] Cambiar el límite
- [ ] **Verificar:** El límite se actualiza
- [ ] **Verificar:** El porcentaje se recalcula

**Caso 5.3.2: Cambiar umbral de alerta**
- [ ] Editar presupuesto
- [ ] Cambiar umbral a 90%
- [ ] **Verificar:** Se actualiza correctamente

### 5.4. Eliminar Presupuesto

**Caso 5.4.1: Eliminar presupuesto**
- [ ] Eliminar un presupuesto
- [ ] **Verificar:** Aparece modal de confirmación (no window.confirm)
- [ ] Confirmar
- [ ] **Verificar:** El presupuesto desaparece

### 5.5. Activar/Desactivar Presupuesto

**Caso 5.5.1: Desactivar presupuesto**
- [ ] Desactivar un presupuesto
- [ ] **Verificar:** No aparece en listas de presupuestos activos

### 5.6. Actualización Automática

**Caso 5.6.1: Actualización después de movimiento**
- [ ] Crear un gasto en una categoría con presupuesto
- [ ] Ir a "Presupuestos"
- [ ] **Verificar:** El presupuesto muestra el nuevo gasto
- [ ] **Verificar:** El porcentaje se actualiza
- [ ] **Verificar:** La barra de progreso se actualiza

**Caso 5.6.2: Actualización después de editar movimiento**
- [ ] Editar un movimiento que afecta un presupuesto
- [ ] Cambiar el monto
- [ ] **Verificar:** El presupuesto se actualiza

**Caso 5.6.3: Actualización después de eliminar movimiento**
- [ ] Eliminar un movimiento que afecta un presupuesto
- [ ] **Verificar:** El presupuesto se actualiza (disminuye el gasto)

### 5.7. Información de Presupuesto en Modal de Movimiento

**Caso 5.7.1: Mostrar información al seleccionar categoría**
- [ ] Crear nuevo movimiento
- [ ] Seleccionar categoría que tiene presupuesto
- [ ] **Verificar:** Aparece panel con información del presupuesto:
  - Límite
  - Gastado actual
  - Impacto del nuevo gasto
  - Proyección después del gasto
  - Advertencia si excederá

**Caso 5.7.2: Advertencia de exceder presupuesto**
- [ ] Crear gasto que excederá el presupuesto
- [ ] **Verificar:** Se muestra advertencia en rojo
- [ ] **Verificar:** Muestra cuánto excederá

---

## 6. Alertas de Presupuesto

### 6.1. Generación de Alertas

**Caso 6.1.1: Alerta al alcanzar 80%**
- [ ] Crear presupuesto con límite 100000
- [ ] Crear gastos hasta alcanzar 80000 (80%)
- [ ] **Verificar:** Se genera alerta de advertencia
- [ ] **Verificar:** Aparece en el centro de notificaciones

**Caso 6.1.2: Alerta al alcanzar 100%**
- [ ] Continuar gastando hasta 100000 (100%)
- [ ] **Verificar:** Se genera alerta de excedido
- [ ] **Verificar:** Aparece en el centro de notificaciones

**Caso 6.1.3: Una alerta por mes**
- [ ] Alcanzar 80% en enero
- [ ] **Verificar:** Se genera alerta
- [ ] Alcanzar 80% nuevamente en enero (sin eliminar la alerta)
- [ ] **Verificar:** NO se genera otra alerta para el mismo mes
- [ ] Esperar a febrero y alcanzar 80%
- [ ] **Verificar:** Se genera nueva alerta para febrero

### 6.2. Centro de Notificaciones

**Caso 6.2.1: Ver alertas**
- [ ] Hacer clic en el icono de campana en el Dashboard
- [ ] **Verificar:** Se muestra lista de alertas
- [ ] **Verificar:** Se muestra badge con número de alertas no leídas

**Caso 6.2.2: Marcar como leída**
- [ ] Hacer clic en una alerta
- [ ] Hacer clic en "Marcar como leída"
- [ ] **Verificar:** La alerta se marca como leída
- [ ] **Verificar:** El contador de no leídas disminuye

**Caso 6.2.3: Marcar todas como leídas**
- [ ] Hacer clic en "Marcar todas como leídas"
- [ ] **Verificar:** Todas las alertas se marcan como leídas

**Caso 6.2.4: Ver presupuesto desde alerta**
- [ ] Hacer clic en "Ver presupuesto" en una alerta
- [ ] **Verificar:** Se redirige al detalle del presupuesto

**Caso 6.2.5: Eliminar alerta**
- [ ] Eliminar una alerta
- [ ] **Verificar:** La alerta desaparece de la lista

### 6.3. Dashboard - Resumen de Presupuestos

**Caso 6.3.1: Ver resumen**
- [ ] Ir al Dashboard
- [ ] **Verificar:** Se muestra sección "Resumen de Presupuestos"
- [ ] **Verificar:** Se muestran presupuestos con:
  - Nombre de categoría
  - Barra de progreso
  - Porcentaje gastado
  - Proyección si aplica

**Caso 6.3.2: Alertas de proyección**
- [ ] Ver presupuesto que se proyecta exceder
- [ ] **Verificar:** Se muestra alerta visual
- [ ] **Verificar:** Se muestra mensaje de advertencia

---

## 7. Dashboard

### 7.1. Resumen Financiero

**Caso 7.1.1: Ver resumen**
- [ ] Iniciar sesión
- [ ] **Verificar:** Se muestra:
  - Total de ingresos del mes
  - Total de gastos del mes
  - Balance (ingresos - gastos)
  - Gráficos o visualizaciones

**Caso 7.1.2: Actualización en tiempo real**
- [ ] Crear un nuevo movimiento desde el Dashboard
- [ ] **Verificar:** El resumen se actualiza automáticamente

### 7.2. Accesos Rápidos

**Caso 7.2.1: Navegación**
- [ ] Hacer clic en "Cuentas"
- [ ] **Verificar:** Se navega a la sección de cuentas
- [ ] Hacer clic en "Movimientos"
- [ ] **Verificar:** Se navega a movimientos
- [ ] Hacer clic en "Presupuestos"
- [ ] **Verificar:** Se navega a presupuestos

---

## 8. Perfil de Usuario

### 8.1. Ver Perfil

**Caso 8.1.1: Información del usuario**
- [ ] Ir a "Perfil"
- [ ] **Verificar:** Se muestra información del usuario:
  - Nombre completo
  - Email
  - Username
  - Fecha de registro

### 8.2. Editar Perfil

**Caso 8.2.1: Actualizar email**
- [ ] Editar perfil
- [ ] Cambiar email
- [ ] **Verificar:** Se actualiza correctamente
- [ ] Intentar usar email duplicado
- [ ] **Verificar:** Se muestra error

**Caso 8.2.2: Actualizar nombre**
- [ ] Cambiar nombre o apellido
- [ ] **Verificar:** Se actualiza correctamente

### 8.3. Cambiar Contraseña

**Caso 8.3.1: Cambio exitoso**
- [ ] Ir a "Cambiar contraseña"
- [ ] Ingresar contraseña actual
- [ ] Ingresar nueva contraseña
- [ ] Confirmar nueva contraseña
- [ ] **Verificar:** Se cambia correctamente

**Caso 8.3.2: Validaciones**
- [ ] Intentar cambiar con contraseña actual incorrecta
- [ ] **Verificar:** Se muestra error
- [ ] Intentar con contraseñas nuevas que no coinciden
- [ ] **Verificar:** Se muestra error

### 8.4. Eliminar Cuenta

**Caso 8.4.1: Eliminar cuenta**
- [ ] Ir a configuración de cuenta
- [ ] Seleccionar "Eliminar cuenta"
- [ ] **Verificar:** Aparece modal de confirmación
- [ ] Confirmar con "confirm: true"
- [ ] **Verificar:** Se elimina la cuenta
- [ ] **Verificar:** Se redirige al login

**Caso 8.4.2: Validaciones de eliminación**
- [ ] Intentar eliminar cuenta con saldo en cuentas
- [ ] **Verificar:** Se muestra error
- [ ] Intentar eliminar cuenta con transacciones
- [ ] **Verificar:** Se muestra error

---

## 9. Errores y Validaciones Generales

### 9.1. Manejo de Errores

**Caso 9.1.1: Errores de red**
- [ ] Desconectar internet
- [ ] Intentar realizar una acción
- [ ] **Verificar:** Se muestra mensaje de error apropiado (no alert del navegador)

**Caso 9.1.2: Errores 401 (No autorizado)**
- [ ] Esperar a que expire la sesión
- [ ] Intentar realizar una acción
- [ ] **Verificar:** Se redirige al login
- [ ] **Verificar:** Se muestra mensaje "Tu sesión ha expirado"

**Caso 9.1.3: Errores 400 (Validación)**
- [ ] Intentar crear recurso con datos inválidos
- [ ] **Verificar:** Se muestran mensajes de error específicos por campo
- [ ] **Verificar:** NO aparece mensaje genérico "Error en la petición"

**Caso 9.1.4: Errores 404 (No encontrado)**
- [ ] Intentar acceder a recurso inexistente
- [ ] **Verificar:** Se muestra mensaje "Recurso no encontrado"

**Caso 9.1.5: Errores 500 (Error del servidor)**
- [ ] Simular error del servidor (si es posible)
- [ ] **Verificar:** Se muestra mensaje genérico de error del servidor

### 9.2. Modales de Confirmación

**Caso 9.2.1: No usar window.confirm**
- [ ] Realizar acciones que requieren confirmación (eliminar, etc.)
- [ ] **Verificar:** Aparece modal personalizado (ConfirmModal)
- [ ] **Verificar:** NO aparece el alert/confirm nativo del navegador

**Caso 9.2.2: Tipos de modales**
- [ ] Eliminar recurso
- [ ] **Verificar:** Modal tipo "danger" (rojo)
- [ ] Advertencia de crédito
- [ ] **Verificar:** Modal tipo "warning" (amarillo)

---

## 10. Pruebas de Integración

### 10.1. Flujo Completo

**Caso 10.1.1: Flujo de usuario nuevo**
1. [ ] Registrarse
2. [ ] Iniciar sesión
3. [ ] Crear cuenta bancaria
4. [ ] Crear categorías (gasto e ingreso)
5. [ ] Crear presupuesto para categoría de gasto
6. [ ] Registrar ingreso
7. [ ] Registrar gasto que afecta el presupuesto
8. [ ] **Verificar:** El presupuesto se actualiza
9. [ ] **Verificar:** Se genera alerta si corresponde
10. [ ] Ver Dashboard y verificar resumen

**Caso 10.1.2: Flujo de gestión mensual**
1. [ ] Crear múltiples presupuestos
2. [ ] Registrar varios gastos durante el mes
3. [ ] **Verificar:** Los presupuestos se actualizan
4. [ ] **Verificar:** Las alertas se generan correctamente
5. [ ] Editar algunos movimientos
6. [ ] **Verificar:** Los presupuestos se recalculan
7. [ ] Eliminar algunos movimientos
8. [ ] **Verificar:** Los presupuestos se ajustan

---

## 11. Pruebas de Usabilidad

### 11.1. Navegación

**Caso 11.1.1: Navegación intuitiva**
- [ ] Verificar que todos los botones y enlaces funcionan
- [ ] Verificar que el botón "Volver" funciona en todas las secciones
- [ ] Verificar que el menú de navegación es claro

### 11.2. Responsive Design

**Caso 11.2.1: Vista móvil**
- [ ] Abrir la aplicación en dispositivo móvil o reducir el ancho del navegador
- [ ] **Verificar:** Los elementos se adaptan correctamente
- [ ] **Verificar:** Los modales son legibles
- [ ] **Verificar:** Los formularios son usables

### 11.3. Accesibilidad

**Caso 11.3.1: Navegación por teclado**
- [ ] Navegar usando solo el teclado (Tab, Enter, Esc)
- [ ] **Verificar:** Todos los elementos son accesibles

**Caso 11.3.2: Lectores de pantalla**
- [ ] Usar lector de pantalla (si está disponible)
- [ ] **Verificar:** Los elementos tienen etiquetas apropiadas

---

## 12. Checklist de Regresión

### 12.1. Funcionalidades Críticas

Antes de cada release, verificar:

- [ ] Login y registro funcionan
- [ ] Se pueden crear, editar y eliminar cuentas
- [ ] Se pueden crear, editar y eliminar categorías
- [ ] Se pueden crear movimientos (ingreso, gasto, transferencia)
- [ ] El cálculo de IVA y GMF funciona correctamente
- [ ] Los presupuestos se calculan correctamente
- [ ] Las alertas se generan cuando corresponde
- [ ] Los saldos de las cuentas se actualizan correctamente
- [ ] No hay errores en la consola del navegador
- [ ] No se usan window.confirm o alert nativos
- [ ] Los modales de confirmación funcionan
- [ ] Los mensajes de error son claros y específicos

---

## Notas para el Tester

1. **Ambiente de Pruebas**: Asegúrate de tener acceso al backend funcionando
2. **Datos de Prueba**: Crea datos de prueba variados (diferentes tipos de cuentas, categorías, etc.)
3. **Navegadores**: Prueba en al menos Chrome y Firefox
4. **Dispositivos**: Si es posible, prueba en móvil y tablet
5. **Errores**: Documenta cualquier error encontrado con:
   - Pasos para reproducir
   - Comportamiento esperado
   - Comportamiento actual
   - Capturas de pantalla si es necesario
6. **Sugerencias**: Anota cualquier sugerencia de mejora de UX

---

**Última actualización:** 2025-01-15  
**Versión de la aplicación:** 1.0

