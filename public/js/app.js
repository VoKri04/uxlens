const API = "";

let currentJobId = null;
let analysisResult = null;
let chatHistory = [];
let pollInterval = null;


const $ = id => document.getElementById(id);

const sections = {
  hero:    $("home"),
  loader:  $("loaderSection"),
  results: $("resultsSection"),
};

function showSection(name) {
  Object.entries(sections).forEach(([key, el]) => {
    if (!el) return;
    el.hidden = key !== name;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("analyzeForm").addEventListener("submit", async e => {
  e.preventDefault();
  const url = $("urlInput").value.trim();
  if (!url) return setHint("Введите URL сайта", true);
  if (!url.startsWith("http")) return setHint("URL должен начинаться с http:// или https://", true);

  setHint("Отправляем запрос...", false);
  $("analyzeBtn").disabled = true;
  $("analyzeBtn").querySelector(".hero__btn-text").textContent = "Загрузка...";

  try {
    const res = await fetch(`${API}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Ошибка сервера");

    currentJobId = data.jobId;
    startLoader(url);
    pollResult();
  } catch (err) {
    setHint(err.message, true);
    resetBtn();
  }
});

function setHint(text, isError) {
  const el = $("formHint");
  el.textContent = text;
  el.classList.toggle("hero__hint--error", isError);
}

function resetBtn() {
  $("analyzeBtn").disabled = false;
  $("analyzeBtn").querySelector(".hero__btn-text").textContent = "Анализировать";
}

const loaderSteps = [
  "Подключение к сайту...",
  "Загрузка страницы...",
  "Парсинг DOM-структуры...",
  "Извлечение метаданных...",
  "Отправка в AI...",
  "AI анализирует дизайн...",
  "Формирование отчёта...",
];

let loaderStepIndex = 0;
let loaderStepTimer = null;

function startLoader(url) {
  showSection("loader");
  $("loaderUrl").textContent = url;
  $("loaderBar").style.width = "0%";
  loaderStepIndex = 0;
  updateLoaderStep();
  loaderStepTimer = setInterval(() => {
    loaderStepIndex = Math.min(loaderStepIndex + 1, loaderSteps.length - 1);
    updateLoaderStep();
  }, 3500);
}

function updateLoaderStep() {
  $("loaderStep").textContent = loaderSteps[loaderStepIndex];
  const pct = Math.min(90, Math.round((loaderStepIndex / (loaderSteps.length - 1)) * 90));
  $("loaderBar").style.width = pct + "%";
}

function stopLoader() {
  clearInterval(loaderStepTimer);
  $("loaderBar").style.width = "100%";
}

function pollResult() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API}/api/result/${currentJobId}`);
      const job = await res.json();

      if (job.status === "done") {
        clearInterval(pollInterval);
        stopLoader();
        analysisResult = job.result;
        chatHistory = [];
        setTimeout(() => renderResults(job.result), 600);
      } else if (job.status === "error") {
        clearInterval(pollInterval);
        stopLoader();
        setTimeout(() => {
          showSection("hero");
          setHint("Ошибка: " + job.error, true);
          resetBtn();
        }, 400);
      }
    } catch (err) {
      clearInterval(pollInterval);
      showSection("hero");
      setHint("Потеряна связь с сервером", true);
      resetBtn();
    }
  }, 2000);
}

function renderResults(result) {
  showSection("results");

  const url = result.pageData?.url || "";
  $("resultUrl").textContent = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  animateScore(result.overallScore || 0);

  const categories = [
    { key: "visual",        label: "Визуальный дизайн", color: "#7C7CEB" },
    { key: "accessibility", label: "Доступность",       color: "#1D9E75" },
    { key: "navigation",    label: "Навигация",         color: "#EF9F27" },
    { key: "typography",    label: "Типографика",       color: "#D4537E" },
    { key: "mobile",        label: "Мобильность",       color: "#3B82F6" },
  ];

  const metricsEl = $("metricsBlock");
  metricsEl.innerHTML = "";
  categories.forEach(cat => {
    const score = result.scores?.[cat.key] ?? 0;
    const el = document.createElement("div");
    el.className = "metric";
    el.dataset.category = cat.key;
    el.innerHTML = `
      <div class="metric__row">
        <div class="metric__name">
          <div class="metric__dot" style="background:${cat.color}"></div>
          ${cat.label}
        </div>
        <div class="metric__score" style="color:${cat.color}">${score}</div>
      </div>
      <div class="metric__bar-bg">
        <div class="metric__bar" style="background:${cat.color}" data-width="${score}"></div>
      </div>
    `;
    el.addEventListener("click", () => filterIssues(cat.key, el));
    metricsEl.appendChild(el);
  });

  setTimeout(() => {
    document.querySelectorAll(".metric__bar").forEach(bar => {
      bar.style.width = bar.dataset.width + "%";
    });
  }, 100);

  if (result.summary) {
    $("summaryText").textContent = result.summary;
    $("summaryCard").hidden = false;
  }

  if (result.positives?.length) {
    const list = $("positivesList");
    list.innerHTML = result.positives.map(p => `<li>${p}</li>`).join("");
    $("positivesBlock").hidden = false;
  }

  renderIssues(result.issues || [], "all");

  $("chatMessages").innerHTML = `
    <div class="chat__message chat__message--ai">
      <div class="chat__bubble">
        Анализ завершён! Я изучил сайт <strong>${url}</strong> и готов ответить на ваши вопросы. Спросите о любой из найденных проблем или попросите подробнее объяснить рекомендацию.
      </div>
    </div>
  `;
  chatHistory = [];

  $("urlInput").value = "";
  setHint("Поддерживаются любые публично доступные сайты", false);
  resetBtn();
}

function animateScore(score) {
  const numEl = $("overallScore");
  const arc = $("scoreArc");

  const color = score >= 75 ? "#1D9E75" : score >= 50 ? "#EF9F27" : "#E24B4A";
  arc.style.stroke = color;

  let current = 0;
  const target = Math.round(score);
  const duration = 1000;
  const step = Math.max(1, Math.round(target / (duration / 16)));

  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    numEl.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 16);

  const circumference = 314;
  const offset = circumference - (circumference * score / 100);
  setTimeout(() => {
    arc.style.strokeDashoffset = offset;
  }, 50);
}

function renderIssues(issues, filter) {
  const list = $("issuesList");
  const filtered = filter === "all" ? issues : issues.filter(i => i.priority === filter);

  if (!filtered.length) {
    list.innerHTML = `<p style="color:var(--text-3);font-size:13px;padding:16px 0">Проблем в этой категории не найдено</p>`;
    return;
  }

  list.innerHTML = filtered.map(issue => {
    const badgeClass = {
      critical:    "issue__badge--critical",
      important:   "issue__badge--important",
      improvement: "issue__badge--improvement",
    }[issue.priority] || "issue__badge--improvement";

    const badgeLabel = {
      critical:    "Критично",
      important:   "Важно",
      improvement: "Улучшение",
    }[issue.priority] || issue.priority;

    return `
      <div class="issue" data-priority="${issue.priority}">
        <div class="issue__head">
          <span class="issue__badge ${badgeClass}">${badgeLabel}</span>
          <div class="issue__title">${escHtml(issue.title)}</div>
        </div>
        <p class="issue__description">${escHtml(issue.description)}</p>
        <p class="issue__rec">💡 ${escHtml(issue.recommendation)}</p>
      </div>
    `;
  }).join("");
}

$("issueFilters").addEventListener("click", e => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("filter-btn--active"));
  btn.classList.add("filter-btn--active");
  renderIssues(analysisResult?.issues || [], btn.dataset.filter);
});

function filterIssues(category, metricEl) {
  const activeFilter = document.querySelector(".filter-btn--active")?.dataset?.filter;
  document.querySelectorAll(".metric").forEach(m => m.classList.remove("active"));

  if (activeFilter === category) {
    document.querySelectorAll(".filter-btn").forEach(b =>
      b.classList.toggle("filter-btn--active", b.dataset.filter === "all")
    );
    renderIssues(analysisResult?.issues || [], "all");
  } else {
    metricEl.classList.add("active");
    const filtered = (analysisResult?.issues || []).filter(i => i.category === category);
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("filter-btn--active"));
    renderIssues(filtered.length ? filtered : analysisResult?.issues || [], "all");
  }
}

$("newAnalysisBtn").addEventListener("click", () => {
  showSection("hero");
  setTimeout(() => $("urlInput").focus(), 300);
});

$("chatSendBtn").addEventListener("click", sendChatMessage);
$("chatInput").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
});

async function sendChatMessage() {
  const input = $("chatInput");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  $("chatSendBtn").disabled = true;

  appendChatMessage("user", text);


  const loadingId = "loading-" + Date.now();
  appendLoadingBubble(loadingId);

  chatHistory.push({ role: "user", content: text });

  try {
    const res = await fetch(`${API}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        analysisContext: analysisResult,
        history: chatHistory.slice(-10), // last 10 messages for context
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка");

    removeLoadingBubble(loadingId);
    appendChatMessage("ai", data.reply);
    chatHistory.push({ role: "assistant", content: data.reply });
  } catch (err) {
    removeLoadingBubble(loadingId);
    appendChatMessage("ai", "Извините, произошла ошибка: " + err.message);
  } finally {
    $("chatSendBtn").disabled = false;
    input.focus();
  }
}

function appendChatMessage(role, text) {
  const messages = $("chatMessages");
  const div = document.createElement("div");
  div.className = `chat__message chat__message--${role}`;
  div.innerHTML = `<div class="chat__bubble">${escHtml(text).replace(/\n/g, "<br>")}</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function appendLoadingBubble(id) {
  const messages = $("chatMessages");
  const div = document.createElement("div");
  div.className = "chat__message chat__message--ai";
  div.id = id;
  div.innerHTML = `
    <div class="chat__bubble chat__bubble--loading">
      <span></span><span></span><span></span>
    </div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeLoadingBubble(id) {
  document.getElementById(id)?.remove();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

window.addEventListener("scroll", () => {
  $("navbar").style.background =
    window.scrollY > 20 ? "rgba(13,13,15,0.95)" : "rgba(13,13,15,0.85)";
});

showSection("hero");
