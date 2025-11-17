import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  categoryService,
  Category,
  CategoryFilters,
  CategoryPayload,
  CategoryType,
  CategoryUpdatePayload,
  CategoryDeletionValidation,
} from '../services/categoryService';
import { useAuth } from './AuthContext';

interface CategoryContextValue {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refreshCategories: (filters?: CategoryFilters) => Promise<void>;
  createCategory: (payload: CategoryPayload) => Promise<Category>;
  updateCategory: (id: number, payload: CategoryUpdatePayload) => Promise<Category>;
  toggleCategory: (id: number) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  deleteCategoryWithReassignment: (id: number, targetCategoryId: number) => Promise<void>;
  validateDeletion: (id: number) => Promise<CategoryDeletionValidation>;
  bulkUpdateOrder: (categoryOrders: { id: number; order: number }[]) => Promise<void>;
  createDefaultCategories: () => Promise<void>;
  getCategoriesByType: (type: CategoryType, options?: { includeInactive?: boolean }) => Category[];
  getActiveCategoriesByType: (type: CategoryType) => Category[];
}

const CategoryContext = createContext<CategoryContextValue | undefined>(undefined);

const sortCategories = (items: Category[]) =>
  [...items].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.name.localeCompare(b.name);
  });

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<CategoryFilters>({ active_only: false });

  const loadCategories = useCallback(
    async (filters?: CategoryFilters) => {
      if (!isAuthenticated) {
        setCategories([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      const appliedFilters = filters ?? activeFilters;
      setActiveFilters(appliedFilters);

      try {
        const data = await categoryService.list(appliedFilters);
        setCategories(sortCategories(data));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudieron cargar las categorías';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, activeFilters],
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadCategories();
    } else {
      setCategories([]);
    }
  }, [isAuthenticated, loadCategories]);

  const handleCreate = useCallback(
    async (payload: CategoryPayload) => {
      const newCategory = await categoryService.create(payload);
      setCategories((prev) => sortCategories([...prev, newCategory]));
      return newCategory;
    },
    [],
  );

  const handleUpdate = useCallback(async (id: number, payload: CategoryUpdatePayload) => {
    const updated = await categoryService.update(id, payload);
    setCategories((prev) =>
      sortCategories(prev.map((category) => (category.id === id ? { ...category, ...updated } : category))),
    );
    return updated;
  }, []);

  const handleToggle = useCallback(async (id: number) => {
    const toggled = await categoryService.toggleActive(id);
    setCategories((prev) =>
      sortCategories(prev.map((category) => (category.id === id ? { ...category, ...toggled } : category))),
    );
    return toggled;
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await categoryService.delete(id);
    setCategories((prev) => prev.filter((category) => category.id !== id));
  }, []);

  const handleDeleteWithReassignment = useCallback(async (id: number, targetCategoryId: number) => {
    await categoryService.deleteWithReassignment(id, targetCategoryId);
    setCategories((prev) => prev.filter((category) => category.id !== id));
  }, []);

  const handleBulkUpdateOrder = useCallback(async (categoryOrders: { id: number; order: number }[]) => {
    await categoryService.bulkUpdateOrder(categoryOrders);
    setCategories((prev) =>
      sortCategories(
        prev.map((category) => {
          const updatedOrder = categoryOrders.find((item) => item.id === category.id);
          return updatedOrder ? { ...category, order: updatedOrder.order } : category;
        }),
      ),
    );
  }, []);

  const handleCreateDefaults = useCallback(async () => {
    await categoryService.createDefaults();
    await loadCategories();
  }, [loadCategories]);

  const getCategoriesByType = useCallback(
    (type: CategoryType, options?: { includeInactive?: boolean }) =>
      categories.filter((category) => {
        if (category.type !== type) return false;
        if (options?.includeInactive) return true;
        return category.is_active;
      }),
    [categories],
  );

  const value = useMemo<CategoryContextValue>(
    () => ({
      categories,
      isLoading,
      error,
      refreshCategories: loadCategories,
      createCategory: handleCreate,
      updateCategory: handleUpdate,
      toggleCategory: handleToggle,
      deleteCategory: handleDelete,
      deleteCategoryWithReassignment: handleDeleteWithReassignment,
      validateDeletion: categoryService.validateDeletion,
      bulkUpdateOrder: handleBulkUpdateOrder,
      createDefaultCategories: handleCreateDefaults,
      getCategoriesByType,
      getActiveCategoriesByType: (type: CategoryType) => getCategoriesByType(type),
    }),
    [
      categories,
      error,
      handleBulkUpdateOrder,
      handleCreate,
      handleCreateDefaults,
      handleDelete,
      handleDeleteWithReassignment,
      handleToggle,
      handleUpdate,
      isLoading,
      loadCategories,
      getCategoriesByType,
    ],
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories debe usarse dentro de CategoryProvider');
  }
  return context;
};


