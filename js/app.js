// =========================================
//  CASHFLOW — FINANCE TRACKER APP
//  Storage: Firebase Firestore
// =========================================

document.addEventListener('DOMContentLoaded', () => {
    // Firestore reference
    const db = window.db;
    const transactionsRef = db.collection('transactions');

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

    // State
    let transactions = [];
    let currentType = 'income';
    let deleteTargetId = null;

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
        'Lainnya (Keluar)': 'fas fa-box'
    };

    // Chart colors
    const chartColors = [
        '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
        '#06b6d4', '#84cc16', '#e11d48', '#6366f1'
    ];

    // ============================
    // INIT
    // ============================
    async function init() {
        setTodayDate();
        displayDate();
        await migrateFromLocalStorage();
        loadTransactions();
    }

    // ============================
    // MIGRATE localStorage → Firestore
    // ============================
    async function migrateFromLocalStorage() {
        const localData = localStorage.getItem('cashflow_transactions');
        if (!localData) return; // No old data, skip

        let oldTransactions = [];
        try {
            oldTransactions = JSON.parse(localData);
        } catch (e) {
            return; // Invalid data, skip
        }

        if (!Array.isArray(oldTransactions) || oldTransactions.length === 0) return;

        // Show migration toast
        showToast(`Memigrasikan ${oldTransactions.length} transaksi ke cloud...`, 'info');

        try {
            // Use batch write (max 500 per batch)
            const batchSize = 500;
            for (let i = 0; i < oldTransactions.length; i += batchSize) {
                const batch = db.batch();
                const chunk = oldTransactions.slice(i, i + batchSize);

                chunk.forEach((t) => {
                    const docRef = transactionsRef.doc(); // auto-ID
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

            // Clear localStorage after successful migration
            localStorage.removeItem('cashflow_transactions');

            showToast(`✅ ${oldTransactions.length} transaksi berhasil dipindahkan ke Firebase!`, 'success');
        } catch (error) {
            console.error('Migration error:', error);
            showToast('Gagal migrasi data. Data lokal tetap aman.', 'error');
        }
    }

    function setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    function displayDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('id-ID', options);
    }

    // ============================
    // FORMAT CURRENCY
    // ============================
    function formatCurrency(amount) {
        return 'Rp ' + amount.toLocaleString('id-ID');
    }

    // ============================
    // TOGGLE TYPE
    // ============================
    toggleIncome.addEventListener('click', () => {
        currentType = 'income';
        toggleIncome.classList.add('active');
        toggleExpense.classList.remove('active');
    });

    toggleExpense.addEventListener('click', () => {
        currentType = 'expense';
        toggleExpense.classList.add('active');
        toggleIncome.classList.remove('active');
    });

    // ============================
    // FIREBASE: LOAD TRANSACTIONS (real-time)
    // ============================
    function loadTransactions() {
        // Show loading state
        transactionList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Memuat data...</p>
            </div>
        `;

        // Listen for real-time updates
        transactionsRef
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                transactions = [];
                snapshot.forEach((doc) => {
                    transactions.push({
                        id: doc.id,
                        ...doc.data()
                    });
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
        const category = categorySelect.value;
        const date = dateInput.value;

        if (!desc || !amount || !category || !date) {
            showToast('Lengkapi semua field!', 'error');
            return;
        }

        // Disable button while saving
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

        try {
            await transactionsRef.add({
                description: desc,
                amount: amount,
                category: category,
                date: date,
                type: currentType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Reset form
            descInput.value = '';
            amountInput.value = '';
            categorySelect.value = '';
            setTodayDate();

            showToast(
                currentType === 'income' ? 'Pemasukan berhasil ditambahkan!' : 'Pengeluaran berhasil dicatat!',
                'success'
            );
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
                console.error('Error deleting:', error);
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
            // Delete all documents in batch
            const batch = db.batch();
            const snapshot = await transactionsRef.get();
            snapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            clearModal.classList.remove('active');
            showToast('Semua data berhasil dihapus.', 'info');
        } catch (error) {
            console.error('Error clearing all:', error);
            showToast('Gagal menghapus semua data.', 'error');
        }
    });

    cancelClearBtn.addEventListener('click', () => {
        clearModal.classList.remove('active');
    });

    // Close modals on overlay click
    [deleteModal, clearModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // ============================
    // RENDER ALL
    // ============================
    function renderAll() {
        updateSummary();
        renderTransactions();
        renderChart();
    }

    // ============================
    // UPDATE SUMMARY
    // ============================
    function updateSummary() {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expense;

        totalIncomeEl.textContent = formatCurrency(income);
        totalExpenseEl.textContent = formatCurrency(expense);
        totalBalanceEl.textContent = formatCurrency(balance);

        animateValue(totalIncomeEl);
        animateValue(totalExpenseEl);
        animateValue(totalBalanceEl);
    }

    function animateValue(element) {
        element.style.transition = 'transform 0.2s ease';
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }

    // ============================
    // RENDER TRANSACTIONS
    // ============================
    function renderTransactions() {
        const filter = filterType.value;
        let filtered = transactions;

        if (filter === 'income') {
            filtered = transactions.filter(t => t.type === 'income');
        } else if (filter === 'expense') {
            filtered = transactions.filter(t => t.type === 'expense');
        }

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

        filtered.forEach((t, index) => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            item.style.animationDelay = `${index * 0.05}s`;

            const iconClass = categoryIcons[t.category] || 'fas fa-circle';
            const sign = t.type === 'income' ? '+' : '-';
            const formattedDate = new Date(t.date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            item.innerHTML = `
                <div class="transaction-left">
                    <div class="transaction-icon ${t.type}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-desc">${escapeHtml(t.description)}</div>
                        <div class="transaction-meta">
                            <span><i class="fas fa-tag"></i> ${t.category}</span>
                            <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
                        </div>
                    </div>
                </div>
                <div class="transaction-right">
                    <span class="transaction-amount ${t.type}">${sign} ${formatCurrency(t.amount)}</span>
                    <button class="btn-delete" data-id="${t.id}" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            transactionList.appendChild(item);
        });

        // Attach delete handlers
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                deleteTargetId = e.currentTarget.dataset.id;
                deleteModal.classList.add('active');
            });
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================
    // FILTER
    // ============================
    filterType.addEventListener('change', renderTransactions);

    // ============================
    // CHART (Pure Canvas Doughnut)
    // ============================
    function renderChart() {
        const ctx = chartCanvas.getContext('2d');
        const size = chartCanvas.parentElement.clientWidth;
        const dpr = window.devicePixelRatio || 1;
        chartCanvas.width = size * dpr;
        chartCanvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const centerX = size / 2;
        const centerY = size / 2;
        const outerRadius = size / 2 - 10;
        const innerRadius = outerRadius * 0.65;

        ctx.clearRect(0, 0, size, size);

        // Gather expense data grouped by category
        const expenseData = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
            });

        const categories = Object.keys(expenseData);
        const values = Object.values(expenseData);
        const total = values.reduce((a, b) => a + b, 0);

        chartTotalAmount.textContent = formatCurrency(total);

        chartLegend.innerHTML = '';

        if (categories.length === 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
            ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
            ctx.fill();

            chartLegend.innerHTML = '<span class="legend-item" style="color: rgba(148,163,184,0.4);">Belum ada pengeluaran</span>';
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

            ctx.shadowBlur = 0;

            startAngle += sliceAngle + gap;

            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            const percentage = ((values[i] / total) * 100).toFixed(0);
            legendItem.innerHTML = `
                <span class="legend-color" style="background: ${color}"></span>
                ${cat} (${percentage}%)
            `;
            chartLegend.appendChild(legendItem);
        });
    }

    // ============================
    // TOAST NOTIFICATIONS
    // ============================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // ============================
    // INITIALIZE
    // ============================
    init();
});
