# 🧪 Guía de Pruebas - HU-07 y HU-08

## 📋 Requisitos Previos

1. **Backend funcionando**: Asegúrate de que el backend esté corriendo en `http://localhost:8000`
2. **Usuario autenticado**: Debes tener una sesión activa en el frontend
3. **Categorías de gasto**: Necesitas al menos una categoría de tipo "expense" creada

---

## 🎯 HU-07: Presupuestos por Categoría

### 1. Crear un Presupuesto

**Pasos:**
1. Inicia sesión en la aplicación
2. Ve al Dashboard
3. Haz clic en "Presupuestos" en el menú superior
4. Haz clic en "Nuevo presupuesto"
5. Completa el formulario:
   - **Categoría**: Selecciona una categoría de gasto
   - **Límite mensual**: Ingresa un monto (ej: 400000)
   - **Modo de cálculo**: Selecciona "Base (sin impuestos)" o "Total (con impuestos)"
   - **Umbral de alerta**: Deja en 80% o cambia según prefieras
6. Haz clic en "Crear presupuesto"

**✅ Verificar:**
- El presupuesto aparece en la lista
- Se muestra la barra de progreso
- Se muestra el porcentaje gastado (debe ser 0% inicialmente)
- Se muestra el monto restante (debe ser igual al límite)

### 2. Ver Detalle del Presupuesto

**Pasos:**
1. En la lista de presupuestos, haz clic en el ícono de "ojo" (Ver detalle)
2. Revisa la información mostrada

**✅ Verificar:**
- Se muestra el modal con el detalle completo
- Aparece la sección "Proyección mensual" con:
  - Proyección estimada
  - Promedio diario
  - Días restantes
  - Estado (Dentro del límite / Excederá)
- Los botones "Ver movimientos" y "Editar" funcionan

### 3. Editar Presupuesto

**Pasos:**
1. Haz clic en el ícono de "editar" (lápiz) en un presupuesto
2. Modifica el monto o el umbral de alerta
3. Haz clic en "Guardar cambios"

**✅ Verificar:**
- Los cambios se guardan correctamente
- La lista se actualiza con los nuevos valores
- La barra de progreso se recalcula

### 4. Probar Modo Base vs Total

**Pasos:**
1. Crea dos presupuestos para la misma categoría (o diferentes):
   - Uno con modo "Base (sin impuestos)"
   - Otro con modo "Total (con impuestos)"
2. Crea transacciones de gasto con IVA para esa categoría
3. Observa cómo se calcula el gasto en cada presupuesto

**✅ Verificar:**
- El presupuesto en modo "Base" solo cuenta el monto base (sin IVA)
- El presupuesto en modo "Total" cuenta el monto total (con IVA)
- Las barras de progreso reflejan correctamente el cálculo

### 5. Ver Resumen en Dashboard

**Pasos:**
1. Ve al Dashboard principal
2. Desplázate hacia abajo

**✅ Verificar:**
- Aparece la sección "Resumen de Presupuestos"
- Se muestran hasta 6 presupuestos con:
  - Nombre de la categoría
  - Barra de progreso
  - Porcentaje gastado
  - Límite y gastado
- Si un presupuesto excederá el límite, aparece una alerta de proyección
- El botón "Ver todos" lleva a la página de presupuestos

### 6. Ver Movimientos desde Presupuesto

**Pasos:**
1. En la lista de presupuestos, haz clic en "Ver movimientos"
2. O desde el detalle, haz clic en "Ver movimientos"

**✅ Verificar:**
- Se abre la página de movimientos
- Los movimientos están filtrados por la categoría del presupuesto
- Solo se muestran movimientos del mes actual

---

## 🔔 HU-08: Alertas de Presupuesto

### 1. Generar Alerta al 80%

**Pasos:**
1. Crea un presupuesto con límite de $400,000 y umbral de alerta en 80%
2. Crea transacciones de gasto hasta alcanzar $320,000 (80% del límite)
3. Espera unos segundos o recarga la página

**✅ Verificar:**
- Aparece un badge rojo en el ícono de campana en el header
- El número indica cuántas alertas no leídas hay
- Al hacer clic en la campana, se abre el centro de notificaciones
- Aparece una alerta de tipo "warning" (amarillo)
- El mensaje indica: "Categoría: Has alcanzado el 80% del presupuesto"

### 2. Generar Alerta al 100%

**Pasos:**
1. Continúa creando transacciones hasta superar el 100% del presupuesto
2. Espera unos segundos o recarga la página

**✅ Verificar:**
- Aparece una nueva alerta de tipo "exceeded" (rojo)
- El mensaje indica: "Categoría: Has superado el 100% del presupuesto"
- El badge muestra el número actualizado de alertas no leídas

### 3. Centro de Notificaciones

**Pasos:**
1. Haz clic en el ícono de campana en el header
2. Revisa las alertas mostradas

**✅ Verificar:**
- Se muestran las alertas no leídas primero (con fondo amarillo)
- Se muestran las alertas leídas después (con fondo gris y opacidad)
- Cada alerta muestra:
  - Icono según el tipo (⚠️ para warning, ⭕ para exceeded)
  - Mensaje descriptivo
  - Fecha y hora de creación
  - Botones de acción

### 4. Marcar Alerta como Leída

**Pasos:**
1. En el centro de notificaciones, haz clic en "Marcar como leída" en una alerta
2. Observa el cambio

**✅ Verificar:**
- La alerta se mueve a la sección "Leídas"
- El badge del contador disminuye
- La alerta cambia de color (fondo gris, opacidad reducida)

### 5. Marcar Todas como Leídas

**Pasos:**
1. Con varias alertas no leídas, haz clic en el ícono de "check doble" en el header del centro
2. Observa el cambio

**✅ Verificar:**
- Todas las alertas se marcan como leídas
- El badge desaparece (contador en 0)
- Todas las alertas se mueven a la sección "Leídas"

### 6. Ver Presupuesto desde Alerta

**Pasos:**
1. En una alerta, haz clic en "Ver presupuesto"
2. Observa la navegación

**✅ Verificar:**
- Se cierra el centro de notificaciones
- Se navega a la página de presupuestos
- (Opcional) Se podría abrir el detalle del presupuesto específico

### 7. Eliminar Alerta

**Pasos:**
1. En una alerta, haz clic en "Eliminar"
2. Confirma la acción si es necesario

**✅ Verificar:**
- La alerta desaparece de la lista
- El contador se actualiza
- La alerta no vuelve a aparecer

### 8. Verificar Unicidad de Alertas

**Pasos:**
1. Alcanza el 80% del presupuesto (genera una alerta)
2. Crea más transacciones que sigan en el 80-99%
3. Verifica que no se generen alertas duplicadas

**✅ Verificar:**
- Solo hay una alerta de "warning" para ese presupuesto en el mes
- No se generan alertas duplicadas al mismo nivel (80% o 100%)

### 9. Probar con Múltiples Presupuestos

**Pasos:**
1. Crea varios presupuestos para diferentes categorías
2. Alcanza el 80% o 100% en varios de ellos
3. Revisa el centro de notificaciones

**✅ Verificar:**
- Se muestran alertas de todos los presupuestos
- Cada alerta muestra correctamente la categoría correspondiente
- El contador refleja el total de alertas no leídas

### 10. Probar Errores y Validaciones

**Pasos:**
1. Intenta crear un presupuesto sin categoría → Debe mostrar error
2. Intenta crear un presupuesto con monto 0 → Debe mostrar error
3. Intenta crear un presupuesto con umbral > 100 → Debe mostrar error
4. Intenta crear un presupuesto duplicado → Debe mostrar error específico

**✅ Verificar:**
- Los errores se muestran claramente en el modal
- Los mensajes son descriptivos y específicos
- El formulario no se envía si hay errores de validación

### 11. Probar Errores de Conexión

**Pasos:**
1. Detén el backend
2. Intenta crear o editar un presupuesto
3. Intenta cargar las alertas

**✅ Verificar:**
- Se muestra un mensaje: "No se pudo conectar con el servidor. Verifica tu conexión a internet"
- El mensaje es claro y no técnico
- La aplicación no se rompe

---

## 🔍 Checklist de Verificación

### Funcionalidades Básicas
- [ ] Crear presupuesto funciona
- [ ] Editar presupuesto funciona
- [ ] Eliminar presupuesto funciona
- [ ] Ver detalle de presupuesto funciona
- [ ] Modo base/total se guarda y aplica correctamente

### Cálculos y Visualización
- [ ] Las barras de progreso se actualizan correctamente
- [ ] El porcentaje gastado es correcto
- [ ] El monto restante se calcula bien
- [ ] Las proyecciones se muestran en el detalle
- [ ] El resumen en el Dashboard se muestra correctamente

### Alertas
- [ ] Las alertas se generan al 80%
- [ ] Las alertas se generan al 100%
- [ ] El badge muestra el contador correcto
- [ ] El centro de notificaciones se abre y cierra
- [ ] Marcar como leída funciona
- [ ] Marcar todas como leídas funciona
- [ ] Eliminar alerta funciona
- [ ] Ver presupuesto desde alerta funciona
- [ ] No se generan alertas duplicadas

### Manejo de Errores
- [ ] Los errores de validación se muestran claramente
- [ ] Los errores de conexión se manejan bien
- [ ] Los errores 404 muestran mensajes específicos
- [ ] Los errores 401 redirigen al login

### UX/UI
- [ ] Los mensajes son claros y en español
- [ ] Los estados de carga se muestran
- [ ] Las animaciones son suaves
- [ ] El diseño es consistente

---

## 🐛 Problemas Comunes y Soluciones

### Las alertas no aparecen
- **Causa**: El backend no está generando las alertas automáticamente
- **Solución**: Verifica que el backend esté procesando las transacciones y generando alertas

### El badge no se actualiza
- **Causa**: El contexto no se está refrescando
- **Solución**: Recarga la página o cierra y abre el centro de notificaciones

### Los cálculos no coinciden
- **Causa**: Puede haber un problema con el modo de cálculo (base vs total)
- **Solución**: Verifica que las transacciones tengan los campos correctos (base_amount o total_amount)

### Errores de conexión constantes
- **Causa**: El backend no está corriendo o hay problemas de red
- **Solución**: Verifica que el backend esté en `http://localhost:8000` y que esté funcionando

---

## 📝 Notas Adicionales

- Las alertas se generan automáticamente en el backend cuando se crea una transacción
- Solo se genera una alerta por presupuesto/tipo/mes
- Las proyecciones se calculan en tiempo real basándose en el promedio diario
- El resumen del Dashboard muestra hasta 6 presupuestos, con enlace para ver todos

---

**¡Happy Testing! 🎉**

