document.addEventListener('DOMContentLoaded', function() {
    // تهيئة البيانات
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const debts = JSON.parse(localStorage.getItem('debts')) || [];
    
    // عناصر DOM
    const reportType = document.getElementById('report-type');
    const reportMonth = document.getElementById('report-month');
    const reportChartEl = document.getElementById('reportChart');
    const reportTable = document.getElementById('report-table').querySelector('tbody');
    const reportIncomeEl = document.getElementById('report-income');
    const reportExpenseEl = document.getElementById('report-expense');
    const reportBalanceEl = document.getElementById('report-balance');
    const exportPdfBtn = document.getElementById('export-pdf');

    // تعيين الشهر الحالي كافتراضي
    if (reportMonth) {
        const today = new Date();
        reportMonth.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }

    // أحداث التغيير
    if (reportType) reportType.addEventListener('change', renderReport);
    if (reportMonth) reportMonth.addEventListener('change', renderReport);

    // حدث تصدير PDF
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function() {
            alert('سيتم تطوير ميزة التصدير إلى PDF في الإصدارات القادمة');
        });
    }

    // عرض التقرير
    function renderReport() {
        const type = reportType.value;
        const month = reportMonth.value;
        
        switch(type) {
            case 'monthly':
                renderMonthlyReport(month);
                break;
            case 'category':
                renderCategoryReport(month);
                break;
            case 'yearly':
                renderYearlyReport();
                break;
        }
    }

    // تقرير شهري
    function renderMonthlyReport(month) {
        // فلترة المعاملات حسب الشهر المحدد
        const filtered = transactions.filter(trx => {
            const trxDate = new Date(trx.date);
            const trxMonth = `${trxDate.getFullYear()}-${String(trxDate.getMonth() + 1).padStart(2, '0')}`;
            return trxMonth === month;
        });
        
        // حساب الإجماليات
        const income = filtered.reduce((sum, trx) => trx.type === 'income' ? sum + trx.amount : sum, 0);
        const expense = filtered.reduce((sum, trx) => trx.type === 'expense' ? sum + trx.amount : sum, 0);
        const balance = income - expense;
        
        // تحديث الإجماليات
        updateSummary(income, expense, balance);
        
        // تجميع البيانات حسب اليوم
        const daysInMonth = new Date(month.split('-')[0], month.split('-')[1], 0).getDate();
        const dailyData = Array(daysInMonth).fill().map((_, i) => ({
            day: i + 1,
            income: 0,
            expense: 0
        }));
        
        filtered.forEach(trx => {
            const day = new Date(trx.date).getDate() - 1;
            if (trx.type === 'income') {
                dailyData[day].income += trx.amount;
            } else {
                dailyData[day].expense += trx.amount;
            }
        });
        
        // عرض المخطط
        renderChart(
            Array(daysInMonth).fill().map((_, i) => i + 1),
            dailyData.map(d => d.income),
            dailyData.map(d => d.expense),
            'يوم'
        );
        
        // عرض الجدول
        renderTable([
            { category: 'المدخول', amount: income, percentage: 100 },
            { category: 'المصروف', amount: expense, percentage: 100 },
            { category: 'صافي الرصيد', amount: balance, percentage: 100 }
        ]);
    }

    // تقرير حسب الفئة
    function renderCategoryReport(month) {
        // فلترة المعاملات حسب الشهر المحدد
        const filtered = transactions.filter(trx => {
            if (!month) return true;
            const trxDate = new Date(trx.date);
            const trxMonth = `${trxDate.getFullYear()}-${String(trxDate.getMonth() + 1).padStart(2, '0')}`;
            return trxMonth === month;
        });
        
        // حساب الإجماليات
        const income = filtered.reduce((sum, trx) => trx.type === 'income' ? sum + trx.amount : sum, 0);
        const expense = filtered.reduce((sum, trx) => trx.type === 'expense' ? sum + trx.amount : sum, 0);
        const balance = income - expense;
        
        // تحديث الإجماليات
        updateSummary(income, expense, balance);
        
        // تجميع البيانات حسب الفئة
        const categories = {};
        
        filtered.forEach(trx => {
            if (!categories[trx.category]) {
                categories[trx.category] = { income: 0, expense: 0 };
            }
            
            if (trx.type === 'income') {
                categories[trx.category].income += trx.amount;
            } else {
                categories[trx.category].expense += trx.amount;
            }
        });
        
        // تحضير البيانات للرسم البياني
        const labels = Object.keys(categories);
        const incomeData = labels.map(cat => categories[cat].income);
        const expenseData = labels.map(cat => categories[cat].expense);
        
        // عرض المخطط
        renderChart(
            labels.map(cat => getCategoryName(cat)),
            incomeData,
            expenseData,
            'فئة'
        );
        
        // تحضير البيانات للجدول
        const tableData = labels.map(cat => ({
            category: getCategoryName(cat),
            amount: categories[cat].income + categories[cat].expense,
            percentage: ((categories[cat].income + categories[cat].expense) / (income + expense)) * 100
        }));
        
        // عرض الجدول
        renderTable(tableData);
    }

    // تقرير سنوي
    function renderYearlyReport() {
        // حساب الإجماليات
        const income = transactions.reduce((sum, trx) => trx.type === 'income' ? sum + trx.amount : sum, 0);
        const expense = transactions.reduce((sum, trx) => trx.type === 'expense' ? sum + trx.amount : sum, 0);
        const balance = income - expense;
        
        // تحديث الإجماليات
        updateSummary(income, expense, balance);
        
        // تجميع البيانات حسب الشهر
        const monthlyData = Array(12).fill().map(() => ({ income: 0, expense: 0 }));
        
        transactions.forEach(trx => {
            const month = new Date(trx.date).getMonth();
            if (trx.type === 'income') {
                monthlyData[month].income += trx.amount;
            } else {
                monthlyData[month].expense += trx.amount;
            }
        });
        
        // عرض المخطط
        renderChart(
            ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
            monthlyData.map(m => m.income),
            monthlyData.map(m => m.expense),
            'شهر'
        );
        
        // عرض الجدول
        renderTable([
            { category: 'المدخول السنوي', amount: income, percentage: 100 },
            { category: 'المصروف السنوي', amount: expense, percentage: 100 },
            { category: 'صافي الرصيد', amount: balance, percentage: 100 }
        ]);
    }

    // عرض المخطط
    function renderChart(labels, incomeData, expenseData, labelType) {
        if (!reportChartEl) return;
        
        const ctx = reportChartEl.getContext('2d');
        
        // إذا كان هناك مخطط موجود، قم بتدميره أولاً
        if (reportChartEl.chart) {
            reportChartEl.chart.destroy();
        }
        
        reportChartEl.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'مدخول',
                        data: incomeData,
                        backgroundColor: 'rgba(76, 201, 240, 0.7)',
                        borderColor: 'rgba(76, 201, 240, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'مصروف',
                        data: expenseData,
                        backgroundColor: 'rgba(247, 37, 133, 0.7)',
                        borderColor: 'rgba(247, 37, 133, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw.toFixed(2)} جنيه`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + ' ج';
                            }
                        }
                    }
                }
            }
        });
    }

    // عرض الجدول
    function renderTable(data) {
        if (!reportTable) return;
        reportTable.innerHTML = '';
        
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.category}</td>
                <td>${item.amount.toFixed(2)} جنيه</td>
                <td>${item.percentage.toFixed(1)}%</td>
            `;
            reportTable.appendChild(row);
        });
    }

    // تحديث ملخص التقرير
    function updateSummary(income, expense, balance) {
        if (reportIncomeEl) reportIncomeEl.textContent = income.toFixed(2) + ' جنيه';
        if (reportExpenseEl) reportExpenseEl.textContent = expense.toFixed(2) + ' جنيه';
        if (reportBalanceEl) {
            reportBalanceEl.textContent = balance.toFixed(2) + ' جنيه';
            reportBalanceEl.style.color = balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
        }
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
    renderReport();
});
