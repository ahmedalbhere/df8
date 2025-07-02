document.addEventListener('DOMContentLoaded', function() {
    // تهيئة البيانات
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let currentFilter = 'all';

    // عناصر DOM
    const form = document.getElementById('transaction-form');
    const list = document.getElementById('transaction-list');
    const searchInput = document.getElementById('search-input');
    const monthFilter = document.getElementById('month-filter');
    
    // تعيين تاريخ اليوم كافتراضي
    if (document.getElementById('date')) {
        document.getElementById('date').valueAsDate = new Date();
    }

    // أحداث التبويبات
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.id.replace('-tab', '');
            renderTransactions();
        });
    });

    // حدث البحث
    if (searchInput) searchInput.addEventListener('input', renderTransactions);
    if (monthFilter) monthFilter.addEventListener('change', renderTransactions);

    // حدث إضافة معاملة
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const type = document.getElementById('type').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const note = document.getElementById('note').value;
            const category = document.getElementById('category').value;
            const date = document.getElementById('date').value;
            
            if (!type || !amount || isNaN(amount) || !category || !date) {
                alert('الرجاء إدخال جميع البيانات المطلوبة');
                return;
            }
            
            transactions.unshift({
                type,
                amount,
                note,
                category,
                date: formatDate(date)
            });
            
            saveTransactions();
            renderTransactions();
            form.reset();
            document.getElementById('date').valueAsDate = new Date();
        });
    }

    // عرض المعاملات
    function renderTransactions() {
        if (!list) return;
        list.innerHTML = '';
        
        // تطبيق الفلاتر
        let filtered = transactions.filter(trx => {
            let match = true;
            
            // فلترة حسب النوع
            if (currentFilter !== 'all' && trx.type !== currentFilter) {
                match = false;
            }
            
            // فلترة حسب البحث
            const searchTerm = searchInput?.value.toLowerCase();
            if (searchTerm && !(
                trx.note?.toLowerCase().includes(searchTerm) || 
                trx.amount.toString().includes(searchTerm) ||
                trx.category?.toLowerCase().includes(searchTerm)
            )) {
                match = false;
            }
            
            // فلترة حسب الشهر
            const selectedMonth = monthFilter?.value;
            if (selectedMonth) {
                const trxMonth = new Date(trx.date).getMonth() + 1;
                if (trxMonth.toString() !== selectedMonth) {
                    match = false;
                }
            }
            
            return match;
        });
        
        // عرض النتائج
        if (filtered.length === 0) {
            list.innerHTML = '<div class="no-results">لا توجد معاملات لعرضها</div>';
            return;
        }
        
        filtered.forEach((trx, index) => {
            const item = document.createElement('div');
            item.className = `transaction-item ${trx.type}`;
            item.innerHTML = `
                <div class="transaction-details">
                    <div class="transaction-title">
                        ${trx.type === 'income' ? 'مدخول' : 'مصروف'} - ${getCategoryName(trx.category)}
                    </div>
                    <div class="transaction-note">${trx.note || 'لا يوجد وصف'}</div>
                    <div class="transaction-date">${trx.date}</div>
                </div>
                <div class="transaction-amount">
                    ${trx.amount.toFixed(2)} جنيه
                </div>
                <button class="delete-btn" data-id="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            list.appendChild(item);
        });
        
        // أحداث الحذف
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-id'));
                if (confirm('هل تريد حذف هذه المعاملة؟')) {
                    transactions.splice(index, 1);
                    saveTransactions();
                    renderTransactions();
                }
            });
        });
    }

    // حفظ البيانات
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        if (window.updateStats) window.updateStats();
    }

    // تنسيق التاريخ
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    }

    // اسم الفئة
    function getCategoryName(category) {
        const categories = {
            'salary': 'راتب',
            'investment': 'استثمار',
            'gift': 'هدية',
            'food': 'طعام',
            'transport': 'مواصلات',
            'bills': 'فواتير',
            'shopping': 'تسوق',
            'other-income': 'أخرى (مدخول)',
            'other-expense': 'أخرى (مصروف)'
        };
        return categories[category] || 'عام';
    }

    // التحميل الأولي
    renderTransactions();
});
