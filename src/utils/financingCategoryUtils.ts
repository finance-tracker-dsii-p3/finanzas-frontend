import { categoryService, Category } from '../services/categoryService';


export async function ensureFinancingCategory(): Promise<Category> {
  try {

    const categories = await categoryService.list({ type: 'expense', active_only: false });

    const financingCategory = categories.find(
      cat => cat.name.toLowerCase() === 'financiamiento'
    );
    
    if (financingCategory) {

      if (!financingCategory.is_active) {
        return await categoryService.toggleActive(financingCategory.id);
      }
      return financingCategory;
    }

    const newCategory = await categoryService.create({
      name: 'Financiamiento',
      type: 'expense',
      color: '#ef4444',
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

