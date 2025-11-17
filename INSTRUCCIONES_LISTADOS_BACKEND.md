# Instrucciones para mover listados al backend

## ⚠️ Recomendación: Usar Tablas en Base de Datos

**Se recomienda usar la Opción 2 (Modelo en BD)** porque:
- ✅ Permite agregar nuevos bancos/billeteras sin cambiar código
- ✅ Permite eliminar o desactivar opciones desde el admin
- ✅ Permite ordenar las opciones
- ✅ Más flexible y mantenible a largo plazo
- ✅ Los administradores pueden gestionar los listados sin tocar código

---

## Listados actuales en el frontend

### 1. Listado de Bancos (para cuentas bancarias)

```python
BANKS = [
    'Bancolombia',
    'Banco de Bogotá',
    'Davivienda',
    'Banco Popular',
    'Banco AV Villas',
    'Banco Agrario',
    'Banco Caja Social',
    'Banco Falabella',
    'Banco Pichincha',
    'BBVA Colombia',
    'Citibank',
    'Scotiabank Colpatria',
    'Otro'
]
```

### 2. Listado de Billeteras Digitales

```python
WALLETS = [
    'Nequi',
    'Daviplata',
    'RappiPay',
    'Ualá',
    'Lulo Bank',
    'Nu Colombia',
    'Otro'
]
```

### 3. Listado de Bancos para Tarjetas de Crédito

```python
CREDIT_CARD_BANKS = [
    'Bancolombia',
    'Banco de Bogotá',
    'Davivienda',
    'Banco Popular',
    'Falabella',
    'Éxito',
    'Alkosto',
    'Otro'
]
```

---

## Implementación en el backend

### ⭐ Opción 2: Modelo en Base de Datos (RECOMENDADO)

**Ventajas:**
- Permite agregar/eliminar bancos y billeteras desde el admin de Django
- No requiere cambios de código para actualizar listados
- Permite ordenar las opciones
- Permite activar/desactivar opciones sin eliminarlas
- Más escalable y mantenible

---

### Opción 1: Endpoint simple (Solo si necesitas algo rápido)

#### 1. Crear endpoint en `accounts/views.py` o `accounts/api/views.py`

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_account_options(request):
    """
    Retorna los listados de opciones para crear cuentas.
    """
    return Response({
        'banks': [
            'Bancolombia',
            'Banco de Bogotá',
            'Davivienda',
            'Banco Popular',
            'Banco AV Villas',
            'Banco Agrario',
            'Banco Caja Social',
            'Banco Falabella',
            'Banco Pichincha',
            'BBVA Colombia',
            'Citibank',
            'Scotiabank Colpatria',
            'Otro'
        ],
        'wallets': [
            'Nequi',
            'Daviplata',
            'RappiPay',
            'Ualá',
            'Lulo Bank',
            'Nu Colombia',
            'Otro'
        ],
        'credit_card_banks': [
            'Bancolombia',
            'Banco de Bogotá',
            'Davivienda',
            'Banco Popular',
            'Falabella',
            'Éxito',
            'Alkosto',
            'Otro'
        ]
    })
```

#### 2. Agregar la ruta en `accounts/urls.py`

```python
from django.urls import path
from .views import get_account_options

urlpatterns = [
    # ... rutas existentes ...
    path('options/', get_account_options, name='account-options'),
]
```

#### 3. Respuesta esperada del endpoint

```json
GET /api/accounts/options/

{
  "banks": [
    "Bancolombia",
    "Banco de Bogotá",
    "Davivienda",
    "Banco Popular",
    "Banco AV Villas",
    "Banco Agrario",
    "Banco Caja Social",
    "Banco Falabella",
    "Banco Pichincha",
    "BBVA Colombia",
    "Citibank",
    "Scotiabank Colpatria",
    "Otro"
  ],
  "wallets": [
    "Nequi",
    "Daviplata",
    "RappiPay",
    "Ualá",
    "Lulo Bank",
    "Nu Colombia",
    "Otro"
  ],
  "credit_card_banks": [
    "Bancolombia",
    "Banco de Bogotá",
    "Davivienda",
    "Banco Popular",
    "Falabella",
    "Éxito",
    "Alkosto",
    "Otro"
  ]
}
```

---

### ⭐ Opción 2: Modelo en Base de Datos (RECOMENDADO - Implementar esta)

Si quieres que los listados sean administrables desde el admin de Django:

#### 1. Crear modelo `AccountOption` en `accounts/models.py`

```python
class AccountOptionType(models.TextChoices):
    BANK = 'bank', 'Banco'
    WALLET = 'wallet', 'Billetera'
    CREDIT_CARD_BANK = 'credit_card_bank', 'Banco para Tarjeta de Crédito'

class AccountOption(models.Model):
    """
    Modelo para almacenar las opciones de bancos, billeteras y bancos para tarjetas.
    Permite administrar estos listados desde el admin de Django.
    """
    name = models.CharField(
        max_length=100,
        verbose_name='Nombre',
        help_text='Nombre del banco, billetera o entidad'
    )
    option_type = models.CharField(
        max_length=20,
        choices=AccountOptionType.choices,
        verbose_name='Tipo de opción',
        help_text='Tipo de opción: banco, billetera o banco para tarjeta'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo',
        help_text='Si está desactivado, no aparecerá en los listados del frontend'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Orden',
        help_text='Orden de aparición (menor número aparece primero)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['option_type', 'order', 'name']
        unique_together = ['name', 'option_type']
        verbose_name = 'Opción de Cuenta'
        verbose_name_plural = 'Opciones de Cuentas'

    def __str__(self):
        return f"{self.get_option_type_display()}: {self.name}"
```

#### 2. Crear serializer en `accounts/serializers.py`

```python
class AccountOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountOption
        fields = ['name', 'option_type', 'is_active', 'order']
```

#### 3. Crear viewset o vista en `accounts/views.py`

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import AccountOption, AccountOptionType

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_account_options(request):
    """
    Retorna los listados de opciones para crear cuentas.
    """
    banks = AccountOption.objects.filter(
        option_type=AccountOptionType.BANK,
        is_active=True
    ).values_list('name', flat=True).order_by('order', 'name')
    
    wallets = AccountOption.objects.filter(
        option_type=AccountOptionType.WALLET,
        is_active=True
    ).values_list('name', flat=True).order_by('order', 'name')
    
    credit_card_banks = AccountOption.objects.filter(
        option_type=AccountOptionType.CREDIT_CARD_BANK,
        is_active=True
    ).values_list('name', flat=True).order_by('order', 'name')
    
    return Response({
        'banks': list(banks),
        'wallets': list(wallets),
        'credit_card_banks': list(credit_card_banks)
    })
```

#### 4. Agregar al admin en `accounts/admin.py`

```python
from django.contrib import admin
from .models import AccountOption

@admin.register(AccountOption)
class AccountOptionAdmin(admin.ModelAdmin):
    list_display = ['name', 'option_type', 'is_active', 'order', 'created_at']
    list_filter = ['option_type', 'is_active']
    search_fields = ['name']
    ordering = ['option_type', 'order', 'name']
    list_editable = ['is_active', 'order']  # Permite editar directamente desde la lista
    fieldsets = (
        ('Información básica', {
            'fields': ('name', 'option_type')
        }),
        ('Configuración', {
            'fields': ('is_active', 'order')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()
```

#### 5. Crear migración y poblar datos iniciales

**Opción A: Migración de datos (Recomendado)**

Crear archivo `accounts/migrations/0004_populate_account_options.py`:

```python
from django.db import migrations
from accounts.models import AccountOptionType

def populate_account_options(apps, schema_editor):
    AccountOption = apps.get_model('accounts', 'AccountOption')
    
    # Poblar bancos
    banks = [
        'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'Banco Popular',
        'Banco AV Villas', 'Banco Agrario', 'Banco Caja Social',
        'Banco Falabella', 'Banco Pichincha', 'BBVA Colombia',
        'Citibank', 'Scotiabank Colpatria', 'Otro'
    ]
    for i, bank in enumerate(banks):
        AccountOption.objects.get_or_create(
            name=bank,
            option_type=AccountOptionType.BANK,
            defaults={'order': i, 'is_active': True}
        )

    # Poblar billeteras
    wallets = [
        'Nequi', 'Daviplata', 'RappiPay', 'Ualá',
        'Lulo Bank', 'Nu Colombia', 'Otro'
    ]
    for i, wallet in enumerate(wallets):
        AccountOption.objects.get_or_create(
            name=wallet,
            option_type=AccountOptionType.WALLET,
            defaults={'order': i, 'is_active': True}
        )

    # Poblar bancos para tarjetas
    credit_card_banks = [
        'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'Banco Popular',
        'Falabella', 'Éxito', 'Alkosto', 'Otro'
    ]
    for i, bank in enumerate(credit_card_banks):
        AccountOption.objects.get_or_create(
            name=bank,
            option_type=AccountOptionType.CREDIT_CARD_BANK,
            defaults={'order': i, 'is_active': True}
        )

def reverse_populate(apps, schema_editor):
    AccountOption = apps.get_model('accounts', 'AccountOption')
    AccountOption.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0003_account_account_number_account_bank_name'),  # Ajustar según tu última migración
    ]

    operations = [
        migrations.RunPython(populate_account_options, reverse_populate),
    ]
```

**Opción B: Script de management command**

Crear `accounts/management/commands/populate_account_options.py`:

```python
from django.core.management.base import BaseCommand
from accounts.models import AccountOption, AccountOptionType

class Command(BaseCommand):
    help = 'Pobla las opciones de bancos, billeteras y tarjetas'

    def handle(self, *args, **options):
        # Poblar bancos
        banks = [
            'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'Banco Popular',
            'Banco AV Villas', 'Banco Agrario', 'Banco Caja Social',
            'Banco Falabella', 'Banco Pichincha', 'BBVA Colombia',
            'Citibank', 'Scotiabank Colpatria', 'Otro'
        ]
        for i, bank in enumerate(banks):
            AccountOption.objects.get_or_create(
                name=bank,
                option_type=AccountOptionType.BANK,
                defaults={'order': i, 'is_active': True}
            )
            self.stdout.write(self.style.SUCCESS(f'✓ Banco: {bank}'))

        # Poblar billeteras
        wallets = [
            'Nequi', 'Daviplata', 'RappiPay', 'Ualá',
            'Lulo Bank', 'Nu Colombia', 'Otro'
        ]
        for i, wallet in enumerate(wallets):
            AccountOption.objects.get_or_create(
                name=wallet,
                option_type=AccountOptionType.WALLET,
                defaults={'order': i, 'is_active': True}
            )
            self.stdout.write(self.style.SUCCESS(f'✓ Billetera: {wallet}'))

        # Poblar bancos para tarjetas
        credit_card_banks = [
            'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'Banco Popular',
            'Falabella', 'Éxito', 'Alkosto', 'Otro'
        ]
        for i, bank in enumerate(credit_card_banks):
            AccountOption.objects.get_or_create(
                name=bank,
                option_type=AccountOptionType.CREDIT_CARD_BANK,
                defaults={'order': i, 'is_active': True}
            )
            self.stdout.write(self.style.SUCCESS(f'✓ Banco tarjeta: {bank}'))

        self.stdout.write(self.style.SUCCESS('\n✓ Todas las opciones han sido creadas'))
```

Ejecutar: `python manage.py populate_account_options`

---

## Recomendación Final

### ⭐ Usar Opción 2 (Modelo en BD) - RECOMENDADO

**Razones:**
- ✅ Permite agregar nuevos bancos/billeteras sin cambiar código
- ✅ Permite eliminar opciones desde el admin
- ✅ Permite desactivar opciones sin eliminarlas (historial)
- ✅ Permite ordenar las opciones personalizadamente
- ✅ Los administradores pueden gestionar todo desde el admin
- ✅ Más escalable y mantenible a largo plazo
- ✅ Facilita agregar nuevos tipos de opciones en el futuro

**Usar Opción 1 (endpoint simple)** solo si:
- Es un proyecto pequeño y los listados nunca cambiarán
- Necesitas algo rápido temporalmente (luego migrar a Opción 2)

---

## Endpoint requerido

**URL:** `GET /api/accounts/options/`

**Autenticación:** Requerida (Token)

**Respuesta:**
```json
{
  "banks": ["...", "..."],
  "wallets": ["...", "..."],
  "credit_card_banks": ["...", "..."]
}
```

---

## Pasos para implementar (Resumen)

### 1. Crear el modelo `AccountOption`
   - Agregar en `accounts/models.py`
   - Crear migración: `python manage.py makemigrations accounts`

### 2. Registrar en el admin
   - Agregar `AccountOptionAdmin` en `accounts/admin.py`

### 3. Crear la vista/endpoint
   - Agregar función `get_account_options` en `accounts/views.py` o `accounts/api/views.py`
   - Agregar ruta en `accounts/urls.py`: `path('options/', get_account_options, name='account-options')`

### 4. Poblar datos iniciales
   - Crear migración de datos o management command
   - Ejecutar: `python manage.py migrate` (si es migración) o `python manage.py populate_account_options` (si es command)

### 5. Probar el endpoint
   - Verificar que `GET /api/accounts/options/` retorne los datos correctamente

---

## Ventajas de usar tablas

✅ **Agregar nuevo banco/billetera:**
   - Ir al admin de Django → Account Options → Agregar
   - No requiere cambios de código

✅ **Eliminar opción:**
   - Ir al admin → Desactivar o eliminar
   - Si desactivas, no aparece pero se mantiene el historial

✅ **Ordenar opciones:**
   - Cambiar el campo `order` en el admin
   - Las opciones se mostrarán en ese orden

✅ **Mantenimiento:**
   - Todo desde el admin, sin tocar código
   - Los cambios se reflejan inmediatamente en el frontend

---

**Nota:** El frontend ya está preparado para cargar estos listados dinámicamente desde el endpoint `/api/accounts/options/`. Una vez implementado el backend, funcionará automáticamente.

