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
    return expenses.reduce((sum, e) => sum + e.amount, 0);
}

function getCategoryTotal(expenses, category) {
    return expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0);
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
// DATA ACCESS FUNCTIONS (with current user)
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
// CRUD OPERATIONS - WITH EDIT & DELETE
// ──────────────────────────────────────────────

function addExpense(amount, category, description) {
    const expenses = getExpenses();
    const expense = {
        id: Date.now() + Math.random() * 1000,
        amount: amount,
        category: category,
        description: description || 'Unnamed expense',
        date: new Date().toISOString()
    };
    expenses.push(expense);
    saveExpenses(expenses);
    return expense;
}

// EDIT: Update an existing expense
function editExpense(id, amount, category, description) {
    const expenses = getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    expenses[index].amount = amount;
    expenses[index].category = category;
    expenses[index].description = description || 'Unnamed expense';
    saveExpenses(expenses);
    return true;
}

// DELETE: Remove a specific expense
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
// UI RENDER FUNCTIONS - FIXED DASHBOARD
// ──────────────────────────────────────────────

function renderDashboard() {
    const expenses = getExpenses();
    const weekExp = filterExpensesByDate(expenses, getWeekRange().start, getWeekRange().end);
    
    // FIX: Show ALL expenses total, not just weekly
    const totalAll = getTotal(expenses);
    const totalWeek = getTotal(weekExp);
    
    // Display total expenses on dashboard
    document.getElementById('dashTotal').textContent = formatPeso(totalAll);
    
    // Show category totals for ALL time, not just week
    const cats = ['Food', 'Shopping', 'Coffee'];
    cats.forEach(c => {
        const el = document.getElementById('dash' + c);
        if (el) el.textContent = formatPeso(getCategoryTotal(expenses, c));
    });

    // Week-over-week comparison still uses weekly data
    const prevWeek = filterExpensesByDate(
        expenses, 
        new Date(getWeekRange().start.getTime() - 7 * 86400000),
        getWeekRange().start
    );
    const prevTotal = getTotal(prevWeek);
    let pct = 0;
    if (prevTotal > 0) pct = ((totalWeek - prevTotal) / prevTotal * 100);
    
    const badge = document.getElementById('meterBadge');
    const msg = document.getElementById('meterMsg');
    
    if (totalWeek === 0 && prevTotal === 0) {
        badge.textContent = '✨';
        msg.textContent = 'No spending yet this week!';
    } else if (pct > 0) {
        badge.textContent = '+' + Math.round(pct) + '%';
        msg.textContent = 'Your spending increased compared to last week. 😭';
    } else {
        badge.textContent = Math.round(pct) + '%';
        msg.textContent = 'You spent less than last week! 👏';
    }

    // Category bars show ALL time data
    const container = document.getElementById('barContainer');
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

    // Insights show ALL time data
    const count = expenses.length;
    const top = getTopCategory(expenses, CATEGORIES);
    document.getElementById('insightText').innerHTML = `
        You have <span class="em">${count}</span> total purchases recorded.
        ${count > 0 ? `Your biggest spending category is <span class="em">${top.category}</span> — ${formatPeso(top.amount)}.` : 'Start tracking your spending!'}
        ${count > 10 ? ' You\'ve been tracking consistently! 🌟' : ''}
        ${count > 20 ? ' Girl… that\'s a lot of transactions! 🛍️' : ''}
    `;
}

function renderRecent() {
    const expenses = getExpenses();
    const container = document.getElementById('recentList');
    // Show ALL expenses, sorted by most recent
    const recent = [...expenses].reverse().slice(0, 10);
    
    if (recent.length === 0) {
        container.innerHTML = '<div style="color:#8a6f66;font-size:14px;">No expenses yet. Add one above! ✨</div>';
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
    const expenses = getExpenses();
    const monthExp = filterExpensesByDate(expenses, getMonthRange().start, getMonthRange().end);
    
    // Show monthly data for investigate
    const count = monthExp.length;
    const top = getTopCategory(monthExp, CATEGORIES);

    document.getElementById('investText').innerHTML = `
        You made <span class="em">${count}</span> purchases this month.
        ${count > 0 ? `Your biggest spending category was <span class="em">${top.category}</span>.` : 'Add some expenses to investigate!'}
        ${count > 0 && top.category === 'Food' ? ' Girl… you ate your budget. 🍜😭' : ''}
        ${count > 0 && top.category === 'Shopping' ? ' "Add to cart" era is real! 💀' : ''}
    `;

    const shopTotal = getCategoryTotal(monthExp, 'Shopping');
    const shopCount = getCategoryCount(monthExp, 'Shopping');
    document.getElementById('investShop').textContent = shopTotal > 0 ?
        `You spent ${formatPeso(shopTotal)} on shopping this month. ${shopCount > 3 ? 'You were in your "add to cart" era. 💀' : 'Not too bad!'}` :
        'No shopping data yet.';

    const coffeeTotal = getCategoryTotal(monthExp, 'Coffee');
    const coffeeCount = getCategoryCount(monthExp, 'Coffee');
    document.getElementById('investCoffee').textContent = coffeeTotal > 0 ?
        `You bought coffee ${coffeeCount} times this month. Estimated total: ${formatPeso(coffeeTotal)}. That's approximately ₱${Math.round(coffeeTotal / Math.max(1, coffeeCount))}/day.` :
        'No coffee data yet.';
}

function renderWishlist() {
    const grid = document.getElementById('wishlistGrid');
    const items = getWishlist();
    
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
    
    document.getElementById('wrappedTotal').textContent = formatPeso(total || 0);

    const top = getTopCategory(monthExp, CATEGORIES);
    document.getElementById('wrappedTopCat').textContent = 
        top.amount > 0 ? `${top.category} — ${formatPeso(top.amount)}` : 'No data yet';

    const dayData = getMostExpensiveDay(monthExp);
    document.getElementById('wrappedDay').textContent = 
        dayData.amount > 0 ? `${dayData.day} — ${formatPeso(dayData.amount)} 😭` : 'No data yet';

    const freq = getMostFrequentCategory(monthExp);
    document.getElementById('wrappedFreq').textContent = 
        freq.count > 0 ? `${freq.category} — ${freq.count} times` : 'No data yet';

    const personality = getFinancialPersonality(monthExp, total, top);
    document.getElementById('wrappedPersonality').innerHTML = 
        `<strong>${personality.name}</strong><br />${personality.desc}`;
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

// Show modal for editing
function showEditModal(expense) {
    // Remove existing modal if any
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
    
    // Close modal when clicking outside
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
    const desc = document.getElementById('editDesc').value.trim();
    const amount = parseFloat(document.getElementById('editAmount').value);
    const category = document.getElementById('editCategory').value;
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    
    if (!desc) {
        alert('Please enter a description.');
        return;
    }
    
    if (editExpense(id, amount, category, desc)) {
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
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    
    const users = getUsers();
    const userInfo = users[currentUser];
    document.getElementById('userDisplayName').textContent = userInfo.displayName || currentUser;
    document.getElementById('userAvatar').textContent = (userInfo.displayName || currentUser)[0].toUpperCase();
    
    renderAll();
}

function showLanding() {
    document.getElementById('landingPage').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
}

// ──────────────────────────────────────────────
// EVENT LISTENERS
// ──────────────────────────────────────────────

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

// Reset Button
document.getElementById('resetBtn').addEventListener('click', function(e) {
    e.preventDefault();
    resetAllData();
});

// Login
document.getElementById('loginBtn').addEventListener('click', function() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }
    
    if (loginUser(username, password)) {
        showApp();
    } else {
        alert('❌ Invalid username or password!');
    }
});

// Register
document.getElementById('registerBtn').addEventListener('click', function() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const displayName = document.getElementById('registerDisplayName').value.trim() || username;
    
    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }
    
    if (username.length < 3) {
        alert('Username must be at least 3 characters long.');
        return;
    }
    
    if (password.length < 4) {
        alert('Password must be at least 4 characters long.');
        return;
    }
    
    if (registerUser(username, password, displayName)) {
        alert('✨ Account created successfully! You can now log in with ZERO expenses to start fresh! 🎀');
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('loginUsername').value = username;
        document.getElementById('loginPassword').value = '';
    } else {
        alert('❌ Username already exists! Please choose another one.');
    }
});

// Switch between login and register
document.getElementById('showRegister').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
});

document.getElementById('showLogin').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', function() {
    logoutUser();
    showLanding();
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
});

// Add Expense
document.getElementById('addBtn').addEventListener('click', function() {
    const amount = parseFloat(document.getElementById('addAmount').value);
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    
    const category = document.querySelector('input[name="cat"]:checked');
    if (!category) {
        alert('Please select a category.');
        return;
    }
    
    const desc = document.getElementById('addDesc').value.trim() || 'Unnamed expense';
    
    addExpense(amount, category.value, desc);
    
    document.getElementById('addAmount').value = '';
    document.getElementById('addDesc').value = '';
    
    renderAll();
    alert('✨ Expense added!');
});

// Wishlist
document.getElementById('openWishForm').addEventListener('click', function() {
    const form = document.getElementById('wishForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('cancelWishBtn').addEventListener('click', function() {
    document.getElementById('wishForm').style.display = 'none';
});

document.getElementById('saveWishBtn').addEventListener('click', function() {
    const name = document.getElementById('wishName').value.trim();
    const price = parseFloat(document.getElementById('wishPrice').value);
    
    if (!name || !price || price <= 0) {
        alert('Please enter a valid item and price.');
        return;
    }
    
    addWishlistItem(name, price);
    document.getElementById('wishName').value = '';
    document.getElementById('wishPrice').value = '';
    document.getElementById('wishForm').style.display = 'none';
    renderWishlist();
});

window.removeWish = function(index) {
    removeWishlistItem(index);
    renderWishlist();
};

// Goals
document.getElementById('addGoalBtn').addEventListener('click', function() {
    const name = document.getElementById('goalName').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    
    if (!name || !target || target <= 0) {
        alert('Please enter a valid goal.');
        return;
    }
    
    addGoal(name, target);
    document.getElementById('goalName').value = '';
    document.getElementById('goalTarget').value = '';
    renderGoals();
});

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
document.getElementById('gmCalcBtn').addEventListener('click', function() {
    const item = document.getElementById('gmItem').value.trim() || 'Item';
    const price = parseFloat(document.getElementById('gmPrice').value);
    const uses = parseInt(document.getElementById('gmUses').value);
    
    if (!price || price <= 0 || !uses || uses <= 0) {
        alert('Please enter valid numbers.');
        return;
    }
    
    const perUse = price / uses;
    const resultBox = document.getElementById('gmResult');
    resultBox.style.display = 'block';
    document.getElementById('gmDetail').textContent = 
        `${item} — ${formatPeso(price)} ÷ ${uses} wears = ${formatPeso(perUse)} per wear.`;
    document.getElementById('gmVerdict').textContent = 
        perUse < 100 ? 'APPROVED. 💅' : 'Hmm... think about it. 🤔';
});

// Enter key support
document.getElementById('loginPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('registerPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') document.getElementById('registerBtn').click();
});

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
// INIT
// ──────────────────────────────────────────────

if (checkLoggedInUser()) {
    showApp();
} else {
    showLanding();
}

console.log('🎀 Where Did My Money Go? is ready!');
console.log('✅ Dashboard shows ALL expenses');
console.log('✅ Edit and Delete buttons added');
console.log('💡 New users start with ZERO expenses!');