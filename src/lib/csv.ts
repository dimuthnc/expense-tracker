import type { DataModel } from '@/state/types';

function parseValidated(raw: string | undefined): boolean {
  if (raw == null) return false;
  const v = raw.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

export function csvEscape(val: unknown): string {
  if (val == null) return '';
  const s = String(val).replace(/"/g, '""');
  if (/[",\n]/.test(s)) return '"' + s + '"';
  return s;
}

export function splitCsv(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === ',') {
      result.push(cur);
      cur = '';
    } else if (ch === '"') {
      inQuotes = true;
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

export function buildCsv(data: DataModel): string {
  const lines: string[] = [];
  lines.push('# Cycle');
  lines.push('cycleStart,cycleEnd,expectedIncome,expectedSavings');
  lines.push(
    `${data.cycleStart || ''},${data.cycleEnd || ''},${
      data.expectedIncome != null ? data.expectedIncome : ''
    },${data.expectedSavings != null ? data.expectedSavings : ''}`,
  );
  lines.push('');
  lines.push('# Categories');
  lines.push('category');
  (data.categories || []).forEach((cat) => lines.push(csvEscape(cat)));
  lines.push('');
  lines.push('# CardPaymentMethods');
  lines.push('card');
  (data.cardPaymentMethods || []).forEach((card) => lines.push(csvEscape(card)));
  lines.push('');
  lines.push('# CashPaymentMethods');
  lines.push('method');
  (data.cashPaymentMethods || []).forEach((method) => lines.push(csvEscape(method)));
  lines.push('');
  lines.push('# Expenses');
  lines.push('description,amount,category,payment,validated');
  data.expenses.forEach((e) =>
    lines.push(
      `${csvEscape(e.description)},${e.amount},${csvEscape(e.category)},${csvEscape(e.payment)},${e.validated ? 'true' : 'false'}`,
    ),
  );
  lines.push('');
  lines.push('# Installments');
  lines.push('description,amount,remainingMonths,card,validated');
  data.installments.forEach((i) =>
    lines.push(
      `${csvEscape(i.description)},${i.amount},${i.remainingMonths},${csvEscape(i.card)},${i.validated ? 'true' : 'false'}`,
    ),
  );
  lines.push('');
  lines.push('# FixedCosts');
  lines.push('description,amount,validated');
  data.fixedCosts.forEach((f) =>
    lines.push(`${csvEscape(f.description)},${f.amount},${f.validated ? 'true' : 'false'}`),
  );
  lines.push('');
  lines.push('# CashExpenses');
  lines.push('description,amount,paymentMethod,category');
  data.cashExpenses.forEach((c) =>
    lines.push(
      `${csvEscape(c.description)},${c.amount},${csvEscape(c.paymentMethod)},${csvEscape(c.category)}`,
    ),
  );
  return lines.join('\n');
}

export function parseCsv(text: string): DataModel {
  const lines = text.split(/\r?\n/);
  let mode = '';
  let headerConsumed = false;
  const data: DataModel = {
    cycleStart: '',
    cycleEnd: '',
    expectedIncome: 0,
    expectedSavings: 0,
    categories: [],
    cardPaymentMethods: [],
    cashPaymentMethods: [],
    expenses: [],
    installments: [],
    fixedCosts: [],
    cashExpenses: [],
  };
  lines.forEach((raw) => {
    const line = raw.trim();
    if (line.startsWith('#')) {
      mode = line.replace(/^#\s*/, '').trim();
      headerConsumed = false;
      return;
    }
    if (!line) return;
    if (!headerConsumed) {
      headerConsumed = true;
      return;
    }
    const cols = splitCsv(line);
    switch (mode) {
      case 'Cycle':
        if (cols.length >= 2 && !data.cycleStart) {
          data.cycleStart = cols[0];
          data.cycleEnd = cols[1];
          if (cols.length >= 3) data.expectedIncome = parseFloat(cols[2]) || 0;
          if (cols.length >= 4) data.expectedSavings = parseFloat(cols[3]) || 0;
        }
        break;
      case 'Categories':
        if (cols.length >= 1 && cols[0] !== '') data.categories.push(cols[0]);
        break;
      case 'CardPaymentMethods':
        if (cols.length >= 1 && cols[0] !== '') data.cardPaymentMethods.push(cols[0]);
        break;
      case 'CashPaymentMethods':
        if (cols.length >= 1 && cols[0] !== '') data.cashPaymentMethods.push(cols[0]);
        break;
      case 'Expenses':
        if (cols.length >= 4)
          data.expenses.push({
            description: cols[0],
            amount: parseFloat(cols[1]) || 0,
            category: cols[2],
            payment: cols[3],
            validated: parseValidated(cols[4]),
          });
        break;
      case 'Installments':
        if (cols.length >= 4)
          data.installments.push({
            description: cols[0],
            amount: parseFloat(cols[1]) || 0,
            remainingMonths: parseInt(cols[2]) || 0,
            card: cols[3],
            validated: parseValidated(cols[4]),
          });
        break;
      case 'FixedCosts':
        if (cols.length >= 2)
          data.fixedCosts.push({
            description: cols[0],
            amount: parseFloat(cols[1]) || 0,
            validated: parseValidated(cols[2]),
          });
        break;
      case 'CashExpenses':
        if (cols.length >= 4)
          data.cashExpenses.push({
            description: cols[0],
            amount: parseFloat(cols[1]) || 0,
            paymentMethod: cols[2],
            category: cols[3],
          });
        break;
    }
  });
  return data;
}
