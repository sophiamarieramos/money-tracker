// ──────────────────────────────────────────────
// UTILITY FUNCTIONS
// ──────────────────────────────────────────────

function formatPeso(amount) {
    return '₱' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getWeekRange() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
}

function getMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
}

function filterExpensesByDate(expenses, start, end) {
    return expenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d < end;
    });
}

function getTotal(expenses) {
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
}

function getCategoryTotal(expenses, category) {
    return expenses.filter(e => e.category === category).reduce((sum, e) => sum + (e.amount || 0), 0);
}

function getCategoryCount(expenses, category) {
    return expenses.filter(e => e.category === category).length;
}

function getMostExpensiveDay(expenses) {
    const days = {};
    expenses.forEach(e => {
        const d = new Date(e.date).toLocaleDateString('en-US', { weekday: 'long' });
        days[d] = (days[d] || 0) + e.amount;
    });
    let maxDay = 'Sunday';
    let maxAmount = 0;
    Object.entries(days).forEach(([k, v]) => {
        if (v > maxAmount) {
            maxAmount = v;
            maxDay = k;
        }
    });
    return { day: maxDay, amount: maxAmount };
}

function getMostFrequentCategory(expenses) {
    const freq = {};
    expenses.forEach(e => {
        freq[e.category] = (freq[e.category] || 0) + 1;
    });
    let maxCat = 'Other';
    let maxCount = 0;
    Object.entries(freq).forEach(([k, v]) => {
        if (v > maxCount) {
            maxCount = v;
            maxCat = k;
        }
    });
    return { category: maxCat, count: maxCount };
}

function getTopCategory(expenses, categories) {
    let topCat = categories[0];
    let topAmount = 0;
    categories.forEach(c => {
        const v = getCategoryTotal(expenses, c);
        if (v > topAmount) {
            topAmount = v;
            topCat = c;
        }
    });
    return { category: topCat, amount: topAmount };
}

function daysSince(dateString) {
    return Math.floor((Date.now() - new Date(dateString)) / (1000 * 60 * 60 * 24));
}

function getFinancialPersonality(expenses, total, topCategory) {
    const personalities = [
        { name: '✨ THE LITTLE TREAT GIRL ✨', desc: '"You deserve it" was apparently your financial philosophy this month.' },
        { name: '🛍️ THE IMPULSE SHOPPER ✨', desc: '"Add to cart" is your love language.' },
        { name: '☕ THE CAFFEINE QUEEN ✨', desc: 'Your blood type is coffee.' },
        { name: '💰 THE SAVER ✨', desc: "You're actually responsible. Who are you?" },
        { name: '🍜 THE FOODIE ✨', desc: 'Your wallet is full of receipts from restaurants.' },
        { name: '💄 THE BEAUTY GIRL ✨', desc: 'Skincare today, financial crisis tomorrow.' },
        { name: '✈️ THE DREAMER ✨', desc: 'You spend little but save aggressively for big goals.' }
    ];

    if (expenses.length === 0) return personalities[0];
    
    const totalSpent = getTotal(expenses);
    const coffeeCount = getCategoryCount(expenses, 'Coffee');
    const foodAmount = getCategoryTotal(expenses, 'Food');
    const shopAmount = getCategoryTotal(expenses, 'Shopping');
    const beautyAmount = getCategoryTotal(expenses, 'Beauty');
    
    if (coffeeCount > 5 && coffeeCount > expenses.length * 0.3) return personalities[2];
    if (shopAmount > totalSpent * 0.4) return personalities[1];
    if (foodAmount > totalSpent * 0.35) return personalities[4];
    if (beautyAmount > totalSpent * 0.3) return personalities[5];
    if (totalSpent < 5000 && expenses.length > 5) return personalities[6];
    if (totalSpent < 3000) return personalities[3];
    
    return personalities[0];
}

const CATEGORY_ICONS = {
    Food: '🍜',
    Shopping: '🛍️',
    Coffee: '☕',
    Beauty: '💄',
    Transport: '🚗',
    Bills: '📋',
    Entertainment: '🎮',
    Other: '📦'
};

const CATEGORIES = ['Food', 'Shopping', 'Coffee', 'Beauty', 'Transport', 'Bills', 'Entertainment', 'Other'];

// ──────────────────────────────────────────────
// DARK MODE
// ──────────────────────────────────────────────

let darkMode = localStorage.getItem('darkMode') === 'true';

function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    applyDarkMode();
}

function applyDarkMode() {
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️ Light Mode';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('darkModeToggle').textContent = '🌙 Dark Mode';
    }
}

// ──────────────────────────────────────────────
// EXPORT FUNCTIONS
// ──────────────────────────────────────────────

function exportToCSV() {
    const expenses = getExpenses();
    if (expenses.length === 0) {
        alert('No expenses to export! Add some expenses first. 💸');
        return;
    }
    
    const filtered = getFilteredExpenses();
    
    let csv = 'Date,Category,Description,Amount\n';
    filtered.forEach(e => {
        const date = new Date(e.date).toLocaleDateString('en-US');
        csv += `"${date}","${e.category}","${e.description}","${e.amount}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ CSV exported successfully!');
}

function exportToPDF() {
    const expenses = getExpenses();
    if (expenses.length === 0) {
        alert('No expenses to export! Add some expenses first. 💸');
        return;
    }
    
    const filtered = getFilteredExpenses();
    const total = getTotal(filtered);
    
    let html = `
        <html>
        <head>
            <title>Expense Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #5a3f3a; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #5a3f3a; color: white; padding: 10px; text-align: left; }
                td { padding: 8px; border-bottom: 1px solid #ddd; }
                .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>📊 Where Did My Money Go? - Expense Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>User: ${currentUser}</p>
            <p>Total Expenses: ${filtered.length}</p>
            <p class="total">Total Amount: ${formatPeso(total)}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(e => `
                        <tr>
                            <td>${new Date(e.date).toLocaleDateString('en-US')}</td>
                            <td>${CATEGORY_ICONS[e.category] || ''} ${e.category}</td>
                            <td>${e.description}</td>
                            <td>${formatPeso(e.amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="margin-top: 30px; color: #888; font-size: 12px;">
                Generated by Where Did My Money Go? 💅
            </div>
        </body>
        </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_report_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✅ PDF/HTML report exported successfully!');
}

// ──────────────────────────────────────────────
// DATE FILTER
// ──────────────────────────────────────────────

let currentFilter = 'all';
let customStart = null;
let customEnd = null;

function getFilteredExpenses() {
    const expenses = getExpenses();
    
    switch(currentFilter) {
        case 'week':
            return filterExpensesByDate(expenses, getWeekRange().start, getWeekRange().end);
        case 'month':
            return filterExpensesByDate(expenses, getMonthRange().start, getMonthRange().end);
        case 'custom':
            if (customStart && customEnd) {
                return filterExpensesByDate(expenses, customStart, customEnd);
            }
            return expenses;
        default:
            return expenses;
    }
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.filter-btn[data-filter="${filter}"]`)?.classList.add('active');
    
    const customRange = document.getElementById('customDateRange');
    if (filter === 'custom') {
        customRange.style.display = 'flex';
    } else {
        customRange.style.display = 'none';
    }
    
    let label = 'All Time';
    if (filter === 'week') label = 'This Week';
    else if (filter === 'month') label = 'This Month';
    else if (filter === 'custom') label = 'Custom Range';
    document.getElementById('filterLabel').textContent = label;
    document.getElementById('filterSub').textContent = label.toLowerCase();
    
    renderDashboard();
    renderRecent();
    renderInvestigate();
}

function applyCustomDateRange() {
    const start = document.getElementById('customStartDate').value;
    const end = document.getElementById('customEndDate').value;
    
    if (!start || !end) {
        alert('Please select both start and end dates.');
        return;
    }
    
    customStart = new Date(start);
    customEnd = new Date(end);
    customEnd.setDate(customEnd.getDate() + 1);
    
    setFilter('custom');
}

// ──────────────────────────────────────────────
// USER MANAGEMENT
// ──────────────────────────────────────────────

let currentUser = null;

function getUsers() {
    const data = localStorage.getItem('moneyTrackerUsers');
    return data ? JSON.parse(data) : {};
}

function saveUsers(users) {
    localStorage.setItem('moneyTrackerUsers', JSON.stringify(users));
}

function getUserData(username) {
    const data = localStorage.getItem('moneyTrackerData_' + username);
    return data ? JSON.parse(data) : { expenses: [], wishlist: [], goals: [] };
}

function saveUserData(username, data) {
    localStorage.setItem('moneyTrackerData_' + username, JSON.stringify(data));
}

function loginUser(username, password) {
    const users = getUsers();
    if (users[username] && users[username].password === password) {
        currentUser = username;
        localStorage.setItem('moneyTrackerCurrentUser', username);
        return true;
    }
    return false;
}

function registerUser(username, password, displayName) {
    const users = getUsers();
    if (users[username]) {
        return false;
    }
    users[username] = { password, displayName: displayName || username };
    saveUsers(users);
    saveUserData(username, { expenses: [], wishlist: [], goals: [] });
    return true;
}

function resetPassword(username, newPassword) {
    const users = getUsers();
    if (!users[username]) {
        return false;
    }
    users[username].password = newPassword;
    saveUsers(users);
    return true;
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('moneyTrackerCurrentUser');
}

function checkLoggedInUser() {
    const username = localStorage.getItem('moneyTrackerCurrentUser');
    if (username) {
        const users = getUsers();
        if (users[username]) {
            currentUser = username;
            return true;
        }
    }
    return false;
}

// ──────────────────────────────────────────────
// DATA ACCESS FUNCTIONS
// ──────────────────────────────────────────────

function getExpenses() {
    if (!currentUser) return [];
    const data = getUserData(currentUser);
    return data.expenses || [];
}

function getWishlist() {
    if (!currentUser) return [];
    const data = getUserData(currentUser);
    return data.wishlist || [];
}

function getGoals() {
    if (!currentUser) return [];
    const data = getUserData(currentUser);
    return data.goals || [];
}

function saveExpenses(expenses) {
    if (!currentUser) return;
    const data = getUserData(currentUser);
    data.expenses = expenses;
    saveUserData(currentUser, data);
}

function saveWishlist(wishlist) {
    if (!currentUser) return;
    const data = getUserData(currentUser);
    data.wishlist = wishlist;
    saveUserData(currentUser, data);
}

function saveGoals(goals) {
    if (!currentUser) return;
    const data = getUserData(currentUser);
    data.goals = goals;
    saveUserData(currentUser, data);
}

// ──────────────────────────────────────────────
// CRUD OPERATIONS - WITH DEBUG
// ──────────────────────────────────────────────

function addExpense(amount, category, description) {
    const expenses = getExpenses();
    const expense = {
        id: Date.now() + Math.random() * 1000,
        amount: parseFloat(amount),
        category: category.trim(),
        description: description || 'Unnamed expense',
        date: new Date().toISOString()
    };
    
    // DEBUG: Log what we're adding
    console.log('➕ ADDING EXPENSE:', expense);
    console.log('📂 CATEGORY:', category);
    console.log('💰 AMOUNT:', amount);
    
    expenses.push(expense);
    saveExpenses(expenses);
    
    // DEBUG: Verify save
    const saved = getExpenses();
    console.log('💾 SAVED EXPENSES COUNT:', saved.length);
    console.log('🛍️ SHOPPING TOTAL:', formatPeso(getCategoryTotal(saved, 'Shopping')));
    console.log('📊 ALL CATEGORY TOTALS:');
    CATEGORIES.forEach(c => {
        const total = getCategoryTotal(saved, c);
        if (total > 0) {
            console.log(`   ${c}: ${formatPeso(total)}`);
        }
    });
    console.log('📋 ALL EXPENSES:', saved);
    
    return expense;
}

function editExpense(id, amount, category, description) {
    const expenses = getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    expenses[index].amount = parseFloat(amount);
    expenses[index].category = category.trim();
    expenses[index].description = description || 'Unnamed expense';
    saveExpenses(expenses);
    return true;
}

function deleteExpense(id) {
    const expenses = getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    expenses.splice(index, 1);
    saveExpenses(expenses);
    return true;
}

function addWishlistItem(name, price) {
    const wishlist = getWishlist();
    const item = {
        name: name,
        price: price,
        added: new Date().toISOString()
    };
    wishlist.push(item);
    saveWishlist(wishlist);
    return item;
}

function removeWishlistItem(index) {
    const wishlist = getWishlist();
    if (index >= 0 && index < wishlist.length) {
        wishlist.splice(index, 1);
        saveWishlist(wishlist);
    }
}

function addGoal(name, target) {
    const goals = getGoals();
    const goal = {
        name: name,
        target: target,
        saved: 0
    };
    goals.push(goal);
    saveGoals(goals);
    return goal;
}

function addGoalSavings(index, amount) {
    const goals = getGoals();
    if (index >= 0 && index < goals.length && amount > 0) {
        goals[index].saved += amount;
        saveGoals(goals);
    }
}

function resetAllData() {
    if (!currentUser) return;
    
    const confirmReset = confirm(
        '⚠️ ARE YOU SURE BESTIE?! ⚠️\n\n' +
        'This will DELETE ALL your:\n' +
        '• Expenses 💸\n' +
        '• Wishlist items 🛍️\n' +
        '• Savings goals 🎯\n\n' +
        'There\'s NO UNDO! 😭\n\n' +
        'Click OK to reset everything.'
    );
    
    if (!confirmReset) return;
    
    saveUserData(currentUser, { expenses: [], wishlist: [], goals: [] });
    renderAll();
    alert('✨ All data cleared! Start fresh with ZERO expenses! 🎀');
}

// ──────────────────────────────────────────────
// UI RENDER FUNCTIONS - FIXED
// ──────────────────────────────────────────────

function renderDashboard() {
    const expenses = getFilteredExpenses();
    const allExpenses = getExpenses();
    const weekExp = filterExpensesByDate(allExpenses, getWeekRange().start, getWeekRange().end);
    
    // DEBUG: Log all expenses
    console.log('📊 RENDER DASHBOARD - Filtered expenses:', expenses);
    console.log('📊 RENDER DASHBOARD - All expenses:', allExpenses);
    
    const totalAll = getTotal(expenses);
    const dashTotal = document.getElementById('dashTotal');
    if (dashTotal) dashTotal.textContent = formatPeso(totalAll);
    
    // FIX: Use filtered expenses for category totals
    const cats = ['Food', 'Shopping', 'Coffee'];
    cats.forEach(c => {
        const el = document.getElementById('dash' + c);
        if (el) {
            const total = getCategoryTotal(expenses, c);
            el.textContent = formatPeso(total);
            console.log(`📊 ${c} card total: ${formatPeso(total)}`);
        }
    });

    const totalWeek = getTotal(weekExp);
    const prevWeek = filterExpensesByDate(
        allExpenses, 
        new Date(getWeekRange().start.getTime() - 7 * 86400000),
        getWeekRange().start
    );
    const prevTotal = getTotal(prevWeek);
    let pct = 0;
    if (prevTotal > 0) pct = ((totalWeek - prevTotal) / prevTotal * 100);
    
    const badge = document.getElementById('meterBadge');
    const msg = document.getElementById('meterMsg');
    
    if (totalWeek === 0 && prevTotal === 0) {
        if (badge) badge.textContent = '✨';
        if (msg) msg.textContent = 'No spending yet this week!';
    } else if (pct > 0) {
        if (badge) badge.textContent = '+' + Math.round(pct) + '%';
        if (msg) msg.textContent = 'Your spending increased compared to last week. 😭';
    } else {
        if (badge) badge.textContent = Math.round(pct) + '%';
        if (msg) msg.textContent = 'You spent less than last week! 👏';
    }

    const container = document.getElementById('barContainer');
    if (container) {
        const maxVal = Math.max(1, ...CATEGORIES.map(c => getCategoryTotal(expenses, c)));
        let html = '';
        CATEGORIES.forEach(c => {
            const val = getCategoryTotal(expenses, c);
            const pctW = (val / maxVal * 100);
            html += `
                <div class="bar-item">
                    <span class="cat-icon">${CATEGORY_ICONS[c] || '📦'}</span>
                    <span class="cat-name">${c}</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${pctW}%;"></div></div>
                    <span class="bar-amount">${formatPeso(val)}</span>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    const count = expenses.length;
    const top = getTopCategory(expenses, CATEGORIES);
    const insightText = document.getElementById('insightText');
    if (insightText) {
        insightText.innerHTML = `
            You have <span class="em">${count}</span> purchases in this period.
            ${count > 0 ? `Your biggest spending category is <span class="em">${top.category}</span> — ${formatPeso(top.amount)}.` : 'Start tracking your spending!'}
            ${count > 10 ? ' You\'ve been tracking consistently! 🌟' : ''}
            ${count > 20 ? ' Girl… that\'s a lot of transactions! 🛍️' : ''}
        `;
    }
}

function renderRecent() {
    const expenses = getFilteredExpenses();
    const container = document.getElementById('recentList');
    const recent = [...expenses].reverse().slice(0, 10);
    
    if (!container) return;
    
    if (recent.length === 0) {
        container.innerHTML = '<div style="color:#8a6f66;font-size:14px;">No expenses in this period. Add one above! ✨</div>';
        return;
    }
    
    let html = '<div style="display:flex;flex-direction:column;gap:6px;margin-top:6px;">';
    recent.forEach(e => {
        const dateDisplay = new Date(e.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        html += `
            <div style="display:flex;justify-content:space-between;align-items:center;background:#faf3ef;padding:8px 16px;border-radius:16px;font-size:14px;border:1px solid #f0e4dc;">
                <div style="display:flex;align-items:center;gap:8px;flex:1;">
                    <span>${CATEGORY_ICONS[e.category] || '📦'}</span>
                    <span style="font-weight:500;">${e.description}</span>
                    <span style="color:#8a6f66;font-size:12px;">${dateDisplay}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-weight:700;">${formatPeso(e.amount)}</span>
                    <button onclick="editExpenseUI(${e.id})" style="background:#ede3db;border:none;padding:2px 10px;border-radius:12px;cursor:pointer;font-size:12px;">
                        ✏️
                    </button>
                    <button onclick="deleteExpenseUI(${e.id})" style="background:#ffebee;border:none;padding:2px 10px;border-radius:12px;cursor:pointer;font-size:12px;color:#c62828;">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function renderInvestigate() {
    const expenses = getFilteredExpenses();
    
    const count = expenses.length;
    const top = getTopCategory(expenses, CATEGORIES);

    const investText = document.getElementById('investText');
    if (investText) {
        investText.innerHTML = `
            You made <span class="em">${count}</span> purchases in this period.
            ${count > 0 ? `Your biggest spending category was <span class="em">${top.category}</span>.` : 'Add some expenses to investigate!'}
            ${count > 0 && top.category === 'Food' ? ' Girl… you ate your budget. 🍜😭' : ''}
            ${count > 0 && top.category === 'Shopping' ? ' "Add to cart" era is real! 💀' : ''}
        `;
    }

    const shopTotal = getCategoryTotal(expenses, 'Shopping');
    const shopCount = getCategoryCount(expenses, 'Shopping');
    const investShop = document.getElementById('investShop');
    if (investShop) {
        investShop.textContent = shopTotal > 0 ?
            `You spent ${formatPeso(shopTotal)} on shopping. ${shopCount > 3 ? 'You were in your "add to cart" era. 💀' : 'Not too bad!'}` :
            'No shopping data yet.';
    }

    const coffeeTotal = getCategoryTotal(expenses, 'Coffee');
    const coffeeCount = getCategoryCount(expenses, 'Coffee');
    const investCoffee = document.getElementById('investCoffee');
    if (investCoffee) {
        investCoffee.textContent = coffeeTotal > 0 ?
            `You bought coffee ${coffeeCount} times. Estimated total: ${formatPeso(coffeeTotal)}. That's approximately ₱${Math.round(coffeeTotal / Math.max(1, coffeeCount))}/day.` :
            'No coffee data yet.';
    }
}

function renderWishlist() {
    const grid = document.getElementById('wishlistGrid');
    const items = getWishlist();
    
    if (!grid) return;
    
    if (items.length === 0) {
        grid.innerHTML = '<div style="color:#8a6f66;font-size:14px;padding:20px 0;">Your wishlist is empty. Start dreaming! 🛍️</div>';
        return;
    }
    
    let html = '';
    items.forEach((item, idx) => {
        const days = daysSince(item.added);
        html += `
            <div class="wish-card">
                <div class="title">${item.name}</div>
                <div class="price">${formatPeso(item.price)}</div>
                <div class="meta">Added ${days} days ago</div>
                <div class="actions">
                    <button onclick="removeWish(${idx})" class="danger">Remove</button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function renderGoals() {
    const container = document.getElementById('goalContainer');
    const items = getGoals();
    
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<div style="color:#8a6f66;font-size:14px;padding:20px 0;">No goals yet. Start saving! 🎯</div>';
        return;
    }
    
    let html = '';
    items.forEach((g, idx) => {
        const pct = Math.min(100, (g.saved / g.target) * 100);
        const weeks = Math.ceil((g.target - g.saved) / 1500);
        const remaining = g.target - g.saved;
        html += `
            <div class="goal-progress">
                <div class="flex-between">
                    <span class="goal-title">${g.name}</span>
                    <span class="tag">Active</span>
                </div>
                <div class="goal-track"><div class="goal-fill" style="width:${pct}%;"></div></div>
                <div class="goal-stats">
                    <span>${formatPeso(g.saved)} saved</span>
                    <span>Target: ${formatPeso(g.target)}</span>
                </div>
                <div style="margin-top:8px;font-size:14px;color:#8a6f66;">
                    <i class="fas fa-clock"></i> 
                    ${remaining > 0 
                        ? `If you save ₱1,500/week, you'll reach your goal in approximately <strong>${weeks} weeks</strong>. 🎀`
                        : '🎉 You reached your goal! Amazing!'}
                </div>
                <div style="margin-top:8px;">
                    <button onclick="addGoalSavingsWrapper(${idx})" style="background:#ede3db;border:none;padding:4px 16px;border-radius:30px;font-weight:600;cursor:pointer;">
                        + Add Savings
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderWrapped() {
    const expenses = getExpenses();
    const monthExp = filterExpensesByDate(expenses, getMonthRange().start, getMonthRange().end);
    const total = getTotal(monthExp);
    
    const wrappedTotal = document.getElementById('wrappedTotal');
    if (wrappedTotal) wrappedTotal.textContent = formatPeso(total || 0);

    const top = getTopCategory(monthExp, CATEGORIES);
    const wrappedTopCat = document.getElementById('wrappedTopCat');
    if (wrappedTopCat) {
        wrappedTopCat.textContent = top.amount > 0 ? `${top.category} — ${formatPeso(top.amount)}` : 'No data yet';
    }

    const dayData = getMostExpensiveDay(monthExp);
    const wrappedDay = document.getElementById('wrappedDay');
    if (wrappedDay) {
        wrappedDay.textContent = dayData.amount > 0 ? `${dayData.day} — ${formatPeso(dayData.amount)} 😭` : 'No data yet';
    }

    const freq = getMostFrequentCategory(monthExp);
    const wrappedFreq = document.getElementById('wrappedFreq');
    if (wrappedFreq) {
        wrappedFreq.textContent = freq.count > 0 ? `${freq.category} — ${freq.count} times` : 'No data yet';
    }

    const personality = getFinancialPersonality(monthExp, total, top);
    const wrappedPersonality = document.getElementById('wrappedPersonality');
    if (wrappedPersonality) {
        wrappedPersonality.innerHTML = `<strong>${personality.name}</strong><br />${personality.desc}`;
    }
}

function renderAll() {
    if (!currentUser) return;
    renderDashboard();
    renderRecent();
    renderInvestigate();
    renderWishlist();
    renderGoals();
    renderWrapped();
}

// ──────────────────────────────────────────────
// EDIT/DELETE UI FUNCTIONS
// ──────────────────────────────────────────────

function showEditModal(expense) {
    const existingModal = document.getElementById('editModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 24px;
            padding: 32px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            position: relative;
        ">
            <h3 style="margin-top:0;color:#5a3f3a;">✏️ Edit Expense</h3>
            
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:14px;color:#7a5f5a;margin-bottom:4px;">Description</label>
                <input id="editDesc" type="text" value="${expense.description}" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;">
            </div>
            
            <div style="margin-bottom:16px;">
                <label style="display:block;font-size:14px;color:#7a5f5a;margin-bottom:4px;">Amount (₱)</label>
                <input id="editAmount" type="number" step="0.01" value="${expense.amount}" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;">
            </div>
            
            <div style="margin-bottom:20px;">
                <label style="display:block;font-size:14px;color:#7a5f5a;margin-bottom:4px;">Category</label>
                <select id="editCategory" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;">
                    ${CATEGORIES.map(c => `
                        <option value="${c}" ${c === expense.category ? 'selected' : ''}>
                            ${CATEGORY_ICONS[c] || '📦'} ${c}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button onclick="closeEditModal()" style="background:#ede3db;border:none;padding:8px 20px;border-radius:20px;cursor:pointer;font-weight:600;font-size:14px;">
                    Cancel
                </button>
                <button onclick="saveEditExpense(${expense.id})" style="background:#5a3f3a;color:white;border:none;padding:8px 20px;border-radius:20px;cursor:pointer;font-weight:600;font-size:14px;">
                    Save Changes 💾
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeEditModal();
    });
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.remove();
}

window.editExpenseUI = function(id) {
    const expenses = getExpenses();
    const expense = expenses.find(e => e.id === id);
    if (!expense) {
        alert('Expense not found!');
        return;
    }
    showEditModal(expense);
};

window.saveEditExpense = function(id) {
    const desc = document.getElementById('editDesc');
    const amount = document.getElementById('editAmount');
    const category = document.getElementById('editCategory');
    
    if (!desc || !amount || !category) {
        alert('Error: Could not find form fields.');
        return;
    }
    
    const descVal = desc.value.trim();
    const amountVal = parseFloat(amount.value);
    const categoryVal = category.value;
    
    if (!amountVal || amountVal <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    
    if (!descVal) {
        alert('Please enter a description.');
        return;
    }
    
    if (editExpense(id, amountVal, categoryVal, descVal)) {
        closeEditModal();
        renderAll();
        alert('✅ Expense updated successfully!');
    } else {
        alert('❌ Error updating expense.');
    }
};

window.deleteExpenseUI = function(id) {
    const expenses = getExpenses();
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;
    
    if (confirm(
        `🗑️ Delete this expense?\n\n` +
        `${CATEGORY_ICONS[expense.category] || '📦'} ${expense.description}\n` +
        `${formatPeso(expense.amount)}\n\n` +
        `This cannot be undone!`
    )) {
        if (deleteExpense(id)) {
            renderAll();
            alert('🗑️ Expense deleted.');
        }
    }
};

// ──────────────────────────────────────────────
// APP NAVIGATION
// ──────────────────────────────────────────────

function showApp() {
    const landingPage = document.getElementById('landingPage');
    const app = document.getElementById('app');
    if (landingPage) landingPage.style.display = 'none';
    if (app) app.style.display = 'flex';
    
    const users = getUsers();
    const userInfo = users[currentUser];
    const displayName = document.getElementById('userDisplayName');
    const avatar = document.getElementById('userAvatar');
    if (displayName) displayName.textContent = userInfo.displayName || currentUser;
    if (avatar) avatar.textContent = (userInfo.displayName || currentUser)[0].toUpperCase();
    
    applyDarkMode();
    renderAll();
}

function showLanding() {
    const landingPage = document.getElementById('landingPage');
    const app = document.getElementById('app');
    if (landingPage) landingPage.style.display = 'flex';
    if (app) app.style.display = 'none';
}

// ──────────────────────────────────────────────
// MOBILE HAMBURGER MENU
// ──────────────────────────────────────────────

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
    document.body.style.overflow = sidebar?.classList.contains('open') ? 'hidden' : '';
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ──────────────────────────────────────────────
// EVENT LISTENERS - FIXED WITH DEBUG
// ──────────────────────────────────────────────

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎀 App initializing...');
    
    // Hamburger menu
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar);
    }

    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar when clicking a link (mobile)
    document.querySelectorAll('.sidebar a, .sidebar .export-btn, .sidebar .reset-link').forEach(el => {
        el.addEventListener('click', function() {
            if (window.innerWidth <= 820) {
                closeSidebar();
            }
        });
    });

    // Navigation
    document.querySelectorAll('.sidebar a[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.sidebar a[data-page]').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            const page = this.dataset.page;
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const target = document.getElementById('page-' + page);
            if (target) target.classList.add('active');
        });
    });

    // Dark Mode
    const darkModeBtn = document.getElementById('darkModeToggle');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', toggleDarkMode);
    }

    // Export Buttons
    const exportCSV = document.getElementById('exportCSV');
    if (exportCSV) exportCSV.addEventListener('click', exportToCSV);
    
    const exportPDF = document.getElementById('exportPDF');
    if (exportPDF) exportPDF.addEventListener('click', exportToPDF);

    // Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setFilter(this.dataset.filter);
        });
    });

    const applyCustom = document.getElementById('applyCustomDate');
    if (applyCustom) {
        applyCustom.addEventListener('click', applyCustomDateRange);
    }

    // Reset Button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetAllData();
        });
    }

    // Login
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            const username = document.getElementById('loginUsername');
            const password = document.getElementById('loginPassword');
            
            if (!username || !password) {
                alert('Please enter both username and password.');
                return;
            }
            
            const userVal = username.value.trim();
            const passVal = password.value.trim();
            
            if (!userVal || !passVal) {
                alert('Please enter both username and password.');
                return;
            }
            
            if (loginUser(userVal, passVal)) {
                showApp();
            } else {
                alert('❌ Invalid username or password!');
            }
        });
    }

    // Register
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            const username = document.getElementById('registerUsername');
            const password = document.getElementById('registerPassword');
            const displayName = document.getElementById('registerDisplayName');
            
            if (!username || !password) {
                alert('Please enter both username and password.');
                return;
            }
            
            const userVal = username.value.trim();
            const passVal = password.value.trim();
            const displayVal = displayName ? displayName.value.trim() : userVal;
            
            if (!userVal || !passVal) {
                alert('Please enter both username and password.');
                return;
            }
            
            if (userVal.length < 3) {
                alert('Username must be at least 3 characters long.');
                return;
            }
            
            if (passVal.length < 4) {
                alert('Password must be at least 4 characters long.');
                return;
            }
            
            if (registerUser(userVal, passVal, displayVal)) {
                alert('✨ Account created successfully! You can now log in with ZERO expenses to start fresh! 🎀');
                const registerForm = document.getElementById('registerForm');
                const loginForm = document.getElementById('loginForm');
                const loginUsername = document.getElementById('loginUsername');
                const loginPassword = document.getElementById('loginPassword');
                if (registerForm) registerForm.style.display = 'none';
                if (loginForm) loginForm.style.display = 'block';
                if (loginUsername) loginUsername.value = userVal;
                if (loginPassword) loginPassword.value = '';
            } else {
                alert('❌ Username already exists! Please choose another one.');
            }
        });
    }

    // Switch between login, register, and forgot password
    const showRegister = document.getElementById('showRegister');
    if (showRegister) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            const forgotForm = document.getElementById('forgotPasswordForm');
            if (loginForm) loginForm.style.display = 'none';
            if (forgotForm) forgotForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
        });
    }

    const showLogin = document.getElementById('showLogin');
    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            const registerForm = document.getElementById('registerForm');
            const loginForm = document.getElementById('loginForm');
            const forgotForm = document.getElementById('forgotPasswordForm');
            if (registerForm) registerForm.style.display = 'none';
            if (forgotForm) forgotForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
        });
    }

    const showForgotPassword = document.getElementById('showForgotPassword');
    if (showForgotPassword) {
        showForgotPassword.addEventListener('click', function(e) {
            e.preventDefault();
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            const forgotForm = document.getElementById('forgotPasswordForm');
            const forgotUsername = document.getElementById('forgotUsername');
            const loginUsername = document.getElementById('loginUsername');
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'none';
            if (forgotForm) forgotForm.style.display = 'block';
            if (forgotUsername && loginUsername && loginUsername.value.trim()) {
                forgotUsername.value = loginUsername.value.trim();
            }
        });
    }

    const backToLogin = document.getElementById('backToLogin');
    if (backToLogin) {
        backToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            const forgotForm = document.getElementById('forgotPasswordForm');
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            if (forgotForm) forgotForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
        });
    }

    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', function() {
            const username = document.getElementById('forgotUsername');
            const newPassword = document.getElementById('forgotPassword');
            const confirmPassword = document.getElementById('forgotConfirmPassword');

            if (!username || !newPassword || !confirmPassword) {
                alert('Please fill in all reset fields.');
                return;
            }

            const userVal = username.value.trim();
            const passVal = newPassword.value.trim();
            const confirmVal = confirmPassword.value.trim();

            if (!userVal || !passVal || !confirmVal) {
                alert('Please enter your username and a new password.');
                return;
            }

            if (passVal.length < 4) {
                alert('Password must be at least 4 characters long.');
                return;
            }

            if (passVal !== confirmVal) {
                alert('Passwords do not match. Please try again.');
                return;
            }

            if (!resetPassword(userVal, passVal)) {
                alert('❌ Username not found. Please check your username or create a new account.');
                return;
            }

            alert('✅ Password reset successfully! You can now log in with your new password.');
            const forgotForm = document.getElementById('forgotPasswordForm');
            const loginForm = document.getElementById('loginForm');
            const loginUsername = document.getElementById('loginUsername');
            const loginPassword = document.getElementById('loginPassword');
            if (forgotForm) forgotForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
            if (loginUsername) loginUsername.value = userVal;
            if (loginPassword) loginPassword.value = '';
            if (username) username.value = '';
            if (newPassword) newPassword.value = '';
            if (confirmPassword) confirmPassword.value = '';
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logoutUser();
            showLanding();
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            if (loginForm) loginForm.style.display = 'block';
            if (registerForm) registerForm.style.display = 'none';
        });
    }

    // Add Expense - FIXED WITH DEBUG
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            const amountInput = document.getElementById('addAmount');
            const categoryInput = document.querySelector('input[name="cat"]:checked');
            const descInput = document.getElementById('addDesc');
            
            if (!amountInput) {
                alert('Error: Amount input not found.');
                return;
            }
            
            const amount = parseFloat(amountInput.value);
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount.');
                return;
            }
            
            if (!categoryInput) {
                alert('Please select a category.');
                return;
            }
            
            const desc = descInput ? descInput.value.trim() : 'Unnamed expense';
            const category = categoryInput.value;
            
            console.log('🔄 ADDING EXPENSE - Category:', category);
            console.log('🔄 ADDING EXPENSE - Amount:', amount);
            console.log('🔄 ADDING EXPENSE - Description:', desc);
            
            // Add the expense
            addExpense(amount, category, desc);
            
            // Clear inputs
            if (amountInput) amountInput.value = '';
            if (descInput) descInput.value = '';
            
            // Force refresh
            renderAll();
            
            // Verify
            const allExpenses = getExpenses();
            console.log('📊 VERIFY - Total expenses:', allExpenses.length);
            console.log('📊 VERIFY - Shopping total:', formatPeso(getCategoryTotal(allExpenses, 'Shopping')));
            console.log('📊 VERIFY - All expenses:', allExpenses);
            
            alert(`✨ ${formatPeso(amount)} added to ${category}!`);
        });
    }

    // Wishlist
    const openWishBtn = document.getElementById('openWishForm');
    if (openWishBtn) {
        openWishBtn.addEventListener('click', function() {
            const form = document.getElementById('wishForm');
            if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
    }

    const cancelWish = document.getElementById('cancelWishBtn');
    if (cancelWish) {
        cancelWish.addEventListener('click', function() {
            const form = document.getElementById('wishForm');
            if (form) form.style.display = 'none';
        });
    }

    const saveWish = document.getElementById('saveWishBtn');
    if (saveWish) {
        saveWish.addEventListener('click', function() {
            const nameInput = document.getElementById('wishName');
            const priceInput = document.getElementById('wishPrice');
            
            if (!nameInput || !priceInput) return;
            
            const name = nameInput.value.trim();
            const price = parseFloat(priceInput.value);
            
            if (!name || !price || price <= 0) {
                alert('Please enter a valid item and price.');
                return;
            }
            
            addWishlistItem(name, price);
            nameInput.value = '';
            priceInput.value = '';
            const form = document.getElementById('wishForm');
            if (form) form.style.display = 'none';
            renderWishlist();
        });
    }

    window.removeWish = function(index) {
        removeWishlistItem(index);
        renderWishlist();
    };

    // Goals
    const addGoalBtn = document.getElementById('addGoalBtn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', function() {
            const nameInput = document.getElementById('goalName');
            const targetInput = document.getElementById('goalTarget');
            
            if (!nameInput || !targetInput) return;
            
            const name = nameInput.value.trim();
            const target = parseFloat(targetInput.value);
            
            if (!name || !target || target <= 0) {
                alert('Please enter a valid goal.');
                return;
            }
            
            addGoal(name, target);
            nameInput.value = '';
            targetInput.value = '';
            renderGoals();
        });
    }

    window.addGoalSavingsWrapper = function(index) {
        const amt = prompt('How much did you save? (₱)');
        if (amt) {
            const val = parseFloat(amt);
            if (val > 0) {
                addGoalSavings(index, val);
                renderGoals();
            }
        }
    };

    // Girl Math
    const gmCalcBtn = document.getElementById('gmCalcBtn');
    if (gmCalcBtn) {
        gmCalcBtn.addEventListener('click', function() {
            const itemInput = document.getElementById('gmItem');
            const priceInput = document.getElementById('gmPrice');
            const usesInput = document.getElementById('gmUses');
            
            if (!itemInput || !priceInput || !usesInput) return;
            
            const item = itemInput.value.trim() || 'Item';
            const price = parseFloat(priceInput.value);
            const uses = parseInt(usesInput.value);
            
            if (!price || price <= 0 || !uses || uses <= 0) {
                alert('Please enter valid numbers.');
                return;
            }
            
            const perUse = price / uses;
            const resultBox = document.getElementById('gmResult');
            const gmDetail = document.getElementById('gmDetail');
            const gmVerdict = document.getElementById('gmVerdict');
            
            if (resultBox) resultBox.style.display = 'block';
            if (gmDetail) {
                gmDetail.textContent = `${item} — ${formatPeso(price)} ÷ ${uses} wears = ${formatPeso(perUse)} per wear.`;
            }
            if (gmVerdict) {
                gmVerdict.textContent = perUse < 100 ? 'APPROVED. 💅' : 'Hmm... think about it. 🤔';
            }
        });
    }

    // Enter key support
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) {
        loginPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const btn = document.getElementById('loginBtn');
                if (btn) btn.click();
            }
        });
    }

    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
        registerPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const btn = document.getElementById('registerBtn');
                if (btn) btn.click();
            }
        });
    }

    const forgotPasswordInput = document.getElementById('forgotPassword');
    if (forgotPasswordInput) {
        forgotPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const btn = document.getElementById('forgotPasswordBtn');
                if (btn) btn.click();
            }
        });
    }

    // Keyboard shortcuts for edit modal
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('editModal');
        if (modal) {
            if (e.key === 'Escape') closeEditModal();
            if (e.key === 'Enter') {
                const saveBtn = modal.querySelector('[onclick^="saveEditExpense"]');
                if (saveBtn) saveBtn.click();
            }
        }
    });

    // ──────────────────────────────────────────────
    // INIT - Check if user is already logged in
    // ──────────────────────────────────────────────
    
    if (checkLoggedInUser()) {
        showApp();
    } else {
        showLanding();
    }

    console.log('🎀 Where Did My Money Go? is ready!');
    console.log('✅ Dashboard shows ALL expenses');
    console.log('✅ Edit and Delete buttons added');
    console.log('✅ Date Filter: All, Week, Month, Custom');
    console.log('✅ Export: CSV, PDF Report');
    console.log('✅ Dark Mode toggle available');
    console.log('✅ Mobile hamburger menu');
    console.log('💡 New users start with ZERO expenses!');
});

// ──────────────────────────────────────────────
// HELPER: DEBUG FUNCTION
// ──────────────────────────────────────────────

function debugData() {
    console.log('🔍 === DEBUG DATA ===');
    const expenses = getExpenses();
    console.log('Total expenses:', expenses.length);
    expenses.forEach((e, i) => {
        console.log(`  ${i+1}. ${e.category}: ${formatPeso(e.amount)} - ${e.description} (${e.date})`);
    });
    console.log('🔍 === CATEGORY TOTALS ===');
    CATEGORIES.forEach(c => {
        const total = getCategoryTotal(expenses, c);
        if (total > 0) {
            console.log(`  ${c}: ${formatPeso(total)}`);
        }
    });
    console.log('🔍 === RAW DATA ===');
    console.log(JSON.stringify(expenses, null, 2));
    return expenses;
}

// Make debug function available globally
window.debug = debugData;