document.addEventListener('DOMContentLoaded', function() {
    // تهيئة البيانات
    let debts = JSON.parse(localStorage.getItem('debts')) || [];

    // عناصر DOM
    const form = document.getElementById('debt-form');
    const list = document.getElementById('debt-list');
    const owedAmountEl = document.getElementById('owed-amount');
    const debtAmountEl = document.getElementById('debt-amount');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');

    // تعيين تاريخ اليوم كافتراضي
    if (document.getElementById('date')) {
        document.getElementById('date').valueAsDate = new Date();
    }

    // حدث إضافة دين
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const amount = parseFloat(document.getElementById('amount').value);
            const type = document.getElementById('type').value;
            const note = document.getElementById('note').value;
            const date = document.getElementById('date').value;
            
            if (!name || !amount || isNaN(amount) || !type || !date) {
                alert('الرجاء إدخال جميع البيانات المطلوبة');
                return;
            }
            
            debts.unshift({
                name,
                amount,
                type,
                note,
                date: formatDate(date),
                status: 'pending'
            });
            
            saveDebts();
            renderDebts();
            form.reset();
            document.getElementById('date').valueAsDate = new Date();
        });
    }

    // أحداث البحث والتصفية
    if (searchInput) searchInput.addEventListener('input', renderDebts);
    if (statusFilter) statusFilter.addEventListener('change', renderDebts);

    // عرض الديون
    function renderDebts() {
        if (!list) return;
        list.innerHTML = '';
        
        // تطبيق الفلاتر
        let filtered = debts.filter(debt => {
            let match = true;
            
            // فلترة حسب البحث
            const searchTerm = searchInput?.value.toLowerCase();
            if (searchTerm && !(
                debt.name.toLowerCase().includes(searchTerm) || 
                debt.amount.toString().includes(searchTerm) ||
                debt.note?.toLowerCase().includes(searchTerm)
            )) {
                match = false;
            }
            
            // فلترة حسب الحالة
            const selectedStatus = statusFilter?.value;
            if (selectedStatus && debt.status !== selectedStatus) {
                match = false;
            }
            
            return match;
        });
        
        // تحديث الإجماليات
        updateTotals();
        
        // عرض النتائج
        if (filtered.length === 0) {
            list.innerHTML = '<div class="no-results">لا توجد ديون لعرضها</div>';
            return;
        }
        
        filtered.forEach((debt, index) => {
            const item = document.createElement('div');
            item.className = `debt-item ${debt.type}`;
            item.innerHTML = `
                <div class="debt-details">
                    <div class="debt-name">${debt.name}</div>
                    <div class="debt-note">${debt.note || 'لا يوجد وصف'}</div>
                    <div class="debt-date">${debt.date}</div>
                    <div class="debt-status ${debt.status}">
                        ${debt.status === 'paid' ? 'مسددة' : 'قيد السداد'}
                    </div>
                </div>
                <div class="debt-amount">
                    ${debt.amount.toFixed(2)} جنيه
                </div>
                <div class="debt-actions">
                    <button class="status-btn" data-id="${index}">
                        <i class="fas fa-${debt.status === 'paid' ? 'undo' : 'check'}"></i>
                    </button>
                    <button class="delete-btn" data-id="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            list.appendChild(item);
        });
        
        // أحداث الأزرار
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-id'));
                debts[index].status = debts[index].status === 'paid' ? 'pending' : 'paid';
                saveDebts();
                renderDebts();
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-id'));
                if (confirm('هل تريد حذف هذا الدين؟')) {
                    debts.splice(index, 1);
                    saveDebts();
                    renderDebts();
                }
            });
        });
    }

    // تحديث الإجماليات
    function updateTotals() {
        const owedTotal = debts.reduce((total, debt) => {
            return debt.type === 'owed' ? total + parseFloat(debt.amount) : total;
        }, 0);
        
        const debtTotal = debts.reduce((total, debt) => {
            return debt.type === 'debt' ? total + parseFloat(debt.amount) : total;
        }, 0);
        
        if (owedAmountEl) owedAmountEl.textContent = owedTotal.toFixed(2) + ' جنيه';
        if (debtAmountEl) debtAmountEl.textContent = debtTotal.toFixed(2) + ' جنيه';
    }

    // حفظ البيانات
    function saveDebts() {
        localStorage.setItem('debts', JSON.stringify(debts));
        if (window.updateStats) window.updateStats();
    }

    // تنسيق التاريخ
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    }

    // التحميل الأولي
    renderDebts();
});
