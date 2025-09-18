const { useState, useMemo, useEffect } = React;

const STORAGE_KEY = "stk-expenses-v1";

const SAMPLE_EXPENSES = [
  {
    id: crypto.randomUUID(),
    description: "Cà phê sáng",
    amount: 45000,
    date: new Date().toISOString().slice(0, 10),
    category: "Đồ uống",
    note: "Latte ở quán quen",
  },
  {
    id: crypto.randomUUID(),
    description: "Ăn trưa",
    amount: 95000,
    date: new Date().toISOString().slice(0, 10),
    category: "Ăn uống",
    note: "Cơm văn phòng",
  },
  {
    id: crypto.randomUUID(),
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

function formatCurrency(amount) {
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
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

  // simple streak: count days with spending in a row up to today
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
  const [expenses, setExpenses] = useState(() => {
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
  });

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    note: "",
    quickEntry: "",
  });

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

  function handleChange(event) {
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
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    const date = form.date || new Date().toISOString().slice(0, 10);
    const category = inferCategory(payload.description);

    const newExpense = {
      id: crypto.randomUUID(),
      description: payload.description,
      amount: payload.amount,
      date,
      category,
      note: payload.note || "",
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setForm((prev) => ({
      ...prev,
      description: "",
      amount: "",
      note: "",
      quickEntry: "",
    }));
  }

  function handleDelete(id) {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }

  return (
    <div className="container">
      <h1>Trợ lý quản lý chi tiêu</h1>

      <section className="card">
        <h2>Thêm chi tiêu mới</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label htmlFor="date">Ngày</label>
            <input
              id="date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="description">Mô tả</label>
            <input
              id="description"
              name="description"
              placeholder="Ví dụ: Ăn trưa"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="amount">Số tiền (VND)</label>
            <input
              id="amount"
              name="amount"
              placeholder="Ví dụ: 120000"
              value={form.amount}
              onChange={handleChange}
              inputMode="numeric"
            />
          </div>

          <div>
            <label htmlFor="note">Ghi chú</label>
            <textarea
              id="note"
              name="note"
              placeholder="Tùy chọn"
              value={form.note}
              onChange={handleChange}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="quickEntry">Nhập nhanh (ngôn ngữ tự nhiên)</label>
            <textarea
              id="quickEntry"
              name="quickEntry"
              placeholder="Ví dụ: Hôm nay mua cà phê 50k, ăn trưa 100k"
              value={form.quickEntry}
              onChange={handleChange}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit">Lưu chi tiêu</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Tổng quan</h2>
        <p>
          <span className="badge">Tổng chi tiêu</span> {formatCurrency(total)}
        </p>
        <p>
          Trung bình mỗi ngày: {formatCurrency(Math.round(insights.averageDaily || 0))}
        </p>
        {insights.topCategory ? (
          <p>
            Hạng mục chi nhiều nhất: <strong>{insights.topCategory.name}</strong> ({formatCurrency(insights.topCategory.total)})
          </p>
        ) : (
          <p className="empty-state">Chưa có dữ liệu đủ để phân tích</p>
        )}
        <p>Chuỗi ngày chi tiêu liên tiếp: {insights.streak} ngày</p>
      </section>

      <section className="card">
        <h2>Danh sách chi tiêu gần đây</h2>
        {expenses.length === 0 ? (
          <p className="empty-state">Chưa có chi tiêu nào, hãy thêm ghi nhận đầu tiên!</p>
        ) : (
          <div className="expense-list">
            {expenses.map((expense) => (
              <article key={expense.id} className="expense-item">
                <div>
                  <strong>{expense.description}</strong>
                  <div className="meta">
                    {formatCurrency(expense.amount)} · {expense.category}
                  </div>
                  <div className="meta">
                    {new Date(expense.date).toLocaleDateString("vi-VN")}
                    {expense.note ? ` · ${expense.note}` : ""}
                  </div>
                </div>
                <button type="button" onClick={() => handleDelete(expense.id)}>
                  Xóa
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Báo cáo theo tháng</h2>
        {monthlyReport.length === 0 ? (
          <p className="empty-state">Chưa có dữ liệu để lập báo cáo.</p>
        ) : (
          <div className="report-grid">
            {monthlyReport.map((month) => (
              <div key={month.month} className="report-card">
                <h3>
                  {new Date(month.month + "-01").toLocaleDateString("vi-VN", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <p>Tổng: {formatCurrency(month.total)}</p>
                <p>{month.transactions} giao dịch</p>
                <ul className="analysis-list">
                  {Object.entries(month.categories).map(([category, value]) => (
                    <li key={category}>
                      {category}: {formatCurrency(value)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Phân tích nâng cao</h2>
        <div className="advanced-section">
          <div className="report-card">
            <h3>OCR hóa đơn (minh họa)</h3>
            <p>
              Tải ảnh hóa đơn và hệ thống sẽ tự động nhận diện số tiền, nhà cung
              cấp và hạng mục chi tiêu bằng công nghệ OCR. (Tính năng demo: sử
              dụng ghi chú để mô tả nội dung hóa đơn).
            </p>
            <ul className="analysis-list">
              <li>Nhận diện tổng tiền từ hình ảnh hóa đơn.</li>
              <li>Gợi ý hạng mục dựa trên tên cửa hàng.</li>
              <li>Trích xuất ngày giao dịch để lưu tự động.</li>
            </ul>
          </div>

          <div className="report-card">
            <h3>Dự đoán thói quen chi tiêu</h3>
            <p>
              Mô phỏng mô hình học máy: dự đoán chi tiêu tháng tới khoảng
              {" "}
              <strong>{formatCurrency(Math.round(insights.predictedNextMonth || 0))}</strong>
              {" "}
              dựa trên xu hướng 2 tháng gần nhất.
            </p>
            <p>
              Gợi ý: thiết lập ngân sách theo tuần để kiểm soát dòng tiền tốt
              hơn và đặt cảnh báo khi vượt ngưỡng.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
