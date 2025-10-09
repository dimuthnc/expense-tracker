// Expense Tracker Front-End Only
(function () {
    const CATEGORY_OPTIONS = ["Grocery", "Outside Food", "Transport", "Health", "Household", "Entertainment", "Other"];
    const PAYMENT_OPTIONS = ["HSBC", "CITI", "SC", "Trust", "DBS"];
    const CASH_PAYMENT_OPTIONS = ["Cash", "Paylah", "Bank Transfer"];

    let nextId = 1;
    let nextInstallmentId = 1;
    let nextFixedCostId = 1;
    let nextCashExpenseId = 1;

    // Existing Expenses elements
    const expenseTableBody = document.querySelector('#expenseTable tbody');
    const addRowBtn = document.getElementById('addRowBtn');
    const categorySummaryBody = document.querySelector('#categorySummary tbody');
    const paymentSummaryBody = document.querySelector('#paymentSummary tbody');
    const expenseAmountTotalEl = document.getElementById('expenseAmountTotal');

    // Installments elements
    const installmentsTable = document.getElementById('installmentsTable');
    const installmentsBody = installmentsTable ? installmentsTable.querySelector('tbody') : null;
    const addInstallmentBtn = document.getElementById('addInstallmentBtn');
    const instAmountTotalEl = document.getElementById('instAmountTotal');
    const instTotalRemainingEl = document.getElementById('instTotalRemainingTotal');

    // Fixed Costs elements
    const fixedCostsTable = document.getElementById('fixedCostsTable');
    const fixedCostsBody = fixedCostsTable ? fixedCostsTable.querySelector('tbody') : null;
    const addFixedCostBtn = document.getElementById('addFixedCostBtn');
    const fixedCostsTotalEl = document.getElementById('fixedCostsTotal');

    // Cash Expenses elements
    const cashExpensesTable = document.getElementById('cashExpensesTable');
    const cashExpensesBody = cashExpensesTable ? cashExpensesTable.querySelector('tbody') : null;
    const addCashExpenseBtn = document.getElementById('addCashExpenseBtn');
    const cashExpensesTotalEl = document.getElementById('cashExpensesTotal');

    // Summary elements
    const sumCardBillEl = document.getElementById('sumCardBill');
    const sumCardPlusInstEl = document.getElementById('sumCardPlusInst');
    const sumDaysRemainingEl = document.getElementById('sumDaysRemaining');
    const sumProjectedCycleEl = document.getElementById('sumProjectedCycle');
    const sumTotalProjectionEl = document.getElementById('sumTotalProjection');
    const sumInstallmentMonthlyEl = document.getElementById('sumInstallmentMonthly');
    const expectedIncomeInput = document.getElementById('expectedIncome');
    const sumFixedCostsEl = document.getElementById('sumFixedCosts');
    const sumExpectedSavingsEl = document.getElementById('sumExpectedSavings');
    const cycleFromInput = document.getElementById('cycleFrom');
    const cycleToInput = document.getElementById('cycleTo');

    // Import/Export elements
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const importBtn = document.getElementById('importBtn');
    const importFileInput = document.getElementById('importFileInput');

    function createSelect(options, cls) {
        const sel = document.createElement('select');
        if (cls) sel.className = cls;
        options.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o;
            opt.textContent = o;
            sel.appendChild(opt);
        });
        sel.addEventListener('change', () => {
            updateSummaries();
            updateCashExpensesTotal();
            updateSummary();
        });
        return sel;
    }

    // ---------------- Expenses ----------------
    function addExpenseRow(prefill) {
        const tr = document.createElement('tr');

        // ID (auto)
        const idTd = document.createElement('td');
        idTd.textContent = String(nextId++);
        tr.appendChild(idTd);

        // Description
        const descTd = document.createElement('td');
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.placeholder = 'Description';
        descTd.appendChild(descInput);
        tr.appendChild(descTd);

        // Amount
        const amtTd = document.createElement('td');
        const amtInput = document.createElement('input');
        amtInput.type = 'number';
        amtInput.min = '0';
        amtInput.step = '0.01';
        amtInput.placeholder = '0.00';
        amtInput.addEventListener('input', () => { updateSummaries(); updateExpenseTotal(); updateSummary(); });
        amtTd.appendChild(amtInput);
        tr.appendChild(amtTd);

        // Category
        const catTd = document.createElement('td');
        const catSelect = createSelect(CATEGORY_OPTIONS, 'category-select');
        catSelect.addEventListener('change', () => { updateSummaries(); updateSummary(); });
        catTd.appendChild(catSelect);
        tr.appendChild(catTd);

        // Payment Method
        const payTd = document.createElement('td');
        const paySelect = createSelect(PAYMENT_OPTIONS, 'payment-select');
        paySelect.addEventListener('change', () => { updateSummaries(); updateSummary(); });
        payTd.appendChild(paySelect);
        tr.appendChild(payTd);

        expenseTableBody.appendChild(tr);
        if (prefill) {
            descInput.value = prefill.description || '';
            amtInput.value = prefill.amount != null ? prefill.amount : '';
            if (prefill.category) catSelect.value = prefill.category;
            if (prefill.payment) paySelect.value = prefill.payment;
        }
    }

    function collectExpenseData() {
        const rows = Array.from(expenseTableBody.querySelectorAll('tr'));
        return rows.map(r => {
            const cells = r.children;
            const id = cells[0].textContent.trim();
            const description = cells[1].querySelector('input').value.trim();
            const amountRaw = cells[2].querySelector('input').value.trim();
            const amount = parseFloat(amountRaw) || 0;
            const category = cells[3].querySelector('select').value;
            const payment = cells[4].querySelector('select').value;
            return { id, description, amount, category, payment };
        });
    }

    function updateSummaries() {
        const data = collectExpenseData();
        const byCategory = {};
        const byPayment = {};
        data.forEach(item => {
            byCategory[item.category] = (byCategory[item.category] || 0) + item.amount;
            byPayment[item.payment] = (byPayment[item.payment] || 0) + item.amount;
        });

        // Category summary
        categorySummaryBody.innerHTML = '';
        CATEGORY_OPTIONS.forEach(cat => {
            const tr = document.createElement('tr');
            const tdCat = document.createElement('td'); tdCat.textContent = cat;
            const tdAmt = document.createElement('td'); tdAmt.textContent = formatCurrency(byCategory[cat] || 0);
            tr.appendChild(tdCat); tr.appendChild(tdAmt);
            categorySummaryBody.appendChild(tr);
        });

        // Payment summary
        paymentSummaryBody.innerHTML = '';
        PAYMENT_OPTIONS.forEach(pay => {
            const tr = document.createElement('tr');
            const tdPay = document.createElement('td'); tdPay.textContent = pay;
            const tdAmt = document.createElement('td'); tdAmt.textContent = formatCurrency(byPayment[pay] || 0);
            tr.appendChild(tdPay); tr.appendChild(tdAmt);
            paymentSummaryBody.appendChild(tr);
        });

        updateInstallmentsFooterTotals();
        updateExpenseTotal();
        updateFixedCostsTotal();
        updateCashExpensesTotal();
        updateSummary();
    }

    function formatCurrency(num) {
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function updateExpenseTotal() {
        if (!expenseAmountTotalEl) return;
        const data = collectExpenseData();
        const total = data.reduce((sum, r) => sum + r.amount, 0);
        expenseAmountTotalEl.textContent = formatCurrency(total);
    }

    // ---------------- Installments ----------------
    function addInstallmentRow(prefill) {
        if (!installmentsBody) return;
        const tr = document.createElement('tr');

        // ID
        const idTd = document.createElement('td');
        idTd.textContent = String(nextInstallmentId++);
        tr.appendChild(idTd);

        // Description
        const descTd = document.createElement('td');
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.placeholder = 'Description';
        descTd.appendChild(descInput);
        tr.appendChild(descTd);

        // Amount (monthly amount)
        const amtTd = document.createElement('td');
        const amtInput = document.createElement('input');
        amtInput.type = 'number';
        amtInput.min = '0';
        amtInput.step = '0.01';
        amtInput.placeholder = '0.00';
        amtInput.addEventListener('input', () => { handleInstallmentChange(); updateSummary(); });
        amtTd.appendChild(amtInput);
        tr.appendChild(amtTd);

        // Remaining Months
        const remTd = document.createElement('td');
        const remInput = document.createElement('input');
        remInput.type = 'number';
        remInput.min = '0';
        remInput.step = '1';
        remInput.placeholder = '0';
        remInput.addEventListener('input', () => { handleInstallmentChange(); updateSummary(); });
        remTd.appendChild(remInput);
        tr.appendChild(remTd);

        // Card
        const cardTd = document.createElement('td');
        const cardSelect = createSelect(PAYMENT_OPTIONS, 'inst-card-select');
        cardTd.appendChild(cardSelect);
        tr.appendChild(cardTd);

        // Total Remaining (calculated)
        const totalRemTd = document.createElement('td');
        totalRemTd.className = 'inst-total-remaining';
        totalRemTd.textContent = '0.00';
        tr.appendChild(totalRemTd);

        installmentsBody.appendChild(tr);
        if (prefill) {
            descInput.value = prefill.description || '';
            amtInput.value = prefill.amount != null ? prefill.amount : '';
            remInput.value = prefill.remainingMonths != null ? prefill.remainingMonths : '';
            if (prefill.card) cardSelect.value = prefill.card;
            recalcInstallmentRowTotals();
        }
    }

    function handleInstallmentChange() {
        recalcInstallmentRowTotals();
        updateInstallmentsFooterTotals();
    }

    function recalcInstallmentRowTotals() {
        if (!installmentsBody) return;
        const rows = Array.from(installmentsBody.querySelectorAll('tr'));
        rows.forEach(row => {
            const amountInput = row.children[2].querySelector('input');
            const remMonthsInput = row.children[3].querySelector('input');
            const totalCell = row.children[5];
            const amount = parseFloat(amountInput.value) || 0;
            const remMonths = parseInt(remMonthsInput.value) || 0;
            const totalRemaining = amount * remMonths;
            totalCell.textContent = formatCurrency(totalRemaining);
        });
    }

    function updateInstallmentsFooterTotals() {
        if (!installmentsBody || !instAmountTotalEl || !instTotalRemainingEl) return;
        recalcInstallmentRowTotals();
        let sumAmount = 0;
        let sumTotalRemaining = 0;
        const rows = Array.from(installmentsBody.querySelectorAll('tr'));
        rows.forEach(row => {
            const amount = parseFloat(row.children[2].querySelector('input').value) || 0;
            const totalRemaining = parseFloat(row.children[5].textContent.replace(/,/g, '')) || 0;
            sumAmount += amount;
            sumTotalRemaining += totalRemaining;
        });
        instAmountTotalEl.textContent = formatCurrency(sumAmount);
        instTotalRemainingEl.textContent = formatCurrency(sumTotalRemaining);
    }

    // ---------------- Fixed Costs ----------------
    function addFixedCostRow(prefill) {
        if (!fixedCostsBody) return;
        const tr = document.createElement('tr');

        // ID
        const idTd = document.createElement('td');
        idTd.textContent = String(nextFixedCostId++);
        tr.appendChild(idTd);

        // Description
        const descTd = document.createElement('td');
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.placeholder = 'Description';
        descTd.appendChild(descInput);
        tr.appendChild(descTd);

        // Amount
        const amtTd = document.createElement('td');
        const amtInput = document.createElement('input');
        amtInput.type = 'number';
        amtInput.min = '0';
        amtInput.step = '0.01';
        amtInput.placeholder = '0.00';
        amtInput.addEventListener('input', () => { updateFixedCostsTotal(); updateSummary(); });
        amtTd.appendChild(amtInput);
        tr.appendChild(amtTd);

        fixedCostsBody.appendChild(tr);
        if (prefill) {
            descInput.value = prefill.description || '';
            amtInput.value = prefill.amount != null ? prefill.amount : '';
        }
    }

    function updateFixedCostsTotal() {
        if (!fixedCostsBody || !fixedCostsTotalEl) return;
        let total = 0;
        const rows = Array.from(fixedCostsBody.querySelectorAll('tr'));
        rows.forEach(row => {
            const amt = parseFloat(row.children[2].querySelector('input').value) || 0;
            total += amt;
        });
        fixedCostsTotalEl.textContent = formatCurrency(total);
    }

    // ---------------- Cash Expenses ----------------
    function addCashExpenseRow(prefill) {
        if (!cashExpensesBody) return;
        const tr = document.createElement('tr');

        // ID
        const idTd = document.createElement('td');
        idTd.textContent = String(nextCashExpenseId++);
        tr.appendChild(idTd);

        // Description
        const descTd = document.createElement('td');
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.placeholder = 'Description';
        descTd.appendChild(descInput);
        tr.appendChild(descTd);

        // Amount
        const amtTd = document.createElement('td');
        const amtInput = document.createElement('input');
        amtInput.type = 'number';
        amtInput.min = '0';
        amtInput.step = '0.01';
        amtInput.placeholder = '0.00';
        amtInput.addEventListener('input', () => { updateCashExpensesTotal(); updateSummary(); });
        amtTd.appendChild(amtInput);
        tr.appendChild(amtTd);

        // Payment Method
        const payTd = document.createElement('td');
        const paySelect = createSelect(CASH_PAYMENT_OPTIONS, 'cash-payment-select');
        paySelect.addEventListener('change', () => { updateCashExpensesTotal(); updateSummary(); });
        payTd.appendChild(paySelect);
        tr.appendChild(payTd);

        // Category
        const catTd = document.createElement('td');
        const catSelect = createSelect(CATEGORY_OPTIONS, 'cash-category-select');
        catSelect.addEventListener('change', () => { updateCashExpensesTotal(); updateSummary(); });
        catTd.appendChild(catSelect);
        tr.appendChild(catTd);

        cashExpensesBody.appendChild(tr);
        if (prefill) {
            descInput.value = prefill.description || '';
            amtInput.value = prefill.amount != null ? prefill.amount : '';
            if (prefill.paymentMethod) paySelect.value = prefill.paymentMethod;
            if (prefill.category) catSelect.value = prefill.category;
        }
    }

    function updateCashExpensesTotal() {
        if (!cashExpensesBody || !cashExpensesTotalEl) return;
        let total = 0;
        const rows = Array.from(cashExpensesBody.querySelectorAll('tr'));
        rows.forEach(row => {
            const amt = parseFloat(row.children[2].querySelector('input').value) || 0;
            total += amt;
        });
        cashExpensesTotalEl.textContent = formatCurrency(total);
    }

    // ---------------- Summary Calculations ----------------
    function parseNumberFromEl(el) {
        if (!el) return 0;
        return parseFloat(el.textContent.replace(/,/g, '')) || 0;
    }

    function daysBetweenExclusive(start, end, today) {
        if (!start || !end) return { daysElapsed: 0, daysRemaining: 0, totalDays: 0 };
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) return { daysElapsed: 0, daysRemaining: 0, totalDays: 0 };
        const current = today ? new Date(today) : new Date();
        // Elapsed days include current day if >= start; days so far = difference in days from start to current inclusive.
        const msPerDay = 86400000;
        const totalDays = Math.floor((endDate - startDate) / msPerDay) + 1; // inclusive cycle length
        let daysElapsed = 0;
        if (current >= startDate) {
            daysElapsed = Math.min(totalDays, Math.floor((current - startDate) / msPerDay) + 1);
        }
        const daysRemaining = Math.max(0, totalDays - daysElapsed); // excludes current day implicitly
        return { daysElapsed, daysRemaining, totalDays };
    }

    function updateSummary() {
        if (!sumCardBillEl) return; // summary section not present
        const cardTotal = parseNumberFromEl(expenseAmountTotalEl);
        const monthlyInstallments = parseNumberFromEl(instAmountTotalEl); // monthly amount
        const fixedCosts = parseNumberFromEl(fixedCostsTotalEl);
        // Requirement 2 uses card total + installments monthly amount
        const cardPlusInstallments = cardTotal + monthlyInstallments;

        // Days info
        const cycleFrom = cycleFromInput ? cycleFromInput.value : '';
        const cycleTo = cycleToInput ? cycleToInput.value : '';
        const { daysElapsed, daysRemaining, totalDays } = daysBetweenExclusive(cycleFrom, cycleTo);

        // Projected cycle spend (4): (cardTotal / daysElapsed * totalDays) + monthlyInstallments
        let projectedCycle = 0;
        if (daysElapsed > 0) {
            projectedCycle = (cardTotal / daysElapsed) * totalDays + monthlyInstallments;
        } else {
            projectedCycle = cardTotal + monthlyInstallments; // fallback when cycle not started
        }

        // Total bill projection including fixed (5)
        const totalProjection = projectedCycle + fixedCosts;

        // Total installment cost (6) = monthlyInstallments (already monthly total)
        const totalInstallmentCost = monthlyInstallments;

        // Expected Income (7)
        const expectedIncome = parseFloat(expectedIncomeInput?.value || '0') || 0;

        // Expected Savings (9) = expectedIncome - totalProjection
        const expectedSavings = expectedIncome - totalProjection;

        // Populate DOM
        sumCardBillEl.textContent = formatCurrency(cardTotal);
        sumCardPlusInstEl.textContent = formatCurrency(cardPlusInstallments);
        sumDaysRemainingEl.textContent = daysRemaining.toString();
        sumProjectedCycleEl.textContent = formatCurrency(projectedCycle);
        sumTotalProjectionEl.textContent = formatCurrency(totalProjection);
        sumInstallmentMonthlyEl.textContent = formatCurrency(totalInstallmentCost);
        sumFixedCostsEl.textContent = formatCurrency(fixedCosts);
        sumExpectedSavingsEl.textContent = formatCurrency(expectedSavings);
    }

    // ---------------- Event Listeners ----------------
    addRowBtn.addEventListener('click', () => {
        addExpenseRow();
    });

    if (addInstallmentBtn) {
        addInstallmentBtn.addEventListener('click', () => {
            addInstallmentRow();
            updateInstallmentsFooterTotals();
            updateSummary();
        });
    }

    if (addFixedCostBtn) {
        addFixedCostBtn.addEventListener('click', () => {
            addFixedCostRow();
            updateFixedCostsTotal();
            updateSummary();
        });
    }

    if (addCashExpenseBtn) {
        addCashExpenseBtn.addEventListener('click', () => {
            addCashExpenseRow();
            updateCashExpensesTotal();
            updateSummary();
        });
    }

    if (expectedIncomeInput) {
        expectedIncomeInput.addEventListener('input', updateSummary);
    }
    if (cycleFromInput) cycleFromInput.addEventListener('change', updateSummary);
    if (cycleToInput) cycleToInput.addEventListener('change', updateSummary);

    // Import/export helper implementations
    function collectInstallmentsData() {
        if (!installmentsBody) return [];
        return Array.from(installmentsBody.querySelectorAll('tr')).map(r => ({
            description: r.children[1].querySelector('input').value.trim(),
            amount: parseFloat(r.children[2].querySelector('input').value) || 0,
            remainingMonths: parseInt(r.children[3].querySelector('input').value) || 0,
            card: r.children[4].querySelector('select').value
        }));
    }
    function collectFixedCostsData() {
        if (!fixedCostsBody) return [];
        return Array.from(fixedCostsBody.querySelectorAll('tr')).map(r => ({
            description: r.children[1].querySelector('input').value.trim(),
            amount: parseFloat(r.children[2].querySelector('input').value) || 0
        }));
    }
    function collectCashExpensesData() {
        if (!cashExpensesBody) return [];
        return Array.from(cashExpensesBody.querySelectorAll('tr')).map(r => ({
            description: r.children[1].querySelector('input').value.trim(),
            amount: parseFloat(r.children[2].querySelector('input').value) || 0,
            paymentMethod: r.children[3].querySelector('select').value,
            category: r.children[4].querySelector('select').value
        }));
    }
    function getDataModel() {
        // Filter out purely empty rows (no description and zero/blank amount)
        const expenseFiltered = collectExpenseData()
            .filter(e => e.description || e.amount)
            .map(e => ({ description: e.description, amount: e.amount, category: e.category, payment: e.payment }));
        const installmentsFiltered = collectInstallmentsData().filter(i => i.description || i.amount || i.remainingMonths);
        const fixedFiltered = collectFixedCostsData().filter(f => f.description || f.amount);
        const cashFiltered = collectCashExpensesData().filter(c => c.description || c.amount);
        return {
            cycleStart: cycleFromInput?.value || '',
            cycleEnd: cycleToInput?.value || '',
            expenses: expenseFiltered,
            installments: installmentsFiltered,
            fixedCosts: fixedFiltered,
            cashExpenses: cashFiltered
        };
    }
    function downloadBlob(filename, mime, text) {
        const blob = new Blob([text], { type: mime });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    }
    function csvEscape(val) {
        if (val == null) return '';
        const s = String(val).replace(/"/g, '""');
        if (/[",\n]/.test(s)) return '"' + s + '"';
        return s;
    }
    function exportJSON() {
        const data = getDataModel();
        downloadBlob(`expense_export_${Date.now()}.json`, 'application/json', JSON.stringify(data, null, 2));
    }
    function exportCSV() {
        const data = getDataModel();
        const lines = [];
        lines.push('# Cycle');
        lines.push('cycleStart,cycleEnd');
        lines.push(`${data.cycleStart || ''},${data.cycleEnd || ''}`);
        lines.push('');
        lines.push('# Expenses');
        lines.push('description,amount,category,payment');
        data.expenses.forEach(e => lines.push(`${csvEscape(e.description)},${e.amount},${csvEscape(e.category)},${csvEscape(e.payment)}`));
        lines.push('');
        lines.push('# Installments');
        lines.push('description,amount,remainingMonths,card');
        data.installments.forEach(i => lines.push(`${csvEscape(i.description)},${i.amount},${i.remainingMonths},${csvEscape(i.card)}`));
        lines.push('');
        lines.push('# FixedCosts');
        lines.push('description,amount');
        data.fixedCosts.forEach(f => lines.push(`${csvEscape(f.description)},${f.amount}`));
        lines.push('');
        lines.push('# CashExpenses');
        lines.push('description,amount,paymentMethod,category');
        data.cashExpenses.forEach(c => lines.push(`${csvEscape(c.description)},${c.amount},${csvEscape(c.paymentMethod)},${csvEscape(c.category)}`));
        downloadBlob(`expense_export_${Date.now()}.csv`, 'text/csv', lines.join('\n'));
    }
    function clearAllTables() {
        expenseTableBody.innerHTML = '';
        if (installmentsBody) installmentsBody.innerHTML = '';
        if (fixedCostsBody) fixedCostsBody.innerHTML = '';
        if (cashExpensesBody) cashExpensesBody.innerHTML = '';
        nextId = 1; nextInstallmentId = 1; nextFixedCostId = 1; nextCashExpenseId = 1;
    }
    function populateFromData(data) {
        clearAllTables();
        if (cycleFromInput && data.cycleStart) cycleFromInput.value = data.cycleStart;
        if (cycleToInput && data.cycleEnd) cycleToInput.value = data.cycleEnd;
        const eArr = Array.isArray(data.expenses) ? data.expenses : [];
        const iArr = Array.isArray(data.installments) ? data.installments : [];
        const fArr = Array.isArray(data.fixedCosts) ? data.fixedCosts : [];
        const cArr = Array.isArray(data.cashExpenses) ? data.cashExpenses : [];
        eArr.forEach(e => addExpenseRow(e));
        iArr.forEach(i => addInstallmentRow(i));
        fArr.forEach(f => addFixedCostRow(f));
        cArr.forEach(c => addCashExpenseRow(c));
        // If all sections empty, ensure at least one blank starter row per table for UX
        if (eArr.length === 0) addExpenseRow();
        if (iArr.length === 0 && installmentsBody) addInstallmentRow();
        if (fArr.length === 0 && fixedCostsBody) addFixedCostRow();
        if (cArr.length === 0 && cashExpensesBody) addCashExpenseRow();
        updateSummaries();
        recalcInstallmentRowTotals();
        updateInstallmentsFooterTotals();
        updateFixedCostsTotal();
        updateCashExpensesTotal();
        updateSummary();
    }
    function importJSONText(text) {
        try { const obj = JSON.parse(text); populateFromData(obj); }
        catch { alert('Invalid JSON file.'); }
    }
    function splitCsv(line) {
        const result = []; let cur = ''; let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"') { if (i + 1 < line.length && line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; } }
                else cur += ch;
            } else {
                if (ch === ',') { result.push(cur); cur = ''; }
                else if (ch === '"') { inQuotes = true; }
                else cur += ch;
            }
        }
        result.push(cur);
        return result.map(s => s.trim());
    }
    function importCSVText(text) {
        const lines = text.split(/\r?\n/);
        let mode = ''; let headerConsumed = false;
        const data = { cycleStart: '', cycleEnd: '', expenses: [], installments: [], fixedCosts: [], cashExpenses: [] };
        lines.forEach(raw => {
            const line = raw.trim();
            if (line.startsWith('#')) { mode = line.replace(/^#\s*/, '').trim(); headerConsumed = false; return; }
            if (!line) return;
            if (!headerConsumed) { headerConsumed = true; return; }
            const cols = splitCsv(line);
            switch (mode) {
                case 'Cycle':
                    if (cols.length >= 2 && !data.cycleStart) { data.cycleStart = cols[0]; data.cycleEnd = cols[1]; }
                    break;
                case 'Expenses':
                    if (cols.length >= 4) data.expenses.push({ description: cols[0], amount: parseFloat(cols[1]) || 0, category: cols[2], payment: cols[3] });
                    break;
                case 'Installments':
                    if (cols.length >= 4) data.installments.push({ description: cols[0], amount: parseFloat(cols[1]) || 0, remainingMonths: parseInt(cols[2]) || 0, card: cols[3] });
                    break;
                case 'FixedCosts':
                    if (cols.length >= 2) data.fixedCosts.push({ description: cols[0], amount: parseFloat(cols[1]) || 0 });
                    break;
                case 'CashExpenses':
                    if (cols.length >= 4) data.cashExpenses.push({ description: cols[0], amount: parseFloat(cols[1]) || 0, paymentMethod: cols[2], category: cols[3] });
                    break;
            }
        });
        populateFromData(data);
    }
    function handleFileImport(file) {
        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target.result;
            if (file.name.toLowerCase().endsWith('.json')) importJSONText(text);
            else importCSVText(text);
        };
        reader.readAsText(file);
    }

    // Bind export/import buttons (ensure available even with no data yet)
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', () => {
        const data = getDataModel();
        // Always allow export, even if arrays empty.
        downloadBlob(`expense_export_${Date.now()}.json`, 'application/json', JSON.stringify(data, null, 2));
    });
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => {
        exportCSV();
    });
    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) handleFileImport(file);
            importFileInput.value = '';
        });
    }

    // Initialize
    addExpenseRow();
    updateSummaries();
    if (installmentsBody) {
        addInstallmentRow();
        updateInstallmentsFooterTotals();
    }
    if (fixedCostsBody) {
        addFixedCostRow();
        updateFixedCostsTotal();
    }
    if (cashExpensesBody) {
        addCashExpenseRow();
        updateCashExpensesTotal();
    }
    updateSummary();
})();