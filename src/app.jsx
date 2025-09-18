import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = "stk-expenses-v1";

const TABS = [
  { id: "overview", label: "Tổng quan" },
  { id: "transactions", label: "Giao dịch" },
  { id: "reports", label: "Báo cáo" },
];

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const SAMPLE_EXPENSES = [
  {
    id: createId(),
    description: "Cà phê sáng",
    amount: 45000,
    date: new Date().toISOString().slice(0, 10),
    category: "Đồ uống",
    note: "Latte ở quán quen",
  },
  {
    id: createId(),
    description: "Ăn trưa",
    amount: 95000,
    date: new Date().toISOString().slice(0, 10),
    category: "Ăn uống",
    note: "Cơm văn phòng",
  },
  {
    id: createId(),
    description: "Grab đi làm",
    amount: 68000,
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    category: "Di chuyển",
    note: "",
  },
];

const CATEGORY_KEYWORDS = [
  { category: "Ăn uống", patterns: ["ăn", "cơm", "phở", "bún", "trưa", "tối"] },
  { category: "Đồ uống", patterns: ["cà phê", "trà", "nước", "milk", "cafe"] },
  { category: "Di chuyển", patterns: ["grab", "taxi", "bus", "xăng", "vé", "tàu"] },
  { category: "Mua sắm", patterns: ["mua", "shop", "áo", "quần", "điện"] },
  { category: "Giải trí", patterns: ["xem phim", "netflix", "game", "nhạc"] },
];

function loadInitialExpenses() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Không thể đọc dữ liệu đã lưu", error);
  }
  return SAMPLE_EXPENSES;
}

function getDefaultFormState() {
  return {
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    note: "",
    quickEntry: "",
  };
}

function formatCurrency(amount) {
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function inferCategory(description) {
  const normalized = description.toLowerCase();
  for (const { category, patterns } of CATEGORY_KEYWORDS) {
    if (patterns.some((pattern) => normalized.includes(pattern))) {
      return category;
    }
  }
  return "Khác";
}

function parseAmount(value) {
  if (!value) return 0;
  const cleaned = value
    .toString()
    .toLowerCase()
    .replace(/[.,]/g, "")
    .trim();

  const match = cleaned.match(/(\d+)(k|ngan|ngàn|000)?/);
  if (!match) return Number.parseInt(cleaned, 10) || 0;

  const amount = Number.parseInt(match[1], 10);
  const hasK = match[2];
  return hasK ? amount * 1000 : amount;
}

function parseQuickEntry(text) {
  if (!text) return null;
  const amountMatch = text.match(/(\d+[.,]?\d*)(\s?k|\s?ng[àa]n)?/i);
  const amount = amountMatch ? parseAmount(amountMatch[0]) : 0;
  const description = amountMatch
    ? text.replace(amountMatch[0], "").replace(/[,.;-]+$/, "").trim()
    : text.trim();

  return {
    description: description || "Chi tiêu chưa đặt tên",
    amount,
    note: text.trim(),
  };
}

function generateMonthlyReport(expenses) {
  const report = expenses.reduce((acc, expense) => {
    const month = expense.date.slice(0, 7);
    if (!acc[month]) {
      acc[month] = { total: 0, transactions: 0, categories: {} };
    }
    acc[month].total += expense.amount;
    acc[month].transactions += 1;
    acc[month].categories[expense.category] =
      (acc[month].categories[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  return Object.entries(report)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));
}

function generateInsights(expenses) {
  if (expenses.length === 0) {
    return {
      topCategory: null,
      averageDaily: 0,
      predictedNextMonth: 0,
      streak: 0,
    };
  }

  const totalsByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const [topCategory, topTotal] = Object.entries(totalsByCategory).reduce(
    (max, entry) => (entry[1] > max[1] ? entry : max),
    ["", 0],
  );

  const days = new Set(expenses.map((expense) => expense.date)).size;
  const averageDaily = expenses.reduce((sum, e) => sum + e.amount, 0) / days;

  const monthlyReport = generateMonthlyReport(expenses);
  const lastTwoMonths = monthlyReport.slice(0, 2);
  const predictedNextMonth =
    lastTwoMonths.reduce((sum, month) => sum + month.total, 0) /
    Math.max(lastTwoMonths.length, 1);

  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  const expenseByDate = expenses.reduce((acc, expense) => {
    acc[expense.date] = (acc[expense.date] || 0) + expense.amount;
    return acc;
  }, {});

  let cursor = new Date(today);
  while (expenseByDate[cursor.toISOString().slice(0, 10)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    topCategory: topCategory ? { name: topCategory, total: topTotal } : null,
    averageDaily,
    predictedNextMonth,
    streak,
  };
}

function App() {
  const [expenses, setExpenses] = useState(loadInitialExpenses);
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(getDefaultFormState);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const monthlyReport = useMemo(
    () => generateMonthlyReport(expenses),
    [expenses],
  );

  const insights = useMemo(() => generateInsights(expenses), [expenses]);

  const categoryBreakdown = useMemo(() => {
    const totals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const recentExpenses = useMemo(() => expenses.slice(0, 5), [expenses]);

  function openModal() {
    setForm(getDefaultFormState());
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    let payload;

    if (form.quickEntry.trim()) {
      payload = parseQuickEntry(form.quickEntry.trim());
    } else {
      payload = {
        description: form.description.trim() || "Chi tiêu chưa đặt tên",
        amount: parseAmount(form.amount),
        note: form.note.trim(),
      };
    }

    if (!payload || !payload.amount) {
      setFormError("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    const date = form.date || new Date().toISOString().slice(0, 10);
    const category = inferCategory(payload.description);

    const newExpense = {
      id: createId(),
      description: payload.description,
      amount: payload.amount,
      date,
      category,
      note: payload.note || "",
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setForm(getDefaultFormState());
    setFormError("");
    setModalOpen(false);
    setActiveTab("transactions");
  }

  function handleDelete(id) {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Trợ lý chi tiêu</h1>
          <p>Ghi chép nhẹ nhàng, theo dõi rõ ràng mỗi ngày.</p>
        </div>
        <button type="button" className="primary-button" onClick={openModal}>
          + Ghi nhận
        </button>
      </header>

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-button${activeTab === tab.id ? " is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-body">
        {activeTab === "overview" && (
          <OverviewPanel
            total={total}
            insights={insights}
            categoryBreakdown={categoryBreakdown}
            recentExpenses={recentExpenses}
            onDelete={handleDelete}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionsPanel expenses={expenses} onDelete={handleDelete} />
        )}

        {activeTab === "reports" && <ReportsPanel monthlyReport={monthlyReport} />}
      </main>

      {isModalOpen && (
        <ExpenseModal
          form={form}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onClose={closeModal}
          error={formError}
        />
      )}
    </div>
  );
}

function OverviewPanel({ total, insights, categoryBreakdown, recentExpenses, onDelete }) {
  return (
    <div className="panel-stack">
      <section className="card">
        <header className="card-header">
          <div>
            <h2>Số liệu nhanh</h2>
            <p>Điểm qua tình hình chi tiêu nổi bật của bạn.</p>
          </div>
        </header>
        <div className="stat-grid">
          <StatCard label="Tổng chi tiêu" value={formatCurrency(total)} tone="primary" />
          <StatCard
            label="Trung bình mỗi ngày"
            value={formatCurrency(Math.round(insights.averageDaily || 0))}
          />
          <StatCard
            label="Dự đoán tháng tới"
            value={formatCurrency(Math.round(insights.predictedNextMonth || 0))}
          />
          <StatCard label="Chuỗi ngày chi tiêu" value={`${insights.streak} ngày`} />
        </div>
        {insights.topCategory && (
          <div className="highlight-pill">
            Chi nhiều nhất: <strong>{insights.topCategory.name}</strong> ·{' '}
            {formatCurrency(insights.topCategory.total)}
          </div>
        )}
        {categoryBreakdown.length > 0 && (
          <div className="category-breakdown">
            {categoryBreakdown.slice(0, 3).map((item) => (
              <div key={item.category} className="category-chip">
                <span>{item.category}</span>
                <strong>{formatCurrency(item.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Ghi nhận gần đây</h2>
            <p>Cập nhật 5 giao dịch mới nhất.</p>
          </div>
        </header>
        <ExpenseList
          expenses={recentExpenses}
          onDelete={onDelete}
          emptyMessage="Chưa có giao dịch nào, hãy ghi nhận chi tiêu đầu tiên."
        />
      </section>
    </div>
  );
}

function TransactionsPanel({ expenses, onDelete }) {
  return (
    <section className="card">
      <header className="card-header">
        <div>
          <h2>Danh sách giao dịch</h2>
          <p>Quản lý mọi khoản chi tiêu trong một nơi.</p>
        </div>
      </header>
      <ExpenseList
        expenses={expenses}
        onDelete={onDelete}
        emptyMessage="Chưa có giao dịch nào, hãy nhấn Ghi nhận để thêm."
      />
    </section>
  );
}

function ReportsPanel({ monthlyReport }) {
  if (monthlyReport.length === 0) {
    return (
      <section className="card">
        <header className="card-header">
          <div>
            <h2>Báo cáo theo tháng</h2>
            <p>Tổng hợp chi tiêu từng tháng.</p>
          </div>
        </header>
        <EmptyState message="Chưa có dữ liệu để lập báo cáo." />
      </section>
    );
  }

  return (
    <section className="card">
      <header className="card-header">
        <div>
          <h2>Báo cáo theo tháng</h2>
          <p>Nhìn lại bức tranh chi tiêu theo từng tháng.</p>
        </div>
      </header>
      <div className="report-grid">
        {monthlyReport.map((month) => (
          <div key={month.month} className="report-card">
            <div className="report-header">
              {new Date(`${month.month}-01`).toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="report-total">{formatCurrency(month.total)}</div>
            <div className="report-meta">{month.transactions} giao dịch</div>
            <ul className="report-breakdown">
              {Object.entries(month.categories).map(([category, value]) => (
                <li key={category}>
                  <span>{category}</span>
                  <strong>{formatCurrency(value)}</strong>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExpenseList({ expenses, onDelete, emptyMessage }) {
  if (expenses.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <ul className="expense-list">
      {expenses.map((expense) => (
        <li key={expense.id} className="expense-row">
          <div>
            <p className="expense-title">{expense.description}</p>
            <p className="expense-meta">
              {formatDate(expense.date)} · {expense.category}
            </p>
            {expense.note && <p className="expense-note">{expense.note}</p>}
          </div>
          <div className="expense-actions">
            <span className="expense-amount">{formatCurrency(expense.amount)}</span>
            <button type="button" className="ghost-button" onClick={() => onDelete(expense.id)}>
              Xóa
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatCard({ label, value, tone = "default" }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function EmptyState({ message }) {
  return <p className="empty-state">{message}</p>;
}

function ExpenseModal({ form, onChange, onSubmit, onClose, error }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="modal-header">
          <div>
            <h2>Ghi nhận chi tiêu</h2>
            <p>Nhập nhanh vừa đủ, hệ thống lo phần còn lại.</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </header>

        <form className="modal-body" onSubmit={onSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span>Ngày</span>
              <input name="date" type="date" value={form.date} onChange={onChange} required />
            </label>

            <label className="form-field">
              <span>Mô tả</span>
              <input
                name="description"
                placeholder="Ví dụ: Ăn trưa"
                value={form.description}
                onChange={onChange}
              />
            </label>

            <label className="form-field">
              <span>Số tiền (VND)</span>
              <input
                name="amount"
                placeholder="Ví dụ: 120000"
                value={form.amount}
                onChange={onChange}
                inputMode="numeric"
              />
            </label>

            <label className="form-field">
              <span>Ghi chú</span>
              <textarea
                name="note"
                placeholder="Tùy chọn"
                value={form.note}
                onChange={onChange}
              />
            </label>
          </div>

          <label className="form-field full-width">
            <span>Nhập nhanh (ví dụ: "mua cà phê 50k")</span>
            <textarea
              name="quickEntry"
              placeholder="Gõ tự nhiên, hệ thống tự nhận diện."
              value={form.quickEntry}
              onChange={onChange}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Lưu chi tiêu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
