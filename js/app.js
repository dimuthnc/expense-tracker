// Expense Tracker Front-End Only
(function () {
    const CATEGORY_OPTIONS = ["Grocery", "Outside Food", "Transport", "Health", "Household", "Entertainment", "Other"];
    const PAYMENT_OPTIONS = ["HSBC", "CITI", "SC", "Trust", "DBS"];

    let nextId = 1;
    let nextInstallmentId = 1;

    // Existing Expenses elements
    const expenseTableBody = document.querySelector('#expenseTable tbody');
    const addRowBtn = document.getElementById('addRowBtn');
    const categorySummaryBody = document.querySelector('#categorySummary tbody');
    const paymentSummaryBody = document.querySelector('#paymentSummary tbody');

    // Installments elements
    const installmentsTable = document.getElementById('installmentsTable');
    const installmentsBody = installmentsTable ? installmentsTable.querySelector('tbody') : null;
    const addInstallmentBtn = document.getElementById('addInstallmentBtn');
    const instAmountTotalEl = document.getElementById('instAmountTotal');
    const instTotalRemainingEl = document.getElementById('instTotalRemainingTotal');

    function createSelect(options, cls) {
        const sel = document.createElement('select');
        if (cls) sel.className = cls;
        options.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o;
            opt.textContent = o;
            sel.appendChild(opt);
        });
        sel.addEventListener('change', updateSummaries);
        return sel;
    }

    // ---------------- Expenses ----------------
    function addExpenseRow() {
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
        amtInput.addEventListener('input', updateSummaries);
        amtTd.appendChild(amtInput);
        tr.appendChild(amtTd);

        // Category
        const catTd = document.createElement('td');
        const catSelect = createSelect(CATEGORY_OPTIONS, 'category-select');
        catSelect.addEventListener('change', updateSummaries);
        catTd.appendChild(catSelect);
        tr.appendChild(catTd);

        // Payment Method
        const payTd = document.createElement('td');
        const paySelect = createSelect(PAYMENT_OPTIONS, 'payment-select');
        paySelect.addEventListener('change', updateSummaries);
        payTd.appendChild(paySelect);
        tr.appendChild(payTd);

        expenseTableBody.appendChild(tr);
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
    }

    function formatCurrency(num) {
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ---------------- Installments ----------------
    function addInstallmentRow() {
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
        amtInput.addEventListener('input', handleInstallmentChange);
        amtTd.appendChild(amtInput);
        tr.appendChild(amtTd);

        // Remaining Months
        const remTd = document.createElement('td');
        const remInput = document.createElement('input');
        remInput.type = 'number';
        remInput.min = '0';
        remInput.step = '1';
        remInput.placeholder = '0';
        remInput.addEventListener('input', handleInstallmentChange);
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

    // ---------------- Event Listeners ----------------
    addRowBtn.addEventListener('click', () => {
        addExpenseRow();
    });

    if (addInstallmentBtn) {
        addInstallmentBtn.addEventListener('click', () => {
            addInstallmentRow();
            updateInstallmentsFooterTotals();
        });
    }

    // Initialize
    addExpenseRow();
    updateSummaries();
    if (installmentsBody) {
        addInstallmentRow();
        updateInstallmentsFooterTotals();
    }
})();