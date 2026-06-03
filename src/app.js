// =========================================
//  BUKUMONEY — FINANCE TRACKER APP
//  Storage: Firebase Firestore
//  v3.0 — Bug Fixed + Enhanced
// =========================================

// AI (Firebase AI Logic / Gemini) — asisten keuangan, auto-kategori, scan struk, draf pesan
import { suggestCategory, monthlyInsight, debtReminder, extractReceipt } from './ai.js';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    let transactionsRef = null;
    let walletsRef = null;
    let goalsRef = null;
    let assetsRef = null;
    let debtsRef = null;

    // DOM References
    const form = document.getElementById('transactionForm');
    const descInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');
    const dateInput = document.getElementById('date');
    const toggleIncome = document.getElementById('toggleIncome');
    const toggleExpense = document.getElementById('toggleExpense');
    const submitBtn = document.getElementById('submitBtn');

    const totalBalanceEl = document.getElementById('totalBalance');
    const totalWealthEl = document.getElementById('totalWealth');
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');

    const transactionList = document.getElementById('transactionList');
    const filterType = document.getElementById('filterType');

    const clearAllBtn = document.getElementById('clearAllBtn');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const clearModal = document.getElementById('clearModal');
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const cancelClearBtn = document.getElementById('cancelClearBtn');

    const toastContainer = document.getElementById('toastContainer');
    const currentDateEl = document.getElementById('currentDate');

    const chartCanvas = document.getElementById('expenseChart');
    const chartTotalAmount = document.getElementById('chartTotalAmount');
    const chartLegend = document.getElementById('chartLegend');

    const walletsContainer = document.getElementById('walletsContainer');
    const walletSelect = document.getElementById('walletSelect');
    const toWalletSelect = document.getElementById('toWalletSelect');
    const toWalletGroup = document.getElementById('toWalletGroup');
    const categoryGroup = document.getElementById('categoryGroup');
    const toggleTransfer = document.getElementById('toggleTransfer');

    const addWalletBtn = document.getElementById('addWalletBtn');
    const walletModal = document.getElementById('walletModal');
    const cancelWalletBtn = document.getElementById('cancelWalletBtn');
    const confirmWalletBtn = document.getElementById('confirmWalletBtn');
    const newWalletName = document.getElementById('newWalletName');
    const newWalletBalance = document.getElementById('newWalletBalance');

    // Goals DOM
    const goalsContainer = document.getElementById('goalsContainer');
    const addGoalBtn = document.getElementById('addGoalBtn');
    const goalModal = document.getElementById('goalModal');
    const cancelGoalBtn = document.getElementById('cancelGoalBtn');
    const confirmGoalBtn = document.getElementById('confirmGoalBtn');
    const newGoalName = document.getElementById('newGoalName');
    const newGoalTarget = document.getElementById('newGoalTarget');
    const newGoalInitial = document.getElementById('newGoalInitial');

    // Assets DOM
    const assetsContainer = document.getElementById('assetsContainer');
    const addAssetBtn = document.getElementById('addAssetBtn');
    const assetModal = document.getElementById('assetModal');
    const cancelAssetBtn = document.getElementById('cancelAssetBtn');
    const confirmAssetBtn = document.getElementById('confirmAssetBtn');
    const newAssetName = document.getElementById('newAssetName');
    const newAssetValue = document.getElementById('newAssetValue');

    const topupModal = document.getElementById('topupModal');
    const cancelTopupBtn = document.getElementById('cancelTopupBtn');
    const confirmTopupBtn = document.getElementById('confirmTopupBtn');
    const topupAmount = document.getElementById('topupAmount');
    const topupGoalNameDisplay = document.getElementById('topupGoalNameDisplay');
    const topupWalletSelect = document.getElementById('topupWalletSelect');

    const executeModal = document.getElementById('executeModal');
    const cancelExecuteBtn = document.getElementById('cancelExecuteBtn');
    const confirmExecuteBtn = document.getElementById('confirmExecuteBtn');
    const executeGoalNameDisplay = document.getElementById('executeGoalNameDisplay');
    const executeTotalAmount = document.getElementById('executeTotalAmount');
    const executeActualCost = document.getElementById('executeActualCost');
    const executeWalletSelect = document.getElementById('executeWalletSelect');
    const executeRefundInfo = document.getElementById('executeRefundInfo');

    // Debts DOM
    const debtsContainer = document.getElementById('debtsContainer');
    const addDebtBtn = document.getElementById('addDebtBtn');
    const debtModal = document.getElementById('debtModal');
    const debtToggleGive = document.getElementById('debtToggleGive');
    const debtToggleTake = document.getElementById('debtToggleTake');
    const cancelDebtBtn = document.getElementById('cancelDebtBtn');
    const confirmDebtBtn = document.getElementById('confirmDebtBtn');
    const newDebtName = document.getElementById('newDebtName');
    const newDebtTotal = document.getElementById('newDebtTotal');
    const newDebtPaid = document.getElementById('newDebtPaid');
    const newDebtPhone = document.getElementById('newDebtPhone');
    const newDebtWalletLabel = document.getElementById('newDebtWalletLabel');
    const newDebtWalletHint = document.getElementById('newDebtWalletHint');
    const newDebtWalletSelect = document.getElementById('newDebtWalletSelect');

    const payDebtModal = document.getElementById('payDebtModal');
    const cancelPayDebtBtn = document.getElementById('cancelPayDebtBtn');
    const confirmPayDebtBtn = document.getElementById('confirmPayDebtBtn');
    const payDebtAmount = document.getElementById('payDebtAmount');
    const payDebtNameDisplay = document.getElementById('payDebtNameDisplay');
    const payDebtTypeDisplay = document.getElementById('payDebtTypeDisplay');
    const payDebtWalletLabel = document.getElementById('payDebtWalletLabel');
    const payDebtWalletSelect = document.getElementById('payDebtWalletSelect');


    // Generic confirm modal (replaces browser confirm())
    const genericConfirmModal = document.getElementById('genericConfirmModal');
    const genericConfirmTitle = document.getElementById('genericConfirmTitle');
    const genericConfirmMsg = document.getElementById('genericConfirmMsg');
    const genericConfirmOk = document.getElementById('genericConfirmOk');
    const genericConfirmCancel = document.getElementById('genericConfirmCancel');

    // Edit transaction modal
    const editModal = document.getElementById('editModal');
    const editDescInput = document.getElementById('editDescription');
    const editAmountInput = document.getElementById('editAmount');
    const editCategorySelect = document.getElementById('editCategory');
    const editDateInput = document.getElementById('editDate');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const confirmEditBtn = document.getElementById('confirmEditBtn');

    // Detail modal
    const detailModal = document.getElementById('detailModal');
    const detailContent = document.getElementById('detailContent');
    const detailDescription = document.getElementById('detailDescription');
    const detailIcon = document.getElementById('detailIcon');
    const closeDetailBtn = document.getElementById('closeDetailBtn');

    // Auth DOM
    const authForm = document.getElementById('authForm');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const authError = document.getElementById('authError');
    const authToggleBtn = document.getElementById('authToggleBtn');
    const authToggleText = document.getElementById('authToggleText');

    // Adjust Wallet DOM
    const adjustWalletModal = document.getElementById('adjustWalletModal');
    const adjustWalletNameDisplay = document.getElementById('adjustWalletNameDisplay');
    const adjustWalletBalanceInput = document.getElementById('adjustWalletBalanceInput');
    const cancelAdjustWalletBtn = document.getElementById('cancelAdjustWalletBtn');
    const confirmAdjustWalletBtn = document.getElementById('confirmAdjustWalletBtn');

    const authTitle = document.getElementById('authTitle');
    const authActionBtn = document.getElementById('authActionBtn');
    const authModal = document.getElementById('authModal');
    const logoutBtn = document.getElementById('logoutBtn');

    // Bottom Nav & Tabs
    const navItems = document.querySelectorAll('.nav-item');
    const tabSections = document.querySelectorAll('.tab-section');
    const chartCanvasMobile = document.getElementById('expenseChartMobile');
    const chartTotalAmountMobile = document.getElementById('chartTotalAmountMobile');
    const chartLegendMobile = document.getElementById('chartLegendMobile');

    // State
    let transactions = [];
    let wallets = [];
    let goals = [];
    let assets = [];
    let debts = [];
    let currentType = 'income';
    let currentDebtType = 'give'; // give = piutang, take = hutang
    let deleteTargetId = null;
    let editTargetId = null;
    let currentTopupGoalId = null;
    let currentExecuteGoalId = null;
    let currentPayDebtId = null;
    let currentAdjustWalletId = null;
    let currentExecuteGoalAmount = 0;
    let currentUid = null;
    let isLoginMode = true;

    // Category icons map
    const categoryIcons = {
        'Gaji': 'fas fa-money-bill-wave',
        'Freelance': 'fas fa-laptop-code',
        'Investasi': 'fas fa-chart-line',
        'Lainnya (Masuk)': 'fas fa-gift',
        'Makanan': 'fas fa-utensils',
        'Transportasi': 'fas fa-car',
        'Belanja': 'fas fa-shopping-bag',
        'Hiburan': 'fas fa-film',
        'Tagihan': 'fas fa-file-invoice-dollar',
        'Kesehatan': 'fas fa-heartbeat',
        'Pendidikan': 'fas fa-graduation-cap',
        'Lainnya (Keluar)': 'fas fa-box',
        'Transfer': 'fas fa-exchange-alt'
    };

    // Chart colors — harmonized with the "Midnight" accent palette
    const chartColors = [
        '#bef264', '#34d399', '#38bdf8', '#fbbf24',
        '#fb7185', '#a78bfa', '#22d3ee', '#f472b6',
        '#4ade80', '#60a5fa', '#facc15', '#f87171'
    ];

    // ============================
    // GENERIC CONFIRM MODAL (replaces browser confirm())
    // ============================
    function showConfirm(title, message, okLabel = 'Ya, Lanjutkan') {
        return new Promise((resolve) => {
            genericConfirmTitle.textContent = title;
            genericConfirmMsg.textContent = message;
            genericConfirmOk.textContent = okLabel;
            genericConfirmModal.classList.add('active');

            const handleOk = () => {
                genericConfirmModal.classList.remove('active');
                cleanup();
                resolve(true);
            };
            const handleCancel = () => {
                genericConfirmModal.classList.remove('active');
                cleanup();
                resolve(false);
            };
            const cleanup = () => {
                genericConfirmOk.removeEventListener('click', handleOk);
                genericConfirmCancel.removeEventListener('click', handleCancel);
            };

            genericConfirmOk.addEventListener('click', handleOk);
            genericConfirmCancel.addEventListener('click', handleCancel);
        });
    }

    // ============================
    // AUTHENTICATION & INIT
    // ============================
    authToggleBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authTitle.textContent = 'Masuk';
            authToggleText.textContent = 'Belum punya akun?';
            authToggleBtn.textContent = 'Daftar di sini';
            authActionBtn.textContent = 'Masuk';
        } else {
            authTitle.textContent = 'Daftar Akun';
            authToggleText.textContent = 'Sudah punya akun?';
            authToggleBtn.textContent = 'Masuk di sini';
            authActionBtn.textContent = 'Daftar';
        }
        authError.textContent = '';
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value;
        const password = authPassword.value;
        authError.textContent = '';
        authActionBtn.disabled = true;
        authActionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        try {
            if (isLoginMode) {
                await auth.signInWithEmailAndPassword(email, password);
            } else {
                await auth.createUserWithEmailAndPassword(email, password);
            }
        } catch (err) {
            authError.textContent = err.message;
            authActionBtn.disabled = false;
            authActionBtn.innerHTML = isLoginMode ? 'Masuk' : 'Daftar';
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await auth.signOut();
        window.location.reload();
    });

    // ---- UI extras: mobile logout, notifications, hide-balance toggle ----
    const logoutBtnTop = document.getElementById('logoutBtnTop');
    if (logoutBtnTop) logoutBtnTop.addEventListener('click', async () => {
        await auth.signOut();
        window.location.reload();
    });

    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn) notifBtn.addEventListener('click', () => showToast('Belum ada notifikasi baru.', 'info'));

    const eyeBtn = document.getElementById('toggleHideBalance');
    if (eyeBtn) eyeBtn.addEventListener('click', () => {
        const hidden = document.querySelector('.app-bg').classList.toggle('balances-hidden');
        eyeBtn.innerHTML = `<i class="fas fa-eye${hidden ? '-slash' : ''}"></i>`;
        eyeBtn.title = hidden ? 'Tampilkan saldo' : 'Sembunyikan saldo';
    });

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUid = user.uid;
            authModal.classList.remove('active');
            logoutBtn.style.display = 'block';

            // Populate the sidebar user chip
            if (user.email) {
                const namePart = user.email.split('@')[0];
                const nameEl = document.getElementById('userName');
                const mailEl = document.getElementById('userEmailLabel');
                const avEl = document.getElementById('userAvatar');
                if (nameEl) nameEl.textContent = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                if (mailEl) mailEl.textContent = user.email;
                if (avEl) avEl.textContent = namePart.slice(0, 2).toUpperCase();
            }
            
            transactionsRef = db.collection('users').doc(currentUid).collection('bk_transactions');
            walletsRef = db.collection('users').doc(currentUid).collection('bk_wallets');
            goalsRef = db.collection('users').doc(currentUid).collection('bk_goals');
            assetsRef = db.collection('users').doc(currentUid).collection('bk_assets');
            debtsRef = db.collection('users').doc(currentUid).collection('bk_debts');

            await migrateExistingDataToUser(currentUid);
            loadUserData();
        } else {
            currentUid = null;
            authModal.classList.add('active');
            logoutBtn.style.display = 'none';
        }
    });

    async function migrateExistingDataToUser(uid) {
        const hasMigrated = localStorage.getItem('dataMigratedToUid');
        if (hasMigrated === uid) return;
        
        showToast('Memeriksa data lama...', 'info');
        const commitInBatches = async (snapshot, collectionName) => {
            let batch = db.batch();
            let ops = 0;
            for (const doc of snapshot.docs) {
                if (doc.data().migrated) continue;
                const newRef = db.collection('users').doc(uid).collection(collectionName).doc(doc.id);
                batch.set(newRef, doc.data());
                batch.update(doc.ref, { migrated: true });
                ops += 2;
                if (ops > 400) {
                    await batch.commit();
                    batch = db.batch();
                    ops = 0;
                }
            }
            if (ops > 0) await batch.commit();
        };

        try {
            await commitInBatches(await db.collection('bk_wallets').get(), 'bk_wallets');
            await commitInBatches(await db.collection('bk_goals').get(), 'bk_goals');
            await commitInBatches(await db.collection('bk_assets').get(), 'bk_assets');
            await commitInBatches(await db.collection('bk_transactions').get(), 'bk_transactions');
            localStorage.setItem('dataMigratedToUid', uid);
            showToast('Data berhasil diamankan ke akun Anda!', 'success');
        } catch(e) {
            console.error(e);
        }
    }

    async function loadUserData() {
        setTodayDate();
        displayDate();
        initTabs();
        await seedWallets();
        loadWallets();
        loadGoals();
        loadAssets();
        loadDebts();
        await migrateFromLocalStorage();
        loadTransactions();
    }

    // ============================
    // VIEW / TAB SWITCHING (sidebar + bottom nav + quick links)
    // ============================
    const PAGE_HEAD = {
        dashboard: ['Halo 👋', 'Ringkasan keuangan keluargamu hari ini'],
        wallets:   ['Dompet Saya', 'Kelola semua saldo dan rekeningmu'],
        assets:    ['Aset & Kekayaan', 'Pantau nilai aset tetap dan investasimu'],
        history:   ['Transaksi', 'Riwayat pemasukan dan pengeluaran'],
        goals:     ['Target Tabungan', 'Wujudkan rencana keuanganmu'],
        debts:     ['Hutang & Piutang', 'Catat pinjaman yang masuk dan keluar'],
        add:       ['Catat Transaksi', 'Tambahkan pemasukan, pengeluaran, atau transfer'],
    };

    function switchTab(targetTab) {
        if (!targetTab) return;
        document.querySelectorAll('.nav-item').forEach(i =>
            i.classList.toggle('active', i.dataset.tab === targetTab));
        document.querySelectorAll('.tab-section').forEach(section =>
            section.classList.toggle('active', section.id === `tab-${targetTab}`));

        const head = PAGE_HEAD[targetTab];
        if (head) {
            const titleEl = document.getElementById('pageTitle');
            if (titleEl) titleEl.textContent = head[0];
        }

        const main = document.querySelector('.main');
        if (main) main.scrollTo({ top: 0 });
        window.scrollTo({ top: 0 });

        if (targetTab === 'dashboard') {
            renderChart();
            renderTrendChart();
        }
    }

    // Any element carrying [data-tab] navigates: sidebar items, bottom-nav
    // items, quick actions, "Lihat semua" links and the topbar Catat button.
    function initTabs() {
        document.querySelectorAll('[data-tab]').forEach(el => {
            el.addEventListener('click', () => switchTab(el.dataset.tab));
        });
    }

    // ============================
    // MIGRATE localStorage → Firestore
    // ============================
    async function migrateFromLocalStorage() {
        const localData = localStorage.getItem('cashflow_transactions');
        if (!localData) return;

        let oldTransactions = [];
        try { oldTransactions = JSON.parse(localData); } catch (e) { return; }
        if (!Array.isArray(oldTransactions) || oldTransactions.length === 0) return;

        showToast(`Memigrasikan ${oldTransactions.length} transaksi ke cloud...`, 'info');

        try {
            const batchSize = 500;
            for (let i = 0; i < oldTransactions.length; i += batchSize) {
                const batch = db.batch();
                const chunk = oldTransactions.slice(i, i + batchSize);
                chunk.forEach((t) => {
                    const docRef = transactionsRef.doc();
                    batch.set(docRef, {
                        description: t.description || 'Tanpa deskripsi',
                        amount: t.amount || 0,
                        category: t.category || 'Lainnya (Keluar)',
                        date: t.date || new Date().toISOString().split('T')[0],
                        type: t.type || 'expense',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
            }
            localStorage.removeItem('cashflow_transactions');
            showToast(`✅ ${oldTransactions.length} transaksi berhasil dipindahkan ke Firebase!`, 'success');
        } catch (error) {
            console.error('Migration error:', error);
            showToast('Gagal migrasi data. Data lokal tetap aman.', 'error');
        }
    }

    // ============================
    // WALLETS: SEED DEFAULTS
    // ============================
    async function seedWallets() {
        const snapshot = await walletsRef.get();
        if (snapshot.empty) {
            showToast('Menyiapkan dompet default...', 'info');
            const defaults = [
                { name: 'Cash', balance: 0, icon: 'fas fa-wallet' },
                { name: 'Saldo Anak', balance: 0, icon: 'fas fa-child' },
                { name: 'Seabank', balance: 0, icon: 'fas fa-university' },
                { name: 'BCA', balance: 0, icon: 'fas fa-credit-card' },
                { name: 'BRI', balance: 0, icon: 'fas fa-landmark' }
            ];
            const batch = db.batch();
            defaults.forEach(w => {
                const ref = walletsRef.doc();
                batch.set(ref, { ...w, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            });
            await batch.commit();
        }
    }

    // ============================
    // WALLETS: LOAD & RENDER
    // ============================
    function loadWallets() {
        walletsRef.orderBy('createdAt', 'asc').onSnapshot(snapshot => {
            wallets = [];
            snapshot.forEach(doc => wallets.push({ id: doc.id, ...doc.data() }));
            renderWallets();
            updateWalletSelects();
            renderAll();
        });
    }

    function renderWallets() {
        // Wallet icon + type maps (keyed by lowercased name)
        const walletIconMap = {
            'cash': 'fas fa-money-bill-wave',
            'cash ayah': 'fas fa-money-bill-wave',
            'bca': 'fas fa-credit-card',
            'bri': 'fas fa-landmark',
            'bni': 'fas fa-university',
            'mandiri': 'fas fa-building',
            'seabank': 'fas fa-fish',
            'gopay': 'fas fa-mobile-alt',
            'ovo': 'fas fa-wallet',
            'dana': 'fas fa-star',
            'shopeepay': 'fas fa-shopping-bag',
            'saldo anak': 'fas fa-child',
        };
        const walletTypeMap = {
            'cash': 'Tunai', 'cash ayah': 'Tunai', 'tunai': 'Tunai',
            'bca': 'Bank', 'bri': 'Bank', 'bni': 'Bank', 'mandiri': 'Bank',
            'seabank': 'Bank digital', 'jago': 'Bank digital', 'blu': 'Bank digital',
            'gopay': 'E-wallet', 'ovo': 'E-wallet', 'dana': 'E-wallet', 'shopeepay': 'E-wallet', 'linkaja': 'E-wallet',
            'saldo anak': 'Dana anak', 'tabcash': 'Tabungan',
        };
        const topId = wallets.length ? wallets.reduce((m, w) => (w.balance || 0) > (m.balance || 0) ? w : m, wallets[0]).id : null;

        const cardHtml = (w, withActions) => {
            const key = (w.name || '').toLowerCase();
            const iconClass = walletIconMap[key] || 'fas fa-wallet';
            const type = walletTypeMap[key] || 'Dompet';
            const neg = (w.balance || 0) < 0 ? ' negative' : '';
            const accent = w.id === topId ? ' accent' : '';
            const right = withActions
                ? `<div class="wallet-actions">
                        <button class="btn-mini-edit-wallet" data-id="${w.id}" data-name="${escapeHtml(w.name)}" data-balance="${w.balance || 0}" title="Sesuaikan saldo"><i class="fas fa-pen"></i></button>
                        <button class="btn-mini-delete" data-id="${w.id}" title="Hapus dompet"><i class="fas fa-trash"></i></button>
                   </div>`
                : `<i class="fas fa-chevron-right" style="color: var(--ink-3); font-size: 13px;"></i>`;
            return `<div class="wallet-card${accent}">
                <div class="wallet-card-top">
                    <div class="icon-tile"><i class="${iconClass}"></i></div>
                    ${right}
                </div>
                <div class="wallet-meta">
                    <div class="wallet-name">${escapeHtml(w.name)}</div>
                    <div class="wallet-type">${type}</div>
                </div>
                <div class="wallet-balance${neg}">${formatCurrency(w.balance || 0)}</div>
            </div>`;
        };
        const firstChild = (html) => { const t = document.createElement('div'); t.innerHTML = html.trim(); return t.firstElementChild; };

        // ---- Full grid (Dompet view) ----
        walletsContainer.innerHTML = '';
        if (wallets.length === 0) {
            walletsContainer.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><i class="fas fa-wallet"></i><p>Belum ada dompet.</p><span>Tambahkan dompet pertamamu.</span></div>';
        } else {
            wallets.forEach(w => walletsContainer.appendChild(firstChild(cardHtml(w, true))));
            const add = document.createElement('button');
            add.className = 'wallet-add';
            add.innerHTML = '<span class="wallet-add-ic"><i class="fas fa-plus"></i></span><span>Tambah Dompet</span>';
            add.onclick = () => walletModal.classList.add('active');
            walletsContainer.appendChild(add);

            // Row actions — scoped to the grid so they don't collide with asset buttons
            walletsContainer.querySelectorAll('.btn-mini-delete').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const wallet = wallets.find(w => w.id === id);
                    const hasTransactions = transactions.some(t => t.walletId === id || t.toWalletId === id);
                    const msg = hasTransactions
                        ? `Hapus dompet "${wallet?.name}"? Catatan: ${transactions.filter(t => t.walletId === id).length} transaksi terkait akan kehilangan referensi dompet.`
                        : `Hapus dompet "${wallet?.name}"?`;
                    const confirmed = await showConfirm('Hapus Dompet', msg, 'Hapus');
                    if (confirmed) {
                        walletsRef.doc(id).delete();
                        showToast('Dompet berhasil dihapus.', 'info');
                    }
                };
            });
            walletsContainer.querySelectorAll('.btn-mini-edit-wallet').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    currentAdjustWalletId = btn.dataset.id;
                    adjustWalletNameDisplay.textContent = btn.dataset.name;
                    adjustWalletBalanceInput.value = btn.dataset.balance;
                    adjustWalletModal.classList.add('active');
                };
            });
        }

        // ---- Dashboard preview (horizontal scroll) ----
        const preview = document.getElementById('dashWalletsPreview');
        if (preview) {
            preview.innerHTML = '';
            if (wallets.length === 0) {
                preview.innerHTML = '<div class="empty-state-small" style="font-size:13px; color:var(--ink-3);">Belum ada dompet</div>';
            } else {
                wallets.forEach(w => {
                    const el = firstChild(cardHtml(w, false));
                    el.style.cursor = 'pointer';
                    el.onclick = () => switchTab('wallets');
                    preview.appendChild(el);
                });
                const add = document.createElement('button');
                add.className = 'wallet-add';
                add.style.minHeight = '0';
                add.style.width = '150px';
                add.style.flex = 'none';
                add.innerHTML = '<span class="wallet-add-ic"><i class="fas fa-plus"></i></span><span>Tambah<br>Dompet</span>';
                add.onclick = () => walletModal.classList.add('active');
                preview.appendChild(add);
            }
        }

        renderAllocation();
    }

    function allocColor(i) {
        const hues = [135, 165, 200, 235, 275, 310, 45, 20];
        return `oklch(0.80 0.13 ${hues[i % hues.length]})`;
    }

    function renderAllocation() {
        const el = document.getElementById('allocContent');
        if (!el) return;
        const total = wallets.reduce((s, w) => s + (w.balance || 0), 0);
        const positive = wallets.filter(w => (w.balance || 0) > 0).sort((a, b) => (b.balance || 0) - (a.balance || 0));
        if (total <= 0 || positive.length === 0) {
            el.innerHTML = '<div class="alloc-bar"><div style="width:100%; background: var(--bg-3);"></div></div>';
            return;
        }
        const segs = positive.map((w, i) =>
            `<div title="${escapeHtml(w.name)} · ${formatCurrency(w.balance)}" style="width:${(w.balance / total * 100)}%; background:${allocColor(i)};"></div>`).join('');
        const legend = positive.slice(0, 6).map((w, i) =>
            `<span class="lg-key"><i class="dot" style="background:${allocColor(i)}"></i>${escapeHtml(w.name)}<b>${Math.round(w.balance / total * 100)}%</b></span>`).join('');
        el.innerHTML = `<div class="alloc-bar">${segs}</div><div class="alloc-legend">${legend}</div>`;
    }

    // Modal Adjust Wallet Logic
    cancelAdjustWalletBtn.onclick = () => { adjustWalletModal.classList.remove('active'); currentAdjustWalletId = null; };
    confirmAdjustWalletBtn.onclick = async () => {
        if (!currentAdjustWalletId) return;
        const newBalance = parseInt(adjustWalletBalanceInput.value);
        if (isNaN(newBalance)) return showToast('Nominal tidak valid!', 'error');

        confirmAdjustWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        confirmAdjustWalletBtn.disabled = true;

        try {
            const walletRef = walletsRef.doc(currentAdjustWalletId);
            const walletDoc = await walletRef.get();
            const oldBalance = walletDoc.exists ? (walletDoc.data().balance || 0) : 0;
            const walletName = walletDoc.exists ? (walletDoc.data().name || 'Dompet') : 'Dompet';
            const diff = newBalance - oldBalance;

            const batch = db.batch();
            batch.update(walletRef, { balance: newBalance });

            // Catat setiap penyesuaian saldo dompet sebagai transaksi di riwayat
            if (diff !== 0) {
                const transRef = transactionsRef.doc();
                batch.set(transRef, {
                    description: `Penyesuaian Saldo: ${walletName}`,
                    amount: Math.abs(diff),
                    category: diff > 0 ? 'Lainnya (Masuk)' : 'Lainnya (Keluar)',
                    date: new Date().toISOString().split('T')[0],
                    type: diff > 0 ? 'income' : 'expense',
                    walletId: currentAdjustWalletId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            await batch.commit();
            showToast(diff === 0 ? 'Saldo tidak berubah.' : 'Saldo disesuaikan & dicatat di riwayat!', 'success');
            adjustWalletModal.classList.remove('active');
            currentAdjustWalletId = null;
        } catch (e) {
            console.error(e);
            showToast('Gagal menyesuaikan saldo!', 'error');
        } finally {
            confirmAdjustWalletBtn.innerHTML = 'Simpan Perubahan';
            confirmAdjustWalletBtn.disabled = false;
        }
    }

    function updateWalletSelects() {
        const options = wallets.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
        walletSelect.innerHTML = '<option value="">Pilih Dompet...</option>' + options;
        toWalletSelect.innerHTML = '<option value="">Ke Dompet...</option>' + options;
        if (topupWalletSelect) topupWalletSelect.innerHTML = '<option value="">Pilih Dompet...</option>' + options;
        if (executeWalletSelect) executeWalletSelect.innerHTML = '<option value="">Pilih Dompet...</option>' + options;
        if (payDebtWalletSelect) payDebtWalletSelect.innerHTML = '<option value="">Pilih Dompet...</option>' + options;
        if (newDebtWalletSelect) newDebtWalletSelect.innerHTML = '<option value="">Pilih Dompet...</option>' + options;
    }

    // Wallet Modal
    addWalletBtn.onclick = () => walletModal.classList.add('active');
    cancelWalletBtn.onclick = () => walletModal.classList.remove('active');
    confirmWalletBtn.onclick = async () => {
        const name = newWalletName.value.trim();
        const balance = parseInt(newWalletBalance.value) || 0;
        if (!name) return showToast('Nama dompet harus diisi!', 'error');

        confirmWalletBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        confirmWalletBtn.disabled = true;

        try {
            await walletsRef.add({
                name,
                balance,
                icon: 'fas fa-wallet',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            newWalletName.value = '';
            newWalletBalance.value = '';
            walletModal.classList.remove('active');
            showToast('Dompet berhasil dibuat!', 'success');
        } catch (e) {
            showToast('Gagal membuat dompet.', 'error');
        } finally {
            confirmWalletBtn.innerHTML = 'Simpan';
            confirmWalletBtn.disabled = false;
        }
    };

    function setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    function displayDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('id-ID', options);
    }

    // ============================
    // GOALS: LOAD & RENDER
    // ============================
    function loadGoals() {
        goalsRef.orderBy('createdAt', 'asc').onSnapshot(snapshot => {
            goals = [];
            snapshot.forEach(doc => goals.push({ id: doc.id, ...doc.data() }));
            renderGoals();
        });
    }

    function renderGoals() {
        goalsContainer.innerHTML = '';
        if (goals.length === 0) {
            goalsContainer.innerHTML = '<p class="text-muted" style="padding: 8px 0;">Belum ada target tabungan.</p>';
            return;
        }

        goals.forEach(g => {
            const current = g.currentAmount || 0;
            const target = g.targetAmount || 1;
            let percentage = (current / target) * 100;
            if (percentage > 100) percentage = 100;

            let colorClass = 'low';
            if (percentage >= 100) colorClass = 'completed';
            else if (percentage >= 70) colorClass = 'high';
            else if (percentage >= 30) colorClass = 'medium';

            const card = document.createElement('div');
            card.className = 'goal-card';
            card.innerHTML = `
                <div class="goal-header-top">
                    <div class="goal-name">
                        <div class="goal-name-icon"><i class="fas fa-bullseye"></i></div>
                        ${escapeHtml(g.name)}
                    </div>
                    <div class="goal-actions">
                        <button class="btn-mini-action execute" data-id="${g.id}" data-name="${escapeHtml(g.name)}" data-amount="${g.currentAmount || 0}" title="Selesaikan">
                            <i class="fas fa-check-circle" style="color: #3b82f6;"></i>
                        </button>
                        <button class="btn-mini-action delete" data-id="${g.id}" data-name="${escapeHtml(g.name)}" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-mini-action topup" data-id="${g.id}" data-name="${escapeHtml(g.name)}" title="Isi Tabungan">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="goal-amounts">
                    <span>Terkumpul: <strong>${formatCurrency(current)}</strong></span>
                    <span>Target: ${formatCurrency(target)}</span>
                </div>
                <div class="goal-progress">
                    <div class="goal-progress-fill ${colorClass}" style="width: ${percentage}%"></div>
                </div>
                <div class="goal-percentage-row">
                    <span class="goal-percentage">${percentage.toFixed(1)}%</span>
                    <span class="goal-remaining">${percentage < 100 ? 'Sisa: ' + formatCurrency(target - current) : '🎉 Target Tercapai!'}</span>
                </div>
            `;
            goalsContainer.appendChild(card);
        });

        // BUG FIX: Use custom modal instead of browser confirm()
        document.querySelectorAll('.btn-mini-action.delete').forEach(btn => {
            btn.onclick = async () => {
                const confirmed = await showConfirm('Hapus Target', `Hapus target "${btn.dataset.name}" secara permanen?`, 'Hapus');
                if (confirmed) {
                    goalsRef.doc(btn.dataset.id).delete();
                    showToast('Target berhasil dihapus.', 'info');
                }
            };
        });

        document.querySelectorAll('.btn-mini-action.topup').forEach(btn => {
            btn.onclick = () => {
                currentTopupGoalId = btn.dataset.id;
                topupGoalNameDisplay.textContent = btn.dataset.name;
                topupAmount.value = '';
                topupModal.classList.add('active');
            };
        });

        document.querySelectorAll('.btn-mini-action.execute').forEach(btn => {
            btn.onclick = () => {
                currentExecuteGoalId = btn.dataset.id;
                currentExecuteGoalAmount = parseInt(btn.dataset.amount) || 0;
                executeGoalNameDisplay.textContent = btn.dataset.name;
                executeTotalAmount.value = currentExecuteGoalAmount;
                executeActualCost.value = currentExecuteGoalAmount;
                executeRefundInfo.textContent = 'Tidak ada dana sisa (Pas).';
                executeRefundInfo.style.color = 'var(--text-muted)';
                executeWalletSelect.required = false;
                executeModal.classList.add('active');
            };
        });
    }

    // ============================
    // ASSETS: LOAD & RENDER
    // ============================
    function loadAssets() {
        assetsRef.orderBy('createdAt', 'asc').onSnapshot(snapshot => {
            assets = [];
            snapshot.forEach(doc => assets.push({ id: doc.id, ...doc.data() }));
            renderAssets();
            renderAll();
        });
    }

    function renderAssets() {
        assetsContainer.innerHTML = '';
        if (assets.length === 0) {
            assetsContainer.innerHTML = '<p class="text-muted" style="padding: 8px 0;">Belum ada pencatatan aset.</p>';
            return;
        }

        assets.forEach(a => {
            const card = document.createElement('div');
            card.className = 'asset-card';
            card.innerHTML = `
                <div class="asset-icon-wrap"><i class="fas fa-gem"></i></div>
                <div class="asset-meta-wrap">
                    <div class="asset-name">${escapeHtml(a.name)}</div>
                    <div class="asset-meta">Aset tercatat</div>
                </div>
                <div class="asset-balance num">${formatCurrency(a.amount || 0)}</div>
                <div class="asset-actions">
                    <button class="btn-mini-delete" data-id="${a.id}" title="Hapus aset"><i class="fas fa-trash"></i></button>
                </div>
            `;
            assetsContainer.appendChild(card);
        });

        assetsContainer.querySelectorAll('.btn-mini-delete').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const asset = assets.find(a => a.id === id);
                const confirmed = await showConfirm('Hapus Aset', `Hapus aset "${asset?.name}"? Data ini akan dihapus permanen.`, 'Hapus');
                if (confirmed) {
                    assetsRef.doc(id).delete();
                    showToast('Aset berhasil dihapus.', 'info');
                }
            };
        });
    }

    // Modal Add Asset
    addAssetBtn.onclick = () => assetModal.classList.add('active');
    cancelAssetBtn.onclick = () => assetModal.classList.remove('active');
    confirmAssetBtn.onclick = async () => {
        const name = newAssetName.value.trim();
        const amount = parseInt(newAssetValue.value) || 0;
        if (!name) return showToast('Nama aset harus diisi!', 'error');

        confirmAssetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        confirmAssetBtn.disabled = true;

        try {
            await assetsRef.add({
                name,
                amount,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            newAssetName.value = '';
            newAssetValue.value = '';
            assetModal.classList.remove('active');
            showToast('Aset berhasil ditambahkan!', 'success');
        } catch (e) {
            showToast('Gagal menambahkan aset.', 'error');
        } finally {
            confirmAssetBtn.innerHTML = 'Simpan';
            confirmAssetBtn.disabled = false;
        }
    };

    // ============================
    // DEBTS: LOAD & RENDER
    // ============================
    function loadDebts() {
        if (!debtsRef) return;
        debtsRef.orderBy('createdAt', 'asc').onSnapshot(snapshot => {
            debts = [];
            snapshot.forEach(doc => debts.push({ id: doc.id, ...doc.data() }));
            renderDebts();
        });
    }

    function renderDebts() {
        debtsContainer.innerHTML = '';
        if (debts.length === 0) {
            debtsContainer.innerHTML = '<p class="text-muted" style="padding: 8px 0;">Belum ada catatan hutang.</p>';
            return;
        }

        debts.forEach(d => {
            const paid = d.paidAmount || 0;
            const total = d.totalAmount || 1;
            const isGive = d.type === 'give'; // Memberi Hutang (Piutang)
            
            let percentage = (paid / total) * 100;
            if (percentage > 100) percentage = 100;

            const icon = isGive ? 'fa-hand-holding-usd' : 'fa-handshake';
            const iconBg = isGive ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)';
            const iconColor = isGive ? '#3b82f6' : 'var(--expense-light)';
            const progressColor = isGive ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : 'linear-gradient(90deg, var(--expense), var(--expense-light))';

            const card = document.createElement('div');
            card.className = 'goal-card'; 
            card.innerHTML = `
                <div class="goal-header-top">
                    <div class="goal-name" title="${isGive ? 'Piutang (Kita memberi pinjaman)' : 'Hutang (Kita berhutang)'}">
                        <div class="goal-name-icon" style="background: ${iconBg}; color: ${iconColor};">
                            <i class="fas ${icon}"></i>
                        </div>
                        ${escapeHtml(d.name)}
                        <span style="font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; background: ${iconBg}; color: ${iconColor}; margin-left: 8px;">
                            ${isGive ? 'Piutang' : 'Hutang'}
                        </span>
                    </div>
                    <div class="goal-actions">
                        <button class="btn-mini-action delete" data-id="${d.id}" data-name="${escapeHtml(d.name)}" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-mini-action pay" data-id="${d.id}" data-name="${escapeHtml(d.name)}" data-type="${d.type}" title="${isGive ? 'Catat Pelunasan Piutang' : 'Bayar Hutang'}">
                            <i class="fas fa-money-bill-wave"></i>
                        </button>
                        ${d.phone ? `
                        <button class="btn-mini-action wa" data-phone="${escapeHtml(d.phone)}" data-name="${escapeHtml(d.name)}" data-rem="${total - paid}" data-type="${d.type}" title="Kirim Pesan WhatsApp">
                            <i class="fab fa-whatsapp" style="color: #25D366;"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
                <div class="goal-amounts">
                    <span>${isGive ? 'Diterima' : 'Dibayar'}: <strong>${formatCurrency(paid)}</strong></span>
                    <span>Total: ${formatCurrency(total)}</span>
                </div>
                <div class="goal-progress">
                    <div class="goal-progress-fill" style="width: ${percentage}%; background: ${progressColor};"></div>
                </div>
                <div class="goal-percentage-row">
                    <span class="goal-percentage" style="color: ${iconColor};">${percentage.toFixed(1)}%</span>
                    <span class="goal-remaining">${percentage < 100 ? 'Sisa: ' + formatCurrency(total - paid) : '🎉 Lunas!'}</span>
                </div>
            `;
            debtsContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-mini-action.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const name = btn.dataset.name;
                const confirmed = await showConfirm('Hapus Catatan', `Hapus catatan hutang/piutang "${name}"?`, 'Hapus');
                if (confirmed) {
                    debtsRef.doc(id).delete();
                    showToast('Catatan berhasil dihapus.', 'info');
                }
            });
        });

        document.querySelectorAll('.btn-mini-action.wa').forEach(btn => {
            btn.addEventListener('click', () => {
                let phone = btn.dataset.phone.replace(/[^0-9]/g, '');
                if (phone.startsWith('0')) {
                    phone = '62' + phone.substring(1);
                }
                openWaDraft({
                    phone,
                    name: btn.dataset.name,
                    remaining: parseInt(btn.dataset.rem) || 0,
                    type: btn.dataset.type || 'give'
                });
            });
        });

        document.querySelectorAll('.btn-mini-action.pay').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPayDebtId = btn.dataset.id;
                const type = btn.dataset.type;
                const isGive = type === 'give';
                payDebtNameDisplay.textContent = btn.dataset.name;
                payDebtTypeDisplay.textContent = isGive ? '(Proses penagihan piutang - Uang masuk ke dompet)' : '(Pembayaran hutang kita - Uang keluar dari dompet)';
                payDebtWalletLabel.textContent = isGive ? 'Simpan ke Dompet' : 'Ambil dari Dompet';
                payDebtAmount.value = '';
                payDebtModal.classList.add('active');
            });
        });
    }

    // Modal Add Debt Logic
    debtToggleGive.onclick = () => {
        currentDebtType = 'give';
        debtToggleGive.classList.add('active');
        debtToggleTake.classList.remove('active');
        newDebtWalletLabel.textContent = 'Potong dari Dompet (Opsional)';
        newDebtWalletHint.textContent = 'Jika dipilih, saldo akan langsung BERKURANG (karena Anda meminjamkan uang).';
    };
    debtToggleTake.onclick = () => {
        currentDebtType = 'take';
        debtToggleTake.classList.add('active');
        debtToggleGive.classList.remove('active');
        newDebtWalletLabel.textContent = 'Masuk ke Dompet (Opsional)';
        newDebtWalletHint.textContent = 'Jika dipilih, saldo akan langsung BERTAMBAH (karena Anda menerima uang pinjaman).';
    };

    addGoalBtn.onclick = () => goalModal.classList.add('active'); // Keep existing
    
    addDebtBtn.onclick = () => {
        currentDebtType = 'give';
        debtToggleGive.classList.add('active');
        debtToggleTake.classList.remove('active');
        newDebtWalletLabel.textContent = 'Potong dari Dompet (Opsional)';
        newDebtWalletHint.textContent = 'Jika dipilih, saldo akan langsung BERKURANG.';
        debtModal.classList.add('active');
    };
    cancelDebtBtn.onclick = () => debtModal.classList.remove('active');
    confirmDebtBtn.onclick = async () => {
        const name = newDebtName.value.trim();
        const total = parseInt(newDebtTotal.value) || 0;
        const paid = parseInt(newDebtPaid.value) || 0;
        const phone = newDebtPhone ? newDebtPhone.value.trim() : '';
        const selectedWalletId = newDebtWalletSelect.value;
        const isGive = currentDebtType === 'give';

        if (!name || total <= 0) return showToast('Nama & Total tidak valid!', 'error');

        confirmDebtBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        confirmDebtBtn.disabled = true;

        try {
            const batch = db.batch();
            const debtRef = debtsRef.doc();

            if (selectedWalletId) {
                const walletRef = walletsRef.doc(selectedWalletId);
                const walletDoc = await walletRef.get();
                const currentBalance = walletDoc.data().balance || 0;
                
                // Jika Memberi Hutang (give): Uang keluar (-)
                // Jika Menerima Hutang (take): Uang masuk (+)
                const balanceChange = isGive ? -total : total;
                batch.update(walletRef, { balance: currentBalance + balanceChange });

                const transRef = transactionsRef.doc();
                batch.set(transRef, {
                    description: isGive ? `Memberi Pinjaman (Piutang): ${name}` : `Menerima Hutang: ${name}`,
                    amount: total,
                    category: 'Lainnya',
                    date: new Date().toISOString().split('T')[0],
                    type: isGive ? 'expense' : 'income',
                    walletId: selectedWalletId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            batch.set(debtRef, {
                name,
                phone,
                type: currentDebtType,
                totalAmount: total,
                paidAmount: paid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await batch.commit();

            showToast('Catatan berhasil disimpan!', 'success');
            debtModal.classList.remove('active');
            newDebtName.value = '';
            newDebtTotal.value = '';
            newDebtPaid.value = '';
            if (newDebtPhone) newDebtPhone.value = '';
            newDebtWalletSelect.value = '';
        } catch (e) {
            console.error(e);
            showToast('Gagal menyimpan catatan!', 'error');
        } finally {
            confirmDebtBtn.innerHTML = 'Simpan';
            confirmDebtBtn.disabled = false;
        }
    };

    // Modal Pay/Collect Debt Logic
    cancelPayDebtBtn.onclick = () => { payDebtModal.classList.remove('active'); currentPayDebtId = null; };
    confirmPayDebtBtn.onclick = async () => {
        if (!currentPayDebtId) return;
        const addAmount = parseInt(payDebtAmount.value) || 0;
        const selectedWalletId = payDebtWalletSelect.value;

        if (addAmount <= 0) return showToast('Nominal tidak valid!', 'error');
        if (!selectedWalletId) return showToast('Pilih dompet!', 'error');

        confirmPayDebtBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        confirmPayDebtBtn.disabled = true;

        try {
            const batch = db.batch();
            const debtRef = debtsRef.doc(currentPayDebtId);
            const debtDoc = await debtRef.get();
            const dData = debtDoc.data();
            const currentPaid = dData.paidAmount || 0;
            const isGive = dData.type === 'give'; // Piutang

            const walletRef = walletsRef.doc(selectedWalletId);
            const walletDoc = await walletRef.get();
            const currentWalletBalance = walletDoc.data().balance || 0;

            // Jika Piutang (give): Kita dapat uang dari orang (+) -> Income
            // Jika Hutang (take): Kita bayar uang ke orang (-) -> Expense
            if (!isGive && currentWalletBalance < addAmount) {
                showToast('Saldo dompet tidak mencukupi!', 'error');
                throw new Error('Balance insufficient');
            }

            const balanceChange = isGive ? addAmount : -addAmount;
            batch.update(debtRef, { paidAmount: currentPaid + addAmount });
            batch.update(walletRef, { balance: currentWalletBalance + balanceChange });

            const transRef = transactionsRef.doc();
            batch.set(transRef, {
                description: isGive ? `Terima Pelunasan (Dihutangi): ${dData.name}` : `Bayar Cicilan Hutang: ${dData.name}`,
                amount: addAmount,
                category: 'Lainnya',
                date: new Date().toISOString().split('T')[0],
                type: isGive ? 'income' : 'expense',
                walletId: selectedWalletId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await batch.commit();
            showToast('Berhasil diproses!', 'success');
            payDebtModal.classList.remove('active');
            payDebtWalletSelect.value = '';
            currentPayDebtId = null;
        } catch (e) {
            console.error(e);
            if (e.message !== 'Balance insufficient') showToast('Gagal memproses!', 'error');
        } finally {
            confirmPayDebtBtn.innerHTML = 'Bayar Sekarang';
            confirmPayDebtBtn.disabled = false;
        }
    };

    // Modal Add Goal
    addGoalBtn.onclick = () => goalModal.classList.add('active');
    cancelGoalBtn.onclick = () => goalModal.classList.remove('active');
    confirmGoalBtn.onclick = async () => {
        const name = newGoalName.value.trim();
        const target = parseInt(newGoalTarget.value) || 0;
        const initial = parseInt(newGoalInitial.value) || 0;
        if (!name || target <= 0) return showToast('Nama & Nominal Target tidak valid!', 'error');

        confirmGoalBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        confirmGoalBtn.disabled = true;

        try {
            await goalsRef.add({
                name,
                targetAmount: target,
                currentAmount: initial,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Target berhasil dibuat!', 'success');
            goalModal.classList.remove('active');
            newGoalName.value = '';
            newGoalTarget.value = '';
            newGoalInitial.value = '';
        } catch (e) {
            showToast('Gagal membuat target!', 'error');
        } finally {
            confirmGoalBtn.innerHTML = 'Simpan';
            confirmGoalBtn.disabled = false;
        }
    };

    // Modal Top-Up Goal
    cancelTopupBtn.onclick = () => { topupModal.classList.remove('active'); currentTopupGoalId = null; };
    confirmTopupBtn.onclick = async () => {
        if (!currentTopupGoalId) return;
        const addAmount = parseInt(topupAmount.value) || 0;
        const selectedWalletId = topupWalletSelect.value;

        if (addAmount <= 0) return showToast('Nominal Top-Up tidak valid!', 'error');
        if (!selectedWalletId) return showToast('Pilih sumber dompet!', 'error');

        const localWallet = wallets.find(w => w.id === selectedWalletId);
        if (localWallet && (localWallet.balance || 0) < addAmount) {
            return showToast('Saldo dompet tidak mencukupi!', 'error');
        }

        confirmTopupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        confirmTopupBtn.disabled = true;

        try {
            const batch = db.batch();
            const goalRef = goalsRef.doc(currentTopupGoalId);
            const goalDoc = await goalRef.get();
            const currentGoalAmount = goalDoc.data().currentAmount || 0;
            const goalName = goalDoc.data().name;

            const walletRef = walletsRef.doc(selectedWalletId);
            const walletDoc = await walletRef.get();
            const currentWalletBalance = walletDoc.data().balance || 0;

            if (currentWalletBalance < addAmount) {
                return showToast('Saldo dompet (DB) tidak mencukupi!', 'error');
            }

            batch.update(goalRef, { currentAmount: currentGoalAmount + addAmount });
            batch.update(walletRef, { balance: currentWalletBalance - addAmount });

            const transRef = transactionsRef.doc();
            batch.set(transRef, {
                description: `Isi Target: ${goalName}`,
                amount: addAmount,
                category: 'Lainnya (Keluar)',
                date: new Date().toISOString().split('T')[0],
                type: 'expense',
                walletId: selectedWalletId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await batch.commit();
            showToast('Tabungan berhasil ditambahkan!', 'success');
            topupModal.classList.remove('active');
            topupWalletSelect.value = '';
            currentTopupGoalId = null;
        } catch (e) {
            console.error(e);
            showToast('Gagal top-up tabungan!', 'error');
        } finally {
            confirmTopupBtn.innerHTML = 'Top-Up Sekarang';
            confirmTopupBtn.disabled = false;
        }
    };

    // Modal Execute Goal
    executeActualCost.addEventListener('input', () => {
        const cost = parseInt(executeActualCost.value) || 0;
        const refund = currentExecuteGoalAmount - cost;
        if (refund > 0) {
            executeRefundInfo.textContent = `Sisa Rp ${refund.toLocaleString('id-ID')} akan dikembalikan ke dompet.`;
            executeRefundInfo.style.color = 'var(--accent)';
            executeWalletSelect.required = true;
        } else if (refund < 0) {
            executeRefundInfo.textContent = `Biaya aktual kurang Rp ${Math.abs(refund).toLocaleString('id-ID')} dari tabungan!`;
            executeRefundInfo.style.color = '#ef4444';
            executeWalletSelect.required = false;
        } else {
            executeRefundInfo.textContent = 'Tidak ada dana sisa (Pas).';
            executeRefundInfo.style.color = 'var(--text-muted)';
            executeWalletSelect.required = false;
        }
    });

    cancelExecuteBtn.onclick = () => { executeModal.classList.remove('active'); currentExecuteGoalId = null; };
    confirmExecuteBtn.onclick = async () => {
        if (!currentExecuteGoalId) return;
        const actualCost = parseInt(executeActualCost.value);
        if (isNaN(actualCost) || actualCost < 0) return showToast('Biaya aktual tidak valid!', 'error');

        const refund = currentExecuteGoalAmount - actualCost;
        const selectedWalletId = executeWalletSelect.value;

        if (refund < 0) return showToast('Dana tabungan kurang, kurangi biaya atau topup dulu!', 'error');
        if (refund > 0 && !selectedWalletId) return showToast('Pilih dompet untuk menerima sisa dana!', 'error');

        confirmExecuteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        confirmExecuteBtn.disabled = true;

        try {
            const batch = db.batch();
            const goalName = executeGoalNameDisplay.textContent;

            if (refund > 0) {
                const walletRef = walletsRef.doc(selectedWalletId);
                const walletDoc = await walletRef.get();
                const currentWalletBalance = walletDoc.data().balance || 0;
                batch.update(walletRef, { balance: currentWalletBalance + refund });

                const transRef = transactionsRef.doc();
                batch.set(transRef, {
                    description: `Kembalian Target: ${goalName}`,
                    amount: refund,
                    category: 'Lainnya (Masuk)',
                    date: new Date().toISOString().split('T')[0],
                    type: 'income',
                    walletId: selectedWalletId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            const goalRef = goalsRef.doc(currentExecuteGoalId);
            batch.delete(goalRef);
            await batch.commit();

            showToast('Target berhasil dieksekusi selesai! 🎉', 'success');
            executeModal.classList.remove('active');
            executeWalletSelect.value = '';
            executeActualCost.value = '';
            currentExecuteGoalId = null;
        } catch (e) {
            console.error(e);
            showToast('Gagal memproses eksekusi!', 'error');
        } finally {
            confirmExecuteBtn.innerHTML = 'Selesaikan';
            confirmExecuteBtn.disabled = false;
        }
    };

    // ============================
    // FORMAT CURRENCY
    // ============================
    function formatCurrency(amount) {
        return 'Rp ' + (amount || 0).toLocaleString('id-ID');
    }

    // ============================
    // TOGGLE TYPE / MODE
    // BUG FIX: Label "Dari Dompet" / "Ke Dompet" sesuai tipe
    // ============================
    const walletLabel = walletSelect.parentElement.querySelector('label');

    toggleIncome.addEventListener('click', () => {
        currentType = 'income';
        toggleIncome.classList.add('active');
        toggleExpense.classList.remove('active');
        toggleTransfer.classList.remove('active');
        toWalletGroup.style.display = 'none';
        categoryGroup.style.display = 'block';
        // BUG FIX: Label yang benar untuk income adalah "Ke Dompet"
        walletLabel.textContent = 'Ke Dompet';
    });

    toggleExpense.addEventListener('click', () => {
        currentType = 'expense';
        toggleExpense.classList.add('active');
        toggleIncome.classList.remove('active');
        toggleTransfer.classList.remove('active');
        toWalletGroup.style.display = 'none';
        categoryGroup.style.display = 'block';
        walletLabel.textContent = 'Dari Dompet';
    });

    toggleTransfer.addEventListener('click', () => {
        currentType = 'transfer';
        toggleTransfer.classList.add('active');
        toggleIncome.classList.remove('active');
        toggleExpense.classList.remove('active');
        toWalletGroup.style.display = 'block';
        categoryGroup.style.display = 'none';
        walletLabel.textContent = 'Dari Dompet';
    });

    // ============================
    // FIREBASE: LOAD TRANSACTIONS (real-time)
    // ============================
    function loadTransactions() {
        transactionList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Memuat data...</p>
            </div>
        `;

        transactionsRef
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                transactions = [];
                snapshot.forEach((doc) => {
                    transactions.push({ id: doc.id, ...doc.data() });
                });
                renderAll();
            }, (error) => {
                console.error('Firestore error:', error);
                showToast('Gagal memuat data. Periksa koneksi internet.', 'error');
            });
    }

    // ============================
    // FIREBASE: ADD TRANSACTION
    // ============================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const desc = descInput.value.trim();
        const amount = parseInt(amountInput.value);
        const category = currentType === 'transfer' ? 'Transfer' : categorySelect.value;
        const date = dateInput.value;
        const walletId = walletSelect.value;
        const toWalletId = toWalletSelect.value;

        if (!desc || !amount || !date || !walletId) {
            showToast('Lengkapi semua field yang wajib!', 'error');
            return;
        }

        if (currentType === 'transfer' && (!toWalletId || walletId === toWalletId)) {
            showToast('Pilih dompet tujuan yang berbeda!', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

        try {
            const batch = db.batch();
            const transRef = transactionsRef.doc();

            const transactionData = {
                description: desc,
                amount: amount,
                category: category,
                date: date,
                type: currentType,
                walletId: walletId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (currentType === 'transfer') {
                transactionData.toWalletId = toWalletId;
                const sourceRef = walletsRef.doc(walletId);
                const sourceDoc = await sourceRef.get();
                batch.update(sourceRef, { balance: (sourceDoc.data().balance || 0) - amount });
                const targetRef = walletsRef.doc(toWalletId);
                const targetDoc = await targetRef.get();
                batch.update(targetRef, { balance: (targetDoc.data().balance || 0) + amount });
            } else {
                const walletRef = walletsRef.doc(walletId);
                const walletDoc = await walletRef.get();
                const currentBalance = walletDoc.data().balance || 0;
                const newBalance = currentType === 'income' ? currentBalance + amount : currentBalance - amount;
                batch.update(walletRef, { balance: newBalance });
            }

            batch.set(transRef, transactionData);
            await batch.commit();

            descInput.value = '';
            amountInput.value = '';
            categorySelect.value = '';
            walletSelect.value = '';
            toWalletSelect.value = '';
            setTodayDate();

            showToast('Transaksi berhasil dicatat! ✓', 'success');
        } catch (error) {
            console.error('Error adding transaction:', error);
            showToast('Gagal menyimpan. Coba lagi!', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Tambah Transaksi';
        }
    });

    // ============================
    // FIREBASE: DELETE SINGLE
    // ============================
    confirmDeleteBtn.addEventListener('click', async () => {
        if (deleteTargetId) {
            try {
                await transactionsRef.doc(deleteTargetId).delete();
                deleteTargetId = null;
                deleteModal.classList.remove('active');
                showToast('Transaksi berhasil dihapus.', 'info');
            } catch (error) {
                showToast('Gagal menghapus. Coba lagi!', 'error');
            }
        }
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteTargetId = null;
        deleteModal.classList.remove('active');
    });

    // ============================
    // FIREBASE: DELETE ALL
    // ============================
    clearAllBtn.addEventListener('click', () => {
        if (transactions.length === 0) {
            showToast('Tidak ada data untuk dihapus.', 'error');
            return;
        }
        clearModal.classList.add('active');
    });

    confirmClearBtn.addEventListener('click', async () => {
        try {
            const batch = db.batch();
            const snapshot = await transactionsRef.get();
            snapshot.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            clearModal.classList.remove('active');
            showToast('Semua data berhasil dihapus.', 'info');
        } catch (error) {
            showToast('Gagal menghapus semua data.', 'error');
        }
    });

    cancelClearBtn.addEventListener('click', () => clearModal.classList.remove('active'));

    // ============================
    // EDIT TRANSACTION
    // ============================
    cancelEditBtn.onclick = () => { editModal.classList.remove('active'); editTargetId = null; };
    confirmEditBtn.onclick = async () => {
        if (!editTargetId) return;
        const desc = editDescInput.value.trim();
        const amount = parseInt(editAmountInput.value);
        const category = editCategorySelect.value;
        const date = editDateInput.value;

        if (!desc || isNaN(amount) || !date) return showToast('Lengkapi semua field!', 'error');

        confirmEditBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        confirmEditBtn.disabled = true;

        try {
            const batch = db.batch();
            const transRef = transactionsRef.doc(editTargetId);
            const oldTransDoc = await transRef.get();
            const oldData = oldTransDoc.data();

            // Logika Penyesuaian Saldo Dompet
            if (oldData.walletId && oldData.type !== 'transfer') {
                const walletRef = walletsRef.doc(oldData.walletId);
                const walletDoc = await walletRef.get();
                if (walletDoc.exists) {
                    let currentBalance = walletDoc.data().balance || 0;
                    
                    // 1. Kembalikan saldo lama (reversal)
                    if (oldData.type === 'income') currentBalance -= oldData.amount;
                    else if (oldData.type === 'expense') currentBalance += oldData.amount;

                    // 2. Terapkan saldo baru
                    if (oldData.type === 'income') currentBalance += amount;
                    else if (oldData.type === 'expense') currentBalance -= amount;

                    batch.update(walletRef, { balance: currentBalance });
                }
            }

            // Update data transaksi
            batch.update(transRef, { 
                description: desc, 
                amount: amount, 
                category: category, 
                date: date 
            });

            await batch.commit();
            
            editModal.classList.remove('active');
            editTargetId = null;
            showToast('Transaksi berhasil diperbarui!', 'success');
        } catch (e) {
            console.error('Update error:', e);
            showToast('Gagal memperbarui transaksi.', 'error');
        } finally {
            confirmEditBtn.innerHTML = 'Simpan Perubahan';
            confirmEditBtn.disabled = false;
        }
    };

    // Close modals on overlay click
    [deleteModal, clearModal, walletModal, goalModal, topupModal, executeModal, editModal, detailModal, genericConfirmModal, assetModal, debtModal, payDebtModal, adjustWalletModal].forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    closeDetailBtn.onclick = () => detailModal.classList.remove('active');

    // Redraw the doughnut when the viewport changes (canvas size is responsive)
    let _chartResizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(_chartResizeTimer);
        _chartResizeTimer = setTimeout(() => {
            renderChart();
            renderTrendChart();
        }, 200);
    });

    // ============================
    // AI FEATURES (Firebase AI Logic / Gemini)
    // ============================
    let waCtx = null;

    function aiErr(e) {
        const m = (e && e.message) ? String(e.message) : '';
        if (/app[-\s]?check/i.test(m)) return 'Permintaan AI ditolak App Check. Set VITE_RECAPTCHA_SITE_KEY & aktifkan App Check.';
        if (/api|enable|permission|403|not.*found|backend/i.test(m)) return 'AI belum aktif. Aktifkan "Firebase AI Logic" di Firebase Console.';
        return 'Gagal memanggil AI. Cek koneksi & konfigurasi Firebase AI Logic.';
    }

    function categoryOptionsFor(type) {
        const groupLabel = type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        const og = Array.from(categorySelect.querySelectorAll('optgroup')).find(g => g.label === groupLabel);
        const scope = og || categorySelect;
        return Array.from(scope.querySelectorAll('option')).map(o => o.value).filter(Boolean);
    }

    function gatherStats() {
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const balance = wallets.reduce((s, w) => s + (w.balance || 0), 0);
        const assetValue = assets.reduce((s, a) => s + (a.amount || 0), 0);
        const byCat = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const k = t.category || 'Lainnya';
            byCat[k] = (byCat[k] || 0) + t.amount;
        });
        const kategoriPengeluaranTeratas = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nama, jumlah]) => ({ nama, jumlah }));
        const dompetTeratas = [...wallets].sort((a, b) => (b.balance || 0) - (a.balance || 0)).slice(0, 5).map(w => ({ nama: w.name, saldo: w.balance || 0 }));
        const sisaPiutang = debts.filter(d => d.type === 'give').reduce((s, d) => s + ((d.totalAmount || 0) - (d.paidAmount || 0)), 0);
        const sisaHutang = debts.filter(d => d.type === 'take').reduce((s, d) => s + ((d.totalAmount || 0) - (d.paidAmount || 0)), 0);
        return {
            totalSaldo: balance, totalAset: assetValue,
            pemasukan: income, pengeluaran: expense, selisih: income - expense,
            tingkatMenabungPersen: income > 0 ? Math.round((income - expense) / income * 100) : 0,
            kategoriPengeluaranTeratas, dompetTeratas,
            sisaPiutang, sisaHutang, jumlahTransaksi: transactions.length,
        };
    }

    function openWaDraft({ phone, name, remaining, type }) {
        waCtx = { phone, name, remaining, type };
        const what = type === 'give' ? 'pinjaman' : 'hutang';
        const tmpl = `Halo ${name}, semoga sehat selalu 🙏. Saya ingin mengingatkan dengan baik mengenai ${what} yang tersisa sebesar ${formatCurrency(remaining)}. Mohon konfirmasinya ya, terima kasih banyak sebelumnya.`;
        const nameEl = document.getElementById('waDraftName');
        const textEl = document.getElementById('waDraftText');
        if (nameEl) nameEl.textContent = name || '';
        if (textEl) textEl.value = tmpl;
        document.getElementById('waDraftModal').classList.add('active');
    }

    // #2 — Auto-kategori
    const aiSuggestCat = document.getElementById('aiSuggestCat');
    if (aiSuggestCat) aiSuggestCat.addEventListener('click', async () => {
        const desc = descInput.value.trim();
        if (!desc) return showToast('Isi deskripsi dulu untuk saran kategori.', 'error');
        if (currentType === 'transfer') return showToast('Transfer tidak memerlukan kategori.', 'info');
        const original = aiSuggestCat.innerHTML;
        aiSuggestCat.disabled = true;
        aiSuggestCat.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        try {
            const cat = await suggestCategory({ description: desc, type: currentType, categories: categoryOptionsFor(currentType) });
            if (cat) { categorySelect.value = cat; showToast('Kategori disarankan: ' + cat, 'success'); }
            else showToast('AI belum yakin — pilih kategori manual ya.', 'info');
        } catch (e) { console.error(e); showToast(aiErr(e), 'error'); }
        finally { aiSuggestCat.disabled = false; aiSuggestCat.innerHTML = original; }
    });

    // #3 — Ringkasan & insight bulanan
    const aiInsightBtn = document.getElementById('aiInsightBtn');
    if (aiInsightBtn) aiInsightBtn.addEventListener('click', async () => {
        const out = document.getElementById('aiInsightContent');
        if (!transactions.length && !wallets.length) {
            out.classList.remove('ai-insight-empty');
            out.textContent = 'Belum ada data untuk dianalisis.';
            return;
        }
        const original = aiInsightBtn.innerHTML;
        aiInsightBtn.disabled = true;
        aiInsightBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menganalisis...';
        out.classList.remove('ai-insight-empty');
        out.textContent = 'Menganalisis keuanganmu…';
        try {
            out.textContent = await monthlyInsight(gatherStats());
        } catch (e) { console.error(e); out.textContent = aiErr(e); }
        finally { aiInsightBtn.disabled = false; aiInsightBtn.innerHTML = original; }
    });

    // #6 — Draf pesan WhatsApp (modal AI)
    const waDraftModal = document.getElementById('waDraftModal');
    if (waDraftModal) {
        waDraftModal.addEventListener('click', (e) => { if (e.target === waDraftModal) waDraftModal.classList.remove('active'); });
        document.getElementById('waDraftCancel').addEventListener('click', () => waDraftModal.classList.remove('active'));
        document.getElementById('waDraftSend').addEventListener('click', () => {
            if (!waCtx) return;
            const msg = encodeURIComponent(document.getElementById('waDraftText').value);
            window.open(`https://wa.me/${waCtx.phone}?text=${msg}`, '_blank');
            waDraftModal.classList.remove('active');
        });
        const waDraftAiBtn = document.getElementById('waDraftAiBtn');
        waDraftAiBtn.addEventListener('click', async () => {
            if (!waCtx) return;
            const original = waDraftAiBtn.innerHTML;
            waDraftAiBtn.disabled = true;
            waDraftAiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menulis...';
            try {
                const text = await debtReminder({ name: waCtx.name, remaining: waCtx.remaining, type: waCtx.type });
                if (text) document.getElementById('waDraftText').value = text;
            } catch (e) { console.error(e); showToast(aiErr(e), 'error'); }
            finally { waDraftAiBtn.disabled = false; waDraftAiBtn.innerHTML = original; }
        });
    }

    // #7 — Scan struk (multimodal)
    const scanReceiptBtn = document.getElementById('scanReceiptBtn');
    const receiptFile = document.getElementById('receiptFile');
    if (scanReceiptBtn && receiptFile) {
        scanReceiptBtn.addEventListener('click', () => receiptFile.click());
        receiptFile.addEventListener('change', async () => {
            const file = receiptFile.files && receiptFile.files[0];
            if (!file) return;
            const original = scanReceiptBtn.innerHTML;
            scanReceiptBtn.disabled = true;
            scanReceiptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Membaca struk...';
            try {
                const r = await extractReceipt(file);
                if (currentType !== 'expense') toggleExpense.click();
                if (r.total) amountInput.value = Math.round(r.total);
                if (r.merchant) descInput.value = r.merchant;
                if (r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date)) dateInput.value = r.date;
                if (r.category) {
                    const cats = categoryOptionsFor('expense');
                    const lc = String(r.category).toLowerCase();
                    const match = cats.find(c => c.toLowerCase() === lc) || cats.find(c => lc.includes(c.toLowerCase())) || cats.find(c => c.toLowerCase().includes(lc));
                    if (match) categorySelect.value = match;
                }
                switchTab('add');
                showToast('Struk terbaca! Periksa lalu simpan. ✓', 'success');
            } catch (e) { console.error(e); showToast(aiErr(e), 'error'); }
            finally { scanReceiptBtn.disabled = false; scanReceiptBtn.innerHTML = original; receiptFile.value = ''; }
        });
    }

    // ============================
    // RENDER ALL
    // ============================
    function renderAll() {
        updateSummary();
        renderTransactions();
        renderRecent();
        renderChart();
        renderTrendChart();
        renderDebts();
    }

    // ============================
    // UPDATE SUMMARY
    // ============================
    function updateSummary() {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
        const assetValue = assets.reduce((sum, a) => sum + (a.amount || 0), 0);

        // Kalkulasi kekayaan:
        // Piutang (give) = Harta kita yang ada di orang lain (+), jika lunas sisa 0
        // Hutang (take) = Kewajiban kita ke orang lain (-), jika lunas sisa 0
        const totalReceivableRemaining = debts.filter(d => d.type === 'give').reduce((sum, d) => sum + ((d.totalAmount || 0) - (d.paidAmount || 0)), 0);
        const totalPayableRemaining = debts.filter(d => d.type === 'take').reduce((sum, d) => sum + ((d.totalAmount || 0) - (d.paidAmount || 0)), 0);

        const wealth = balance + assetValue + totalReceivableRemaining - totalPayableRemaining;

        animateCount(totalWealthEl, wealth);
        animateCount(totalIncomeEl, income);
        animateCount(totalExpenseEl, expense);
        animateCount(totalBalanceEl, balance);

        // Mirror totals shown on the Dompet / Aset / Transaksi views
        animateCount(document.getElementById('walletsTotal'), balance);
        animateCount(document.getElementById('assetsTotal'), assetValue);
        animateCount(document.getElementById('histIncome'), income);
        animateCount(document.getElementById('histExpense'), expense);
        animateCount(document.getElementById('histDiff'), income - expense);
    }

    // Smooth count-up: animates from the previously shown value to the target.
    function animateCount(el, target) {
        if (!el) return;
        target = Math.round(target || 0);
        const from = (typeof el._cv === 'number') ? el._cv : 0;
        if (from === target) { el.textContent = formatCurrency(target); el._cv = target; return; }
        const dur = 750;
        const start = performance.now();
        el._cv = from;
        const step = (now) => {
            const p = Math.min(1, (now - start) / dur);
            const e = 1 - Math.pow(1 - p, 3);
            el.textContent = formatCurrency(Math.round(from + (target - from) * e));
            if (p < 1) requestAnimationFrame(step); else el._cv = target;
        };
        requestAnimationFrame(step);
    }

    // ============================
    // RENDER TRANSACTIONS
    // BUG FIX: Added "transfer" filter option
    // ============================
    function buildTxnItem(t, index) {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.style.animationDelay = `${Math.min(index, 12) * 0.03}s`;

        const iconClass = t.type === 'transfer' ? 'fas fa-exchange-alt' : (categoryIcons[t.category] || 'fas fa-circle');
        let sign = '';
        if (t.type === 'income') sign = '+';
        if (t.type === 'expense') sign = '−';
        const amountClass = t.type === 'transfer' ? 'transfer' : t.type;

        const walletName = wallets.find(w => w.id === t.walletId)?.name || '';
        const cat = t.category || (t.type === 'transfer' ? 'Transfer' : 'Lainnya');
        const meta = walletName ? `${cat} · ${walletName}` : cat;

        item.innerHTML = `
            <div class="transaction-left">
                <div class="transaction-icon ${amountClass}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-desc">${escapeHtml(t.description)}</div>
                    <div class="transaction-meta">${escapeHtml(meta)}</div>
                </div>
            </div>
            <div class="transaction-right">
                <span class="transaction-amount ${amountClass}">${sign} ${formatCurrency(t.amount)}</span>
                <span class="transaction-date">${formatShortDate(t.date)}</span>
            </div>
        `;
        item.onclick = () => showTransactionDetail(t);
        return item;
    }

    function formatShortDate(d) {
        try {
            return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        } catch (e) { return d || ''; }
    }

    function renderTransactions() {
        const filter = filterType.value;
        let filtered = transactions;

        if (filter === 'income') filtered = transactions.filter(t => t.type === 'income');
        else if (filter === 'expense') filtered = transactions.filter(t => t.type === 'expense');
        else if (filter === 'transfer') filtered = transactions.filter(t => t.type === 'transfer');

        transactionList.innerHTML = '';

        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.innerHTML = `
                <i class="fas fa-receipt"></i>
                <p>Belum ada transaksi.</p>
                <span>Mulai catat keuanganmu sekarang!</span>
            `;
            transactionList.appendChild(empty);
            return;
        }

        filtered.forEach((t, index) => transactionList.appendChild(buildTxnItem(t, index)));
    }

    function renderRecent() {
        const el = document.getElementById('dashRecentList');
        if (!el) return;
        el.innerHTML = '';
        const recent = transactions.slice(0, 5);
        if (recent.length === 0) {
            el.innerHTML = '<div class="empty-state-small" style="font-size:13px; color:var(--ink-3);">Belum ada transaksi</div>';
            return;
        }
        recent.forEach((t, i) => el.appendChild(buildTxnItem(t, i)));
    }

    function showTransactionDetail(t) {
        const iconClass = t.type === 'transfer' ? 'fas fa-exchange-alt' : (categoryIcons[t.category] || 'fas fa-circle');
        const formattedDate = new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        const walletName = wallets.find(w => w.id === t.walletId)?.name || 'Dompet';
        const toWalletName = t.toWalletId ? (wallets.find(w => w.id === t.toWalletId)?.name || 'Dompet') : '';
        const amountClass = t.type === 'transfer' ? 'transfer' : t.type;
        const sign = t.type === 'income' ? '+' : (t.type === 'expense' ? '-' : '');

        detailDescription.textContent = t.description;
        detailIcon.className = `modal-icon ${t.type}`;
        detailIcon.innerHTML = `<i class="${iconClass}"></i>`;

        detailContent.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value ${amountClass}">${t.type === 'income' ? 'Pemasukan' : (t.type === 'expense' ? 'Pengeluaran' : 'Transfer')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Jumlah</span>
                <span class="detail-value ${amountClass}">${sign} ${formatCurrency(t.amount)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Kategori</span>
                <span class="detail-value">${t.category || 'Transfer'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">${t.type === 'transfer' ? 'Dari' : 'Dompet'}</span>
                <span class="detail-value">${walletName}</span>
            </div>
            ${t.type === 'transfer' ? `
                <div class="detail-row">
                    <span class="detail-label">Ke</span>
                    <span class="detail-value">${toWalletName}</span>
                </div>
            ` : ''}
            <div class="detail-row">
                <span class="detail-label">Tanggal</span>
                <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="modal-actions" style="margin-top: 20px; display: flex; gap: 8px;">
                ${t.type !== 'transfer' ? `<button class="btn-modal btn-cancel edit-detail-btn" style="flex:1"><i class="fas fa-pen"></i> Edit</button>` : ''}
                <button class="btn-modal btn-confirm-delete delete-detail-btn" style="flex:1"><i class="fas fa-trash"></i> Hapus</button>
            </div>
        `;

        detailModal.classList.add('active');

        // Handle buttons inside detail modal
        const deleteBtn = detailContent.querySelector('.delete-detail-btn');
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                detailModal.classList.remove('active');
                deleteTargetId = t.id;
                deleteModal.classList.add('active');
            };
        }

        const editBtn = detailContent.querySelector('.edit-detail-btn');
        if (editBtn) {
            editBtn.onclick = () => {
                detailModal.classList.remove('active');
                editTargetId = t.id;
                editDescInput.value = t.description;
                editAmountInput.value = t.amount;
                editCategorySelect.value = t.category || '';
                editDateInput.value = t.date;
                editModal.classList.add('active');
            };
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Filter change
    filterType.addEventListener('change', renderTransactions);

    // Segmented filter control (drives the hidden <select id="filterType">)
    document.querySelectorAll('#txnFilterSeg .seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#txnFilterSeg .seg-btn').forEach(b => b.classList.toggle('on', b === btn));
            filterType.value = btn.dataset.filter;
            renderTransactions();
        });
    });

    // ============================
    // CHART (Pure Canvas Doughnut)
    // ============================
    function renderChart() {
        // Handle Desktop Chart
        if (chartCanvas && chartCanvas.offsetParent !== null) {
            drawDoughnut(chartCanvas, chartTotalAmount, chartLegend);
        }
        // Handle Mobile Chart
        if (chartCanvasMobile && chartCanvasMobile.offsetParent !== null) {
            drawDoughnut(chartCanvasMobile, chartTotalAmountMobile, chartLegendMobile);
        }
    }

    function drawDoughnut(canvas, totalEl, legendEl) {
        const ctx = canvas.getContext('2d');
        const size = canvas.parentElement.clientWidth;
        if (size === 0) return; // Not visible

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const centerX = size / 2;
        const centerY = size / 2;
        const outerRadius = size / 2 - 10;
        const innerRadius = outerRadius * 0.75;

        ctx.clearRect(0, 0, size, size);

        const expenseData = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
            });

        const categories = Object.keys(expenseData);
        const values = Object.values(expenseData);
        const total = values.reduce((a, b) => a + b, 0);

        if (totalEl) {
            totalEl.textContent = formatCurrency(total);
            const len = totalEl.textContent.length;
            if (len > 12) {
                totalEl.style.fontSize = '12px';
            } else if (len > 9) {
                totalEl.style.fontSize = '13.5px';
            } else {
                totalEl.style.fontSize = '16.5px';
            }
        }
        if (legendEl) legendEl.innerHTML = '';

        if (categories.length === 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
            ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
            ctx.fill();
            if (legendEl) legendEl.innerHTML = '<span class="legend-item" style="color: rgba(148,163,184,0.4);">Belum ada pengeluaran</span>';
            return;
        }

        let startAngle = -Math.PI / 2;
        const gap = 0.03;

        categories.forEach((cat, i) => {
            const sliceAngle = (values[i] / total) * (Math.PI * 2 - gap * categories.length);
            const color = chartColors[i % chartColors.length];

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            startAngle += sliceAngle + gap;

            if (legendEl) {
                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';
                const percentage = ((values[i] / total) * 100).toFixed(0);
                legendItem.innerHTML = `
                    <span class="legend-color" style="background: ${color}"></span>
                    ${cat} (${percentage}%)
                `;
                legendEl.appendChild(legendItem);
            }
        });
    }

    function renderTrendChart() {
        const canvas = document.getElementById('trendChart');
        if (!canvas || canvas.offsetParent === null) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth;
        const height = canvas.parentElement.clientHeight || 180;
        if (width === 0) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.style.width = width + 'px';
        ctx.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);

        // 1. Get the last 6 months labels & keys
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                year: d.getFullYear(),
                month: d.getMonth(),
                label: monthNames[d.getMonth()],
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            });
        }

        // 2. Sum income and expenses per month
        const incomeData = Array(6).fill(0);
        const expenseData = Array(6).fill(0);

        transactions.forEach(t => {
            if (!t.date) return;
            const tKey = t.date.substring(0, 7); // "YYYY-MM"
            const idx = months.findIndex(m => m.key === tKey);
            if (idx !== -1) {
                if (t.type === 'income') {
                    incomeData[idx] += t.amount;
                } else if (t.type === 'expense') {
                    expenseData[idx] += t.amount;
                }
            }
        });

        // 3. Find max value for Y scaling
        const maxVal = Math.max(...incomeData, ...expenseData, 100000); // at least 100k scale

        // 4. Drawing geometry
        const paddingLeft = 45;
        const paddingRight = 15;
        const paddingTop = 15;
        const paddingBottom = 25;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        // Draw grid lines & Y labels (3 ticks)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'var(--ink-3)';
        ctx.font = '10px var(--font-num)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let i = 0; i <= 2; i++) {
            const val = (maxVal / 2) * i;
            const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
            // Draw grid line
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(width - paddingRight, y);
            ctx.stroke();

            // Draw Y label
            let labelText = '';
            if (val >= 1000000) {
                labelText = (val / 1000000).toFixed(1) + 'M';
            } else if (val >= 1000) {
                labelText = (val / 1000).toFixed(0) + 'K';
            } else {
                labelText = val.toString();
            }
            ctx.fillText(labelText, paddingLeft - 8, y);
        }

        // Draw X labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const points = [];
        months.forEach((m, idx) => {
            const x = paddingLeft + (idx / 5) * chartWidth;
            ctx.fillText(m.label, x, height - paddingBottom + 8);
            points.push(x);
        });

        // Helper to draw line and area
        function drawTrendLine(data, strokeColor, fillColor) {
            ctx.beginPath();
            months.forEach((m, idx) => {
                const x = points[idx];
                const y = paddingTop + chartHeight - (data[idx] / maxVal) * chartHeight;
                if (idx === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Area under the line
            ctx.lineTo(points[5], paddingTop + chartHeight);
            ctx.lineTo(points[0], paddingTop + chartHeight);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
            grad.addColorStop(0, fillColor);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fill();

            // Draw dots at points
            months.forEach((m, idx) => {
                const x = points[idx];
                const y = paddingTop + chartHeight - (data[idx] / maxVal) * chartHeight;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = strokeColor;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'var(--bg-0)';
                ctx.fill();
            });
        }

        // Draw income line (green/pos)
        drawTrendLine(incomeData, 'var(--pos)', 'rgba(34, 197, 94, 0.1)');

        // Draw expense line (red/neg)
        drawTrendLine(expenseData, 'var(--neg)', 'rgba(239, 68, 68, 0.1)');
    }

    // ============================
    // TOAST NOTIFICATIONS
    // ============================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icons = { success: 'fas fa-check-circle', error: 'fas fa-times-circle', info: 'fas fa-info-circle' };
        toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================
    // INITIALIZE IS HANDLED BY onAuthStateChanged
    // ============================
});
