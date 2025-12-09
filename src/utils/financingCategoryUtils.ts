import { categoryService, Category } from '../services/categoryService';

/**
 * Verifica si existe una categoría de "Financiamiento" tipo "expense"
 * Si no existe, la crea automáticamente
 */
export async function ensureFinancingCategory(): Promise<Category> {
  try {
    // Buscar todas las categorías de gasto activas
    const categories = await categoryService.list({ type: 'expense', active_only: false });
    
    // Buscar categoría "Financiamiento" (case insensitive)
    const financingCategory = categories.find(
      cat => cat.name.toLowerCase() === 'financiamiento'
    );
    
    if (financingCategory) {
      // Si existe pero está inactiva, activarla
      if (!financingCategory.is_active) {
        return await categoryService.toggleActive(financingCategory.id);
      }
      return financingCategory;
    }
    
    // Si no existe, crearla
    const newCategory = await categoryService.create({
      name: 'Financiamiento',
      type: 'expense',
      color: '#ef4444', // Rojo para indicar gastos financieros
      icon: 'fa-percent',
      is_active: true,
    });
    
    return newCategory;
  } catch (error) {
    throw new Error(
      `Error al verificar/crear categoría de Financiamiento: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
}

/**
 * Obtiene la categoría de Financiamiento si existe
 * Retorna null si no existe
 */
export async function getFinancingCategory(): Promise<Category | null> {
  try {
    const categories = await categoryService.list({ type: 'expense', active_only: false });
    const financingCategory = categories.find(
      cat => cat.name.toLowerCase() === 'financiamiento'
    );
    return financingCategory || null;
  } catch {
    return null;
  }
}

