import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { CategoryProvider } from '../../context/CategoryContext';
import { BudgetProvider } from '../../context/BudgetContext';
import { AlertProvider } from '../../context/AlertContext';
import { NotificationProvider } from '../../context/NotificationContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CategoryProvider>
          <BudgetProvider>
            <AlertProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AlertProvider>
          </BudgetProvider>
        </CategoryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
  ) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

