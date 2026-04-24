export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  payment: string;
  validated: boolean;
}

export interface Installment {
  id: number;
  description: string;
  amount: number;
  remainingMonths: number;
  card: string;
  validated: boolean;
}

export interface FixedCost {
  id: number;
  description: string;
  amount: number;
  validated: boolean;
}

export interface CashExpense {
  id: number;
  description: string;
  amount: number;
  paymentMethod: string;
  category: string;
}

export interface AppState {
  cycleStart: string;
  cycleEnd: string;
  expectedIncome: string;
  expectedSavings: string;
  categories: string[];
  cardPaymentMethods: string[];
  cashPaymentMethods: string[];
  expenses: Expense[];
  installments: Installment[];
  fixedCosts: FixedCost[];
  cashExpenses: CashExpense[];
  nextIds: {
    expense: number;
    installment: number;
    fixed: number;
    cash: number;
  };
}

export type ConfigList = 'categories' | 'cardPaymentMethods' | 'cashPaymentMethods';

export type RowTable = 'expenses' | 'installments' | 'fixedCosts' | 'cashExpenses';

export interface DataModel {
  cycleStart: string;
  cycleEnd: string;
  expectedIncome: number;
  expectedSavings: number;
  categories: string[];
  cardPaymentMethods: string[];
  cashPaymentMethods: string[];
  expenses: Omit<Expense, 'id'>[];
  installments: Omit<Installment, 'id'>[];
  fixedCosts: Omit<FixedCost, 'id'>[];
  cashExpenses: Omit<CashExpense, 'id'>[];
}

export type ThemeName = 'light' | 'dark';

export const THEME_NAMES: ThemeName[] = ['light', 'dark'];
