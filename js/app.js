// Personal Expense Manager (Front-End Only)
(function () {
    let CATEGORY_OPTIONS = ["Grocery", "Outside Food", "Transport", "Health", "Household", "Entertainment", "Other"];
    let PAYMENT_OPTIONS = ["HSBC", "CITI", "SC", "Trust", "DBS"];
    let CASH_PAYMENT_OPTIONS = ["Cash", "Paylah", "Bank Transfer"];

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
    const sumDaysRemainingEl = document.getElementById('sumDaysRemaining');
    const sumInstallmentMonthlyEl = document.getElementById('sumInstallmentMonthly');
    const expectedIncomeInput = document.getElementById('expectedIncome');
    const sumFixedCostsEl = document.getElementById('sumFixedCosts');
    const sumExpectedSavingsEl = document.getElementById('sumExpectedSavings');
    const cycleFromInput = document.getElementById('cycleFrom');
    const cycleToInput = document.getElementById('cycleTo');
    const cyclePrevBtn = document.getElementById('cyclePrevBtn');
    const cycleNextBtn = document.getElementById('cycleNextBtn');

    // Import/Export elements
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const importBtn = document.getElementById('importBtn');
    const importFileInput = document.getElementById('importFileInput');
    const themeSelect = document.getElementById('themeSelect');
    // Config elements
    const categoryListEl = document.getElementById('categoryList');
    const cardListEl = document.getElementById('cardList');
    const cashListEl = document.getElementById('cashList');
    const newCategoryInput = document.getElementById('newCategoryInput');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const newCardInput = document.getElementById('newCardInput');
    const addCardBtn = document.getElementById('addCardBtn');
    const newCashInput = document.getElementById('newCashInput');
    const addCashBtn = document.getElementById('addCashBtn');

    // Simplified version: no modal / undo / edit-save complexity.

    function createSelect(options, cls) {
        const sel = document.createElement('select');
        if (cls) sel.className = cls;
        populateSelectOptions(sel, options);
        sel.addEventListener('change', () => {
            updateSummaries();
            updateCashExpensesTotal();
            updateSummary();
        });
        return sel;
    }

    function populateSelectOptions(selectEl, list, currentValue) {
        const existing = currentValue || selectEl.value;
        selectEl.innerHTML = '';
        list.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o; opt.textContent = o; selectEl.appendChild(opt);
        });
        // Preserve legacy value if removed
        if (existing && existing.length && !list.includes(existing)) {
            const legacyOpt = document.createElement('option');
            legacyOpt.value = existing; legacyOpt.textContent = existing + ' (legacy)';
            legacyOpt.className = 'legacy-option';
            selectEl.appendChild(legacyOpt);
        }
        if (existing) selectEl.value = existing;
    }

    function refreshAllSelects() {
        // Expenses table selects (categories & card payment)
        expenseTableBody.querySelectorAll('tr').forEach(tr => {
            const catSel = tr.children[3]?.querySelector('select');
            const paySel = tr.children[4]?.querySelector('select');
            if (catSel) populateSelectOptions(catSel, CATEGORY_OPTIONS);
            if (paySel) populateSelectOptions(paySel, PAYMENT_OPTIONS);
        });
        // Installments table card selects
        if (installmentsBody) installmentsBody.querySelectorAll('tr').forEach(tr => {
            const cardSel = tr.children[4]?.querySelector('select');
            if (cardSel) populateSelectOptions(cardSel, PAYMENT_OPTIONS);
        });
        // Cash expenses table selects (payment + category)
        if (cashExpensesBody) cashExpensesBody.querySelectorAll('tr').forEach(tr => {
            const paySel = tr.children[3]?.querySelector('select');
            const catSel = tr.children[4]?.querySelector('select');
            if (paySel) populateSelectOptions(paySel, CASH_PAYMENT_OPTIONS);
            if (catSel) populateSelectOptions(catSel, CATEGORY_OPTIONS);
        });
        updateSummaries();
    }

    function renderConfigLists() {
        if (categoryListEl) {
            categoryListEl.innerHTML = '';
            CATEGORY_OPTIONS.forEach(cat => {
                const li = document.createElement('li');
                li.textContent = cat;
                const btn = document.createElement('button'); btn.type='button'; btn.textContent='x'; btn.addEventListener('click', ()=>{ removeCategory(cat); });
                li.appendChild(btn); categoryListEl.appendChild(li);
            });
        }
        if (cardListEl) {
            cardListEl.innerHTML='';
            PAYMENT_OPTIONS.forEach(card => {
                const li = document.createElement('li'); li.textContent=card;
                const btn=document.createElement('button'); btn.type='button'; btn.textContent='x'; btn.addEventListener('click',()=>{ removeCard(card); });
                li.appendChild(btn); cardListEl.appendChild(li);
            });
        }
        if (cashListEl) {
            cashListEl.innerHTML='';
            CASH_PAYMENT_OPTIONS.forEach(c => {
                const li=document.createElement('li'); li.textContent=c;
                const btn=document.createElement('button'); btn.type='button'; btn.textContent='x'; btn.addEventListener('click',()=>{ removeCash(c); });
                li.appendChild(btn); cashListEl.appendChild(li);
            });
        }
    }

    function addUnique(listRef, value) {
        const v = value.trim();
        if (!v) return false;
        if (listRef.includes(v)) return false;
        listRef.push(v);
        return true;
    }
    function removeItem(listRef, value) {
        const idx = listRef.indexOf(value);
        if (idx >= 0) listRef.splice(idx,1);
    }
    function removeCategory(cat) { removeItem(CATEGORY_OPTIONS, cat); renderConfigLists(); refreshAllSelects(); }
    function removeCard(card) { removeItem(PAYMENT_OPTIONS, card); renderConfigLists(); refreshAllSelects(); }
    function removeCash(c) { removeItem(CASH_PAYMENT_OPTIONS, c); renderConfigLists(); refreshAllSelects(); }

    addCategoryBtn?.addEventListener('click', ()=>{ if(addUnique(CATEGORY_OPTIONS, newCategoryInput.value)) { newCategoryInput.value=''; renderConfigLists(); refreshAllSelects(); }});
    addCardBtn?.addEventListener('click', ()=>{ if(addUnique(PAYMENT_OPTIONS, newCardInput.value)) { newCardInput.value=''; renderConfigLists(); refreshAllSelects(); }});
    addCashBtn?.addEventListener('click', ()=>{ if(addUnique(CASH_PAYMENT_OPTIONS, newCashInput.value)) { newCashInput.value=''; renderConfigLists(); refreshAllSelects(); }});
    newCategoryInput?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ addCategoryBtn.click(); }});
    newCardInput?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ addCardBtn.click(); }});
    newCashInput?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ addCashBtn.click(); }});

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

    // Actions
    const actionsTd = document.createElement('td');
    actionsTd.appendChild(buildRowActions(tr, 'expense'));
        tr.appendChild(actionsTd);

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
        updateExpenseCharts(byCategory, byPayment);
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

    // ---------------- Pie Charts (Expenses Distribution) ----------------
    const chartByCategoryCanvas = document.getElementById('chartByCategory');
    const chartByPaymentCanvas = document.getElementById('chartByPayment');
    const legendByCategory = document.getElementById('legendByCategory');
    const legendByPayment = document.getElementById('legendByPayment');
    let lastCategoryDataKey = '';
    let lastPaymentDataKey = '';

    function buildDataKey(obj) {
        return Object.keys(obj).sort().map(k => k + ':' + obj[k]).join('|');
    }

    function generatePalette(n, seedHue) {
        // Simple evenly spaced hues; adjust saturation/lightness for theme.
        const colors = [];
        const baseHue = typeof seedHue === 'number' ? seedHue : Math.floor(Math.random() * 360);
        for (let i = 0; i < n; i++) {
            const hue = (baseHue + (360 / n) * i) % 360;
            colors.push(`hsl(${hue} 70% 55%)`);
        }
        return colors;
    }

    function drawPie(ctx, dataPairs, palette) {
        const total = dataPairs.reduce((s, p) => s + p[1], 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 4;
        if (total <= 0) {
            // Draw empty ring / placeholder
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--surface-alt') || '#eee';
            ctx.fill();
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted') || '#666';
            ctx.font = '12px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No data', centerX, centerY);
            return;
        }
        let startAngle = -Math.PI / 2; // start at top
        dataPairs.forEach(([label, value], idx) => {
            const sliceAngle = (value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = palette[idx % palette.length];
            ctx.fill();
            startAngle = endAngle;
        });
        // Optional: donut hole for style
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        // Hole background
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.43, 0, Math.PI * 2);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--surface');
        ctx.fill();
    }

    function updateLegend(listEl, dataPairs, palette) {
        if (!listEl) return;
        const total = dataPairs.reduce((s, p) => s + p[1], 0) || 0;
        listEl.innerHTML = '';
        dataPairs.forEach(([label, value], idx) => {
            const li = document.createElement('li');
            const sw = document.createElement('span'); sw.className = 'swatch'; sw.style.background = palette[idx % palette.length];
            const lbl = document.createElement('span'); lbl.className = 'label'; lbl.textContent = label || '(Uncategorized)';
            const amt = document.createElement('span'); amt.className = 'value'; amt.textContent = formatCurrency(value);
            const pct = document.createElement('span'); pct.className = 'percent';
            pct.textContent = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
            li.appendChild(sw); li.appendChild(lbl); li.appendChild(amt); li.appendChild(pct);
            listEl.appendChild(li);
        });
    }

    function updateExpenseCharts(byCategory, byPayment) {
        // Prepare sorted data arrays excluding zeroes
        if (chartByCategoryCanvas) {
            const ctxCat = chartByCategoryCanvas.getContext('2d');
            const catPairs = Object.entries(byCategory).filter(([,v]) => v > 0).sort((a,b)=>b[1]-a[1]);
            const key = buildDataKey(byCategory);
            if (buildDataKey(byCategory) !== lastCategoryDataKey) {
                const palette = generatePalette(Math.max(catPairs.length, 1), 330);
                drawPie(ctxCat, catPairs, palette);
                updateLegend(legendByCategory, catPairs, palette);
                lastCategoryDataKey = key;
            }
        }
        if (chartByPaymentCanvas) {
            const ctxPay = chartByPaymentCanvas.getContext('2d');
            const payPairs = Object.entries(byPayment).filter(([,v]) => v > 0).sort((a,b)=>b[1]-a[1]);
            const key = buildDataKey(byPayment);
            if (buildDataKey(byPayment) !== lastPaymentDataKey) {
                const palette = generatePalette(Math.max(payPairs.length, 1), 210);
                drawPie(ctxPay, payPairs, palette);
                updateLegend(legendByPayment, payPairs, palette);
                lastPaymentDataKey = key;
            }
        }
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

    // Actions
    const actionsTd = document.createElement('td');
    actionsTd.appendChild(buildRowActions(tr, 'installment'));
        tr.appendChild(actionsTd);

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

    // Actions
    const actionsTd = document.createElement('td');
    actionsTd.appendChild(buildRowActions(tr, 'fixed'));
        tr.appendChild(actionsTd);

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

    // Actions
    const actionsTd = document.createElement('td');
    actionsTd.appendChild(buildRowActions(tr, 'cash'));
        tr.appendChild(actionsTd);

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

    // Cache new elements (added metrics)
    const expectedSavingsInput = document.getElementById('expectedSavingsInput');
    const sumRemainingBudgetEl = document.getElementById('sumRemainingBudget');
    const sumRemainingPerDayEl = document.getElementById('sumRemainingPerDay');
    const sumCashExpensesEl = document.getElementById('sumCashExpenses');

    function updateSummary() {
        if (!sumCardBillEl) return; // summary section not present
        const cardTotal = parseNumberFromEl(expenseAmountTotalEl);
        const monthlyInstallments = parseNumberFromEl(instAmountTotalEl); // monthly amount
        const fixedCosts = parseNumberFromEl(fixedCostsTotalEl);
        const cashExpenses = parseNumberFromEl(cashExpensesTotalEl); // already aggregated elsewhere

        // Days info
        const cycleFrom = cycleFromInput ? cycleFromInput.value : '';
        const cycleTo = cycleToInput ? cycleToInput.value : '';
        const { daysElapsed, daysRemaining, totalDays } = daysBetweenExclusive(cycleFrom, cycleTo);

        // Total installment cost (monthly)
        const totalInstallmentCost = monthlyInstallments;

        // Inputs
        const expectedIncome = parseFloat(expectedIncomeInput?.value || '0') || 0;
        const expectedSavingsManual = parseFloat(expectedSavingsInput?.value || '0') || 0; // user-defined

        // Remaining Budget = Expected Income - Card Total - Installment Monthly - Fixed Costs - Expected Savings (user input)
        const remainingBudget = expectedIncome - cardTotal - totalInstallmentCost - fixedCosts - expectedSavingsManual;

        // Remaining Budget Per Day = remainingBudget / daysRemaining (if in-cycle and daysRemaining>0)
        let remainingPerDayDisplay = 'Not Applicable';
        if (daysElapsed > 0 && daysRemaining > 0 && totalDays > 0) {
            remainingPerDayDisplay = formatCurrency(remainingBudget / daysRemaining);
        }

        // Projected Savings (replacing old meaning) we now treat as manual expectedSavingsInput vs computed savings
        // Display the manual expected savings value in sumExpectedSavingsEl
        const projectedSavings = expectedSavingsManual;

        // Populate DOM
        sumCardBillEl.textContent = formatCurrency(cardTotal);
        sumDaysRemainingEl.textContent = daysRemaining.toString();
        sumInstallmentMonthlyEl.textContent = formatCurrency(totalInstallmentCost);
        sumFixedCostsEl.textContent = formatCurrency(fixedCosts);
        if (sumCashExpensesEl) sumCashExpensesEl.textContent = formatCurrency(cashExpenses);
        sumExpectedSavingsEl.textContent = formatCurrency(projectedSavings);
        if (sumRemainingBudgetEl) {
            sumRemainingBudgetEl.textContent = formatCurrency(remainingBudget);
            sumRemainingBudgetEl.classList.toggle('negative', remainingBudget < 0);
        }
        if (sumRemainingPerDayEl) {
            sumRemainingPerDayEl.textContent = remainingPerDayDisplay;
            if (remainingPerDayDisplay !== 'Not Applicable') {
                const numeric = remainingBudget / (daysElapsed > 0 ? daysRemaining || 1 : 1);
                sumRemainingPerDayEl.classList.toggle('negative', numeric < 0);
            } else {
                sumRemainingPerDayEl.classList.remove('negative');
            }
        }
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

    if (expectedIncomeInput) expectedIncomeInput.addEventListener('input', updateSummary);
    if (expectedSavingsInput) expectedSavingsInput.addEventListener('input', updateSummary);
    if (cycleFromInput) cycleFromInput.addEventListener('change', updateSummary);
    if (cycleToInput) cycleToInput.addEventListener('change', updateSummary);
    if (cyclePrevBtn) cyclePrevBtn.addEventListener('click', () => shiftCycle(-1));
    if (cycleNextBtn) cycleNextBtn.addEventListener('click', () => shiftCycle(1));
    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            applyTheme(themeSelect.value);
            try { localStorage.setItem('et_theme', themeSelect.value); } catch {}
        });
    }

    // Keyboard shortcut: Alt + A to add a new credit card expense row quickly
    document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'a' || e.key === 'A')) {
            // Prevent default only if not typing inside an input/select/textarea
            const tag = document.activeElement && document.activeElement.tagName;
            if (tag && ['INPUT','SELECT','TEXTAREA'].includes(tag)) return; // don't hijack when editing
            addExpenseRow();
            updateExpenseTotal();
            updateSummary();
            // Focus description field of last added row
            const rows = expenseTableBody.querySelectorAll('tr');
            if (rows.length) {
                const last = rows[rows.length - 1];
                const descInput = last.querySelector('input[type="text"]');
                if (descInput) descInput.focus();
            }
        }
    });

    // -------- Cycle Helpers (15th to 15th logic) --------
    function formatYMD(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    function computeCycleContaining(date) {
        // A cycle runs from the 15th of a month (inclusive) to the 15th of next month (exclusive? For UI we mark end date as that next 15th)
        // Given a date, find the start 15th <= date < next 15th.
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        let start; let end;
        if (d.getDate() >= 15) {
            start = new Date(d.getFullYear(), d.getMonth(), 15);
            end = new Date(d.getFullYear(), d.getMonth() + 1, 15);
        } else {
            start = new Date(d.getFullYear(), d.getMonth() - 1, 15);
            end = new Date(d.getFullYear(), d.getMonth(), 15);
        }
        return { start, end };
    }
    function setCycle(startDate, endDate) {
        if (cycleFromInput) cycleFromInput.value = formatYMD(startDate);
        if (cycleToInput) cycleToInput.value = formatYMD(endDate);
        updateSummary();
    }
    function initDefaultCycleIfEmpty() {
        if (cycleFromInput && cycleToInput && !cycleFromInput.value && !cycleToInput.value) {
            const today = new Date();
            const { start, end } = computeCycleContaining(today);
            setCycle(start, end);
        }
    }
    function shiftCycle(deltaMonths) {
        if (!cycleFromInput || !cycleToInput || !cycleFromInput.value || !cycleToInput.value) {
            initDefaultCycleIfEmpty();
        }
        if (!cycleFromInput.value || !cycleToInput.value) return; // still missing
        const start = new Date(cycleFromInput.value + 'T00:00:00');
        const end = new Date(cycleToInput.value + 'T00:00:00');
        if (isNaN(start) || isNaN(end)) return;
        // We assume they align to 15th boundaries; shift both by deltaMonths
        const newStart = new Date(start.getFullYear(), start.getMonth() + deltaMonths, 15);
        const newEnd = new Date(end.getFullYear(), end.getMonth() + deltaMonths, 15);
        setCycle(newStart, newEnd);
    }

    // ---------------- Theming ----------------
    function applyTheme(theme) {
        const body = document.body;
        // Remove any previously applied theme classes
        body.classList.remove('theme-dark','theme-dracula','theme-vscode','theme-pink');
        switch(theme) {
            case 'dark': body.classList.add('theme-dark'); break;
            case 'dracula': body.classList.add('theme-dracula'); break;
            case 'vscode': body.classList.add('theme-vscode'); break;
            case 'pink': body.classList.add('theme-pink'); break;
            default: /* light fallback (root vars) */ break;
        }
    }
    function initTheme() {
        if (!themeSelect) return;
        let stored = '';
        try { stored = localStorage.getItem('et_theme') || ''; } catch {}
        if (!['light','dark','dracula','vscode','pink'].includes(stored)) stored = 'light';
        themeSelect.value = stored;
        applyTheme(stored);
    }

    // Keep theme in sync across tabs/pages
    window.addEventListener('storage', (e) => {
        if (e.key === 'et_theme') {
            const newTheme = e.newValue && ['light','dark','dracula','vscode','pink'].includes(e.newValue) ? e.newValue : 'light';
            applyTheme(newTheme);
            if (themeSelect) themeSelect.value = newTheme;
        }
    });

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
            expectedIncome: expectedIncomeInput?.value ? parseFloat(expectedIncomeInput.value) || 0 : 0,
            expectedSavings: expectedSavingsInput?.value ? parseFloat(expectedSavingsInput.value) || 0 : 0,
            categories: Array.isArray(CATEGORY_OPTIONS) ? CATEGORY_OPTIONS.slice() : [],
            cardPaymentMethods: Array.isArray(PAYMENT_OPTIONS) ? PAYMENT_OPTIONS.slice() : [],
            cashPaymentMethods: Array.isArray(CASH_PAYMENT_OPTIONS) ? CASH_PAYMENT_OPTIONS.slice() : [],
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
    // New helper: build human-readable timestamp segment for export filenames (YYYY-MM-DD-HHmm)
    function buildExportTimestamp() {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
    }
    function exportJSON() {
        const data = getDataModel();
        downloadBlob(`expense_export_${buildExportTimestamp()}.json`, 'application/json', JSON.stringify(data, null, 2));
    }
    function exportCSV() {
        const data = getDataModel();
        const lines = [];
        lines.push('# Cycle');
        lines.push('cycleStart,cycleEnd,expectedIncome,expectedSavings');
        lines.push(`${data.cycleStart || ''},${data.cycleEnd || ''},${data.expectedIncome != null ? data.expectedIncome : ''},${data.expectedSavings != null ? data.expectedSavings : ''}`);
        lines.push('');
        lines.push('# Categories');
        lines.push('category');
        (data.categories || []).forEach(cat => lines.push(`${csvEscape(cat)}`));
        lines.push('');
        lines.push('# CardPaymentMethods');
        lines.push('card');
        (data.cardPaymentMethods || []).forEach(card => lines.push(`${csvEscape(card)}`));
        lines.push('');
        lines.push('# CashPaymentMethods');
        lines.push('method');
        (data.cashPaymentMethods || []).forEach(method => lines.push(`${csvEscape(method)}`));
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
        downloadBlob(`expense_export_${buildExportTimestamp()}.csv`, 'text/csv', lines.join('\n'));
    }

    // -------- Row Action Helpers --------
    function buildRowActions(tr, type) {
        const wrap = document.createElement('div');
        wrap.className = 'row-actions';
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.classList.add('icon-btn','delete-btn');
        delBtn.setAttribute('aria-label', 'Delete row');
        delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 10v6"/><path d="M14 10v6"/><path d="M9 6l1-2h4l1 2"/></svg>';
        delBtn.addEventListener('click', () => {
            tr.remove();
            postRowMutation(type);
        });
        wrap.appendChild(delBtn);
        return wrap;
    }
    // Modal + undo helpers injected later (see bottom additions)
    function postRowMutation(type) {
        // Recalculate everything based on type; simplest is global updates
        updateSummaries();
        if (type === 'installment') {
            recalcInstallmentRowTotals();
            updateInstallmentsFooterTotals();
        }
        updateFixedCostsTotal();
        updateCashExpensesTotal();
        updateExpenseTotal();
        updateSummary();
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
        if (expectedIncomeInput && typeof data.expectedIncome !== 'undefined' && data.expectedIncome !== null && data.expectedIncome !== '') {
            expectedIncomeInput.value = data.expectedIncome;
        }
        if (expectedSavingsInput && typeof data.expectedSavings !== 'undefined' && data.expectedSavings !== null && data.expectedSavings !== '') {
            expectedSavingsInput.value = data.expectedSavings;
        }
        // Apply configurable lists if provided
        if (Array.isArray(data.categories) && data.categories.length) CATEGORY_OPTIONS = data.categories.slice();
        if (Array.isArray(data.cardPaymentMethods) && data.cardPaymentMethods.length) PAYMENT_OPTIONS = data.cardPaymentMethods.slice();
        if (Array.isArray(data.cashPaymentMethods) && data.cashPaymentMethods.length) CASH_PAYMENT_OPTIONS = data.cashPaymentMethods.slice();
        // Re-render config lists and ensure selects use new options
        renderConfigLists();
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
        // After rows are created, refresh selects to include legacy values if needed
        refreshAllSelects();
        updateSummaries();
        recalcInstallmentRowTotals();
        updateInstallmentsFooterTotals();
        updateFixedCostsTotal();
        updateCashExpensesTotal();
        updateSummary();
    }
    // Removed modal / undo / edit helpers.
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
        const data = { cycleStart: '', cycleEnd: '', expectedIncome: '', expectedSavings: '', categories: [], cardPaymentMethods: [], cashPaymentMethods: [], expenses: [], installments: [], fixedCosts: [], cashExpenses: [] };
        lines.forEach(raw => {
            const line = raw.trim();
            if (line.startsWith('#')) { mode = line.replace(/^#\s*/, '').trim(); headerConsumed = false; return; }
            if (!line) return;
            if (!headerConsumed) { headerConsumed = true; return; }
            const cols = splitCsv(line);
            switch (mode) {
                case 'Cycle':
                    if (cols.length >= 2 && !data.cycleStart) {
                        data.cycleStart = cols[0];
                        data.cycleEnd = cols[1];
                        if (cols.length >= 3) data.expectedIncome = cols[2];
                        if (cols.length >= 4) data.expectedSavings = cols[3];
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
        downloadBlob(`expense_export_${buildExportTimestamp()}.json`, 'application/json', JSON.stringify(data, null, 2));
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
    initTheme();
    initDefaultCycleIfEmpty();
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
    // Initial config render
    renderConfigLists();
    refreshAllSelects();
})();
