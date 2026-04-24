import { computeCycleContaining, formatYMD, shiftCycle } from '@/lib/cycle';
import type {
  AppState,
  CashExpense,
  ConfigList,
  DataModel,
  Expense,
  FixedCost,
  Installment,
  RowTable,
} from './types';

export const DEFAULT_CATEGORIES = [
  'Grocery',
  'Outside Food',
  'Transport',
  'Health',
  'Household',
  'Entertainment',
  'Other',
];
export const DEFAULT_CARD_PAYMENTS = ['HSBC', 'CITI', 'SC', 'Trust', 'DBS'];
export const DEFAULT_CASH_PAYMENTS = ['Cash', 'Paylah', 'Bank Transfer'];

function blankExpense(id: number, categories: string[], cards: string[]): Expense {
  return {
    id,
    description: '',
    amount: 0,
    category: categories[0] ?? '',
    payment: cards[0] ?? '',
    validated: false,
  };
}
function blankInstallment(id: number, cards: string[]): Installment {
  return {
    id,
    description: '',
    amount: 0,
    remainingMonths: 0,
    card: cards[0] ?? '',
    validated: false,
  };
}
function blankFixedCost(id: number): FixedCost {
  return { id, description: '', amount: 0, validated: false };
}
function blankCashExpense(id: number, cashMethods: string[], categories: string[]): CashExpense {
  return {
    id,
    description: '',
    amount: 0,
    paymentMethod: cashMethods[0] ?? '',
    category: categories[0] ?? '',
  };
}

export function createInitialState(): AppState {
  const today = new Date();
  const { start, end } = computeCycleContaining(today);
  const categories = [...DEFAULT_CATEGORIES];
  const cards = [...DEFAULT_CARD_PAYMENTS];
  const cash = [...DEFAULT_CASH_PAYMENTS];
  return {
    cycleStart: formatYMD(start),
    cycleEnd: formatYMD(end),
    expectedIncome: '',
    expectedSavings: '',
    categories,
    cardPaymentMethods: cards,
    cashPaymentMethods: cash,
    expenses: [blankExpense(1, categories, cards)],
    installments: [blankInstallment(1, cards)],
    fixedCosts: [blankFixedCost(1)],
    cashExpenses: [blankCashExpense(1, cash, categories)],
    nextIds: { expense: 2, installment: 2, fixed: 2, cash: 2 },
  };
}

export type Action =
  | { type: 'ADD_ROW'; table: RowTable }
  | { type: 'DELETE_ROW'; table: RowTable; id: number }
  | { type: 'UPDATE_EXPENSE'; id: number; patch: Partial<Omit<Expense, 'id'>> }
  | { type: 'UPDATE_INSTALLMENT'; id: number; patch: Partial<Omit<Installment, 'id'>> }
  | { type: 'UPDATE_FIXED'; id: number; patch: Partial<Omit<FixedCost, 'id'>> }
  | { type: 'UPDATE_CASH'; id: number; patch: Partial<Omit<CashExpense, 'id'>> }
  | { type: 'ADD_CONFIG'; list: ConfigList; value: string }
  | { type: 'REMOVE_CONFIG'; list: ConfigList; value: string }
  | { type: 'SET_CYCLE'; start: string; end: string }
  | { type: 'SHIFT_CYCLE'; delta: number }
  | { type: 'SET_INCOME'; value: string }
  | { type: 'SET_SAVINGS'; value: string }
  | { type: 'LOAD'; data: DataModel };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_ROW': {
      switch (action.table) {
        case 'expenses': {
          const id = state.nextIds.expense;
          return {
            ...state,
            expenses: [
              ...state.expenses,
              blankExpense(id, state.categories, state.cardPaymentMethods),
            ],
            nextIds: { ...state.nextIds, expense: id + 1 },
          };
        }
        case 'installments': {
          const id = state.nextIds.installment;
          return {
            ...state,
            installments: [...state.installments, blankInstallment(id, state.cardPaymentMethods)],
            nextIds: { ...state.nextIds, installment: id + 1 },
          };
        }
        case 'fixedCosts': {
          const id = state.nextIds.fixed;
          return {
            ...state,
            fixedCosts: [...state.fixedCosts, blankFixedCost(id)],
            nextIds: { ...state.nextIds, fixed: id + 1 },
          };
        }
        case 'cashExpenses': {
          const id = state.nextIds.cash;
          return {
            ...state,
            cashExpenses: [
              ...state.cashExpenses,
              blankCashExpense(id, state.cashPaymentMethods, state.categories),
            ],
            nextIds: { ...state.nextIds, cash: id + 1 },
          };
        }
      }
      return state;
    }

    case 'DELETE_ROW': {
      const t = action.table;
      return {
        ...state,
        [t]: (state[t] as { id: number }[]).filter((row) => row.id !== action.id),
      } as AppState;
    }

    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e,
        ),
      };
    case 'UPDATE_INSTALLMENT':
      return {
        ...state,
        installments: state.installments.map((i) =>
          i.id === action.id ? { ...i, ...action.patch } : i,
        ),
      };
    case 'UPDATE_FIXED':
      return {
        ...state,
        fixedCosts: state.fixedCosts.map((f) =>
          f.id === action.id ? { ...f, ...action.patch } : f,
        ),
      };
    case 'UPDATE_CASH':
      return {
        ...state,
        cashExpenses: state.cashExpenses.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };

    case 'ADD_CONFIG': {
      const v = action.value.trim();
      if (!v) return state;
      const list = state[action.list];
      if (list.includes(v)) return state;
      return { ...state, [action.list]: [...list, v] };
    }
    case 'REMOVE_CONFIG': {
      const list = state[action.list];
      return { ...state, [action.list]: list.filter((x) => x !== action.value) };
    }

    case 'SET_CYCLE':
      return { ...state, cycleStart: action.start, cycleEnd: action.end };

    case 'SHIFT_CYCLE': {
      const shifted = shiftCycle(state.cycleStart, state.cycleEnd, action.delta);
      if (!shifted) return state;
      return { ...state, cycleStart: shifted.start, cycleEnd: shifted.end };
    }

    case 'SET_INCOME':
      return { ...state, expectedIncome: action.value };
    case 'SET_SAVINGS':
      return { ...state, expectedSavings: action.value };

    case 'LOAD': {
      const d = action.data;
      const categories = d.categories?.length ? [...d.categories] : state.categories;
      const cardPaymentMethods = d.cardPaymentMethods?.length
        ? [...d.cardPaymentMethods]
        : state.cardPaymentMethods;
      const cashPaymentMethods = d.cashPaymentMethods?.length
        ? [...d.cashPaymentMethods]
        : state.cashPaymentMethods;

      let nextExpense = 1;
      let nextInstallment = 1;
      let nextFixed = 1;
      let nextCash = 1;

      const expenses: Expense[] = (d.expenses || []).map((e) => ({
        id: nextExpense++,
        description: e.description,
        amount: e.amount || 0,
        category: e.category || categories[0] || '',
        payment: e.payment || cardPaymentMethods[0] || '',
        validated: Boolean(e.validated),
      }));
      const installments: Installment[] = (d.installments || []).map((i) => ({
        id: nextInstallment++,
        description: i.description,
        amount: i.amount || 0,
        remainingMonths: i.remainingMonths || 0,
        card: i.card || cardPaymentMethods[0] || '',
        validated: Boolean(i.validated),
      }));
      const fixedCosts: FixedCost[] = (d.fixedCosts || []).map((f) => ({
        id: nextFixed++,
        description: f.description,
        amount: f.amount || 0,
        validated: Boolean(f.validated),
      }));
      const cashExpenses: CashExpense[] = (d.cashExpenses || []).map((c) => ({
        id: nextCash++,
        description: c.description,
        amount: c.amount || 0,
        paymentMethod: c.paymentMethod || cashPaymentMethods[0] || '',
        category: c.category || categories[0] || '',
      }));

      if (expenses.length === 0) expenses.push(blankExpense(nextExpense++, categories, cardPaymentMethods));
      if (installments.length === 0) installments.push(blankInstallment(nextInstallment++, cardPaymentMethods));
      if (fixedCosts.length === 0) fixedCosts.push(blankFixedCost(nextFixed++));
      if (cashExpenses.length === 0)
        cashExpenses.push(blankCashExpense(nextCash++, cashPaymentMethods, categories));

      return {
        cycleStart: d.cycleStart || state.cycleStart,
        cycleEnd: d.cycleEnd || state.cycleEnd,
        expectedIncome:
          d.expectedIncome != null && d.expectedIncome !== 0 ? String(d.expectedIncome) : '',
        expectedSavings:
          d.expectedSavings != null && d.expectedSavings !== 0 ? String(d.expectedSavings) : '',
        categories,
        cardPaymentMethods,
        cashPaymentMethods,
        expenses,
        installments,
        fixedCosts,
        cashExpenses,
        nextIds: {
          expense: nextExpense,
          installment: nextInstallment,
          fixed: nextFixed,
          cash: nextCash,
        },
      };
    }
  }
}
