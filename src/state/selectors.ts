import { daysBetweenExclusive } from '@/lib/cycle';
import type { AppState, DataModel } from './types';

export function sumExpenses(state: AppState): number {
  return state.expenses.reduce((s, e) => s + (e.amount || 0), 0);
}

export function sumInstallmentMonthly(state: AppState): number {
  return state.installments.reduce((s, i) => s + (i.amount || 0), 0);
}

export function sumInstallmentRemaining(state: AppState): number {
  return state.installments.reduce(
    (s, i) => s + (i.amount || 0) * (i.remainingMonths || 0),
    0,
  );
}

export function sumFixedCosts(state: AppState): number {
  return state.fixedCosts.reduce((s, f) => s + (f.amount || 0), 0);
}

export function sumCashExpenses(state: AppState): number {
  return state.cashExpenses.reduce((s, c) => s + (c.amount || 0), 0);
}

export function totalsByCategory(state: AppState): Record<string, number> {
  const out: Record<string, number> = {};
  state.categories.forEach((c) => (out[c] = 0));
  state.expenses.forEach((e) => {
    const key = e.category || '';
    out[key] = (out[key] || 0) + (e.amount || 0);
  });
  return out;
}

export function totalsByPayment(state: AppState): Record<string, number> {
  const out: Record<string, number> = {};
  state.cardPaymentMethods.forEach((c) => (out[c] = 0));
  state.expenses.forEach((e) => {
    const key = e.payment || '';
    out[key] = (out[key] || 0) + (e.amount || 0);
  });
  state.installments.forEach((i) => {
    const key = i.card || '';
    out[key] = (out[key] || 0) + (i.amount || 0);
  });
  return out;
}

export interface FinancialSummary {
  cardTotal: number;
  monthlyInstallments: number;
  fixedCosts: number;
  cashExpenses: number;
  remainingBudget: number;
  remainingPerDay: number | null;
  projectedSavings: number;
  daysRemaining: number;
  daysElapsed: number;
  totalDays: number;
}

export function computeSummary(state: AppState): FinancialSummary {
  const cardTotal = sumExpenses(state);
  const monthlyInstallments = sumInstallmentMonthly(state);
  const fixed = sumFixedCosts(state);
  const cash = sumCashExpenses(state);
  const { daysElapsed, daysRemaining, totalDays } = daysBetweenExclusive(
    state.cycleStart,
    state.cycleEnd,
  );
  const expectedIncome = parseFloat(state.expectedIncome) || 0;
  const expectedSavingsManual = parseFloat(state.expectedSavings) || 0;
  const remainingBudget =
    expectedIncome - cardTotal - monthlyInstallments - fixed - expectedSavingsManual;

  let remainingPerDay: number | null = null;
  if (daysElapsed > 0 && daysRemaining > 0 && totalDays > 0) {
    remainingPerDay = remainingBudget / daysRemaining;
  }

  return {
    cardTotal,
    monthlyInstallments,
    fixedCosts: fixed,
    cashExpenses: cash,
    remainingBudget,
    remainingPerDay,
    projectedSavings: expectedSavingsManual,
    daysRemaining,
    daysElapsed,
    totalDays,
  };
}

export function toDataModel(state: AppState): DataModel {
  const expenses = state.expenses
    .filter((e) => e.description || e.amount)
    .map(({ description, amount, category, payment, validated }) => ({
      description,
      amount,
      category,
      payment,
      validated,
    }));
  const installments = state.installments
    .filter((i) => i.description || i.amount || i.remainingMonths)
    .map(({ description, amount, remainingMonths, card, validated }) => ({
      description,
      amount,
      remainingMonths,
      card,
      validated,
    }));
  const fixedCosts = state.fixedCosts
    .filter((f) => f.description || f.amount)
    .map(({ description, amount, validated }) => ({ description, amount, validated }));
  const cashExpenses = state.cashExpenses
    .filter((c) => c.description || c.amount)
    .map(({ description, amount, paymentMethod, category }) => ({
      description,
      amount,
      paymentMethod,
      category,
    }));
  return {
    cycleStart: state.cycleStart,
    cycleEnd: state.cycleEnd,
    expectedIncome: parseFloat(state.expectedIncome) || 0,
    expectedSavings: parseFloat(state.expectedSavings) || 0,
    categories: [...state.categories],
    cardPaymentMethods: [...state.cardPaymentMethods],
    cashPaymentMethods: [...state.cashPaymentMethods],
    expenses,
    installments,
    fixedCosts,
    cashExpenses,
  };
}
