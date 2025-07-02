document.addEventListener('DOMContentLoaded', function() {
    // تهيئة البيانات إذا لم تكن موجودة
    if (!localStorage.getItem('transactions')) {
        localStorage.setItem('transactions', JSON.stringify([]));
    }
    if (!localStorage.getItem('debts')) {
        localStorage.setItem('debts', JSON.stringify([]));
    }

    // تحميل البيانات
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const debts = JSON.parse(localStorage.getItem('debts')) || [];

    // تحديث الإحصائيات
    updateStats();

    // إنشاء المخطط إذا كان موجوداً في الصفحة
    if (document.getElementById('monthlyChart')) {
        renderMonthlyChart();
    }

    function updateStats() {
        const totalIncome = transactions.reduce((total, trx) => {
            return trx.type === 'income' ? total + parseFloat(trx.amount) : total;
        }, 0);

        const totalExpense = transactions.reduce((total, trx) => {
            return trx.type === 'expense' ? total + parseFloat(trx.amount) : total;
        }, 0);

        const currentBalance = totalIncome - totalExpense;
        const totalOwed = debts.reduce((total, debt) => {
            return debt.type === 'owed' ? total + parseFloat(debt.amount) : total;
        }, 0);

        // تحديث العناصر إذا كانت موجودة
        if (document.getElementById('total-income')) {
            document.getElementById('total-income').textContent = totalIncome.toFixed(2) + ' جنيه';
        }
        if (document.getElementById('total-expense')) {
            document.getElementById('total-expense').textContent = totalExpense.toFixed(2) + ' جنيه';
        }
        if (document.getElementById('current-balance')) {
            document.getElementById('current-balance').textContent = currentBalance.toFixed(2) + ' جنيه';
            document.getElementById('current-balance').style.color = currentBalance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';
        }
        if (document.getElementById('total-debts')) {
            document.getElementById('total-debts').textContent = totalOwed.toFixed(2) + ' جنيه';
        }
    }

    function renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        // تجميع البيانات الشهرية
        const monthlyData = Array(12).fill().map(() => ({ income: 0, expense: 0 }));
        
        transactions.forEach(trx => {
            const date = new Date(trx.date);
            const month = date.getMonth();
            
            if (trx.type === 'income') {
                monthlyData[month].income += parseFloat(trx.amount);
            } else {
                monthlyData[month].expense += parseFloat(trx.amount);
            }
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'مدخول',
                        data: monthlyData.map(m => m.income),
                        backgroundColor: 'rgba(76, 201, 240, 0.7)',
                        borderColor: 'rgba(76, 201, 240, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'مصروف',
                        data: monthlyData.map(m => m.expense),
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

    // جعل الدوال متاحة للصفحات الأخرى
    window.updateStats = updateStats;
});
