require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const https = require("https");
const { GigaChat } = require("gigachat");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "../public")));

const jobs = new Map();

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function createGigaClient() {
  return new GigaChat({
    model: "GigaChat-Pro",
    credentials: process.env.GIGACHAT_CREDENTIALS,
    // Отключаем проверку сертификата НУЦ Минцифры
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 60,
  });
}



app.post("/api/analyze", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Введите корректный URL (начинается с http:// или https://)" });
  }

  if (!process.env.GIGACHAT_CREDENTIALS || process.env.GIGACHAT_CREDENTIALS === "your_credentials_here") {
    return res.status(500).json({ error: "Ключ GigaChat не настроен. Добавьте GIGACHAT_CREDENTIALS в файл .env" });
  }

  const jobId = generateId();
  jobs.set(jobId, { status: "pending", url, createdAt: Date.now() });

  runAnalysis(jobId, url);

  res.json({ jobId });
});



app.get("/api/result/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Задача не найдена" });
  res.json(job);
});



app.post("/api/chat", async (req, res) => {
  const { message, analysisContext, history } = req.body;
  if (!message) return res.status(400).json({ error: "Сообщение не может быть пустым" });

  try {
    const client = createGigaClient();

    const systemPrompt = `Ты — эксперт по UX/UI дизайну и веб-разработке. Ты помогаешь пользователю разобраться с результатами автоматического анализа его сайта.
${analysisContext ? `\nКонтекст анализа сайта:\n${JSON.stringify(analysisContext, null, 2)}` : ""}
Отвечай на русском языке. Давай конкретные, практичные советы. Если объясняешь технический термин — делай это просто и понятно.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-10),
      { role: "user", content: message },
    ];

    const response = await client.chat({ messages });
    const reply = response.choices[0].message.content;

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Ошибка при обращении к GigaChat: " + err.message });
  }
});



async function runAnalysis(jobId, url) {
  try {
    jobs.set(jobId, { ...jobs.get(jobId), status: "analyzing", step: "Подключение к сайту..." });

    const pageData = await fetchPageData(url);
    jobs.set(jobId, { ...jobs.get(jobId), step: "Анализ структуры..." });

    const result = await analyzeWithGigaChat(url, pageData);
    jobs.set(jobId, { ...jobs.get(jobId), status: "done", result });

  } catch (err) {
    console.error("Analysis error:", err.message);
    jobs.set(jobId, {
      ...jobs.get(jobId),
      status: "error",
      error: err.message.includes("fetch") || err.message.includes("ENOTFOUND")
        ? "Не удалось загрузить сайт. Проверьте URL или доступность сайта."
        : err.message,
    });
  }
}



async function fetchPageData(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`Сайт вернул ошибку: ${response.status} ${response.statusText}`);

  const html = await response.text();
  return parseHTML(html, url);
}



function parseHTML(html, url) {
  const data = {
    url,
    title: "",
    metaDescription: "",
    lang: "",
    headings: { h1: 0, h2: 0, h3: 0, h4: 0 },
    images: { total: 0, withoutAlt: 0, withAlt: 0 },
    links: { total: 0, external: 0, internal: 0 },
    hasViewport: false,
    hasFavicon: false,
    hasOpenGraph: false,
    forms: 0,
    buttons: 0,
    inputsWithoutLabel: 0,
    colorMentions: [],
    fontFamilies: [],
    hasH1: false,
    multipleH1: false,
    htmlSize: html.length,
    hasSchemaOrg: false,
    hasCanonical: false,
  };

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) data.title = titleMatch[1].replace(/\s+/g, " ").trim().substring(0, 100);

  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']{0,300})["']/i)
    || html.match(/<meta[^>]*content=["']([^"']{0,300})["'][^>]*name=["']description["']/i);
  if (metaDesc) data.metaDescription = metaDesc[1];

  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  if (langMatch) data.lang = langMatch[1];

  data.hasViewport  = /<meta[^>]*name=["']viewport["']/i.test(html);
  data.hasFavicon   = /<link[^>]*rel=["'][^"']*icon[^"']*["']/i.test(html);
  data.hasOpenGraph = /<meta[^>]*property=["']og:/i.test(html);
  data.hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
  data.hasSchemaOrg = /schema\.org/i.test(html);

  const h1matches = html.match(/<h1[^>]*>/gi) || [];
  const h2matches = html.match(/<h2[^>]*>/gi) || [];
  const h3matches = html.match(/<h3[^>]*>/gi) || [];
  const h4matches = html.match(/<h4[^>]*>/gi) || [];
  data.headings = { h1: h1matches.length, h2: h2matches.length, h3: h3matches.length, h4: h4matches.length };
  data.hasH1 = h1matches.length > 0;
  data.multipleH1 = h1matches.length > 1;

  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  data.images.total    = imgMatches.length;
  data.images.withAlt  = imgMatches.filter(img => /alt=["'][^"']+["']/i.test(img)).length;
  data.images.withoutAlt = imgMatches.length - data.images.withAlt;

  const linkMatches = html.match(/<a[^>]*href=["'][^"']+["']/gi) || [];
  data.links.total = linkMatches.length;
  const domain = new URL(url).hostname;
  data.links.internal = linkMatches.filter(l => !l.includes("http") || l.includes(domain)).length;
  data.links.external = data.links.total - data.links.internal;

  data.forms   = (html.match(/<form[^>]*>/gi) || []).length;
  data.buttons = (html.match(/<button[^>]*>/gi) || []).length;

  const inputs = (html.match(/<input[^>]*type=["'](?:text|email|password|tel|search)["'][^>]*>/gi) || []).length;
  const labels = (html.match(/<label[^>]*>/gi) || []).length;
  data.inputsWithoutLabel = Math.max(0, inputs - labels);

  const colorRegex = /(?:color|background(?:-color)?)\s*:\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|[a-z]+)/gi;
  const colorSet = new Set();
  let colorMatch;
  while ((colorMatch = colorRegex.exec(html)) !== null && colorSet.size < 20) {
    colorSet.add(colorMatch[1].toLowerCase());
  }
  data.colorMentions = Array.from(colorSet).slice(0, 15);

  const fontRegex = /font-family\s*:\s*([^;}"']+)/gi;
  const fontSet = new Set();
  let fontMatch;
  while ((fontMatch = fontRegex.exec(html)) !== null && fontSet.size < 10) {
    const font = fontMatch[1].trim().split(",")[0].replace(/['"]/g, "").trim();
    if (font && font.length < 40) fontSet.add(font);
  }
  data.fontFamilies = Array.from(fontSet).slice(0, 8);

  return data;
}



async function analyzeWithGigaChat(url, pageData) {
  const client = createGigaClient();

  const prompt = `Ты — эксперт по UX/UI анализу веб-сайтов. Проанализируй сайт по URL и техническим данным страницы.

URL сайта: ${url}

Технические данные:
- Заголовок страницы: "${pageData.title || "отсутствует"}"
- Meta description: "${pageData.metaDescription || "отсутствует"}"
- Язык страницы: ${pageData.lang || "не указан"}
- Мета-тег viewport (мобильная адаптация): ${pageData.hasViewport ? "есть" : "ОТСУТСТВУЕТ"}
- Favicon: ${pageData.hasFavicon ? "есть" : "отсутствует"}
- Open Graph теги: ${pageData.hasOpenGraph ? "есть" : "отсутствуют"}
- Canonical URL: ${pageData.hasCanonical ? "есть" : "отсутствует"}

Структура заголовков:
- H1: ${pageData.headings.h1} шт. ${pageData.multipleH1 ? "(ПРОБЛЕМА: несколько H1!)" : ""}
- H2: ${pageData.headings.h2} шт.
- H3: ${pageData.headings.h3} шт.

Изображения:
- Всего: ${pageData.images.total}
- С alt-атрибутом: ${pageData.images.withAlt}
- БЕЗ alt-атрибута: ${pageData.images.withoutAlt}${pageData.images.withoutAlt > 0 ? " (ПРОБЛЕМА доступности!)" : ""}

Ссылки: всего ${pageData.links.total} (внутренних: ${pageData.links.internal}, внешних: ${pageData.links.external})
Формы: ${pageData.forms}
Кнопки: ${pageData.buttons}
${pageData.inputsWithoutLabel > 0 ? `Полей без лейблов: ${pageData.inputsWithoutLabel} (ПРОБЛЕМА доступности!)` : ""}

Цвета на странице: ${pageData.colorMentions.join(", ") || "не определены"}
Шрифты: ${pageData.fontFamilies.join(", ") || "не определены"}
Размер HTML: ${Math.round(pageData.htmlSize / 1024)} KB

Проведи профессиональный UX/UI анализ и верни результат СТРОГО в формате JSON (без markdown, без пояснений, только JSON):

{
  "overallScore": <число 0-100>,
  "scores": {
    "visual": <0-100>,
    "accessibility": <0-100>,
    "navigation": <0-100>,
    "typography": <0-100>,
    "mobile": <0-100>
  },
  "summary": "<2-3 предложения общего вывода на русском>",
  "issues": [
    {
      "priority": "critical|important|improvement",
      "category": "visual|accessibility|navigation|typography|mobile",
      "title": "<краткое название проблемы>",
      "description": "<детальное описание, что именно не так>",
      "recommendation": "<конкретная рекомендация как исправить>"
    }
  ],
  "positives": [
    "<что сделано хорошо>"
  ]
}

Важно:
- overallScore = среднее scores с весами: visual 25%, accessibility 25%, navigation 20%, typography 15%, mobile 15%
- issues: минимум 4, максимум 10 пунктов, сортируй: critical → important → improvement
- positives: 2-4 пункта, что реально хорошо на сайте
- Все тексты на русском языке
- Будь конкретным и практичным`;

  const response = await client.chat({
    messages: [
      { role: "system", content: "Ты UX/UI эксперт. Отвечай только валидным JSON без markdown-обёрток." },
      { role: "user", content: prompt },
    ],
  });

  const text = response.choices[0].message.content.trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("GigaChat вернул некорректный ответ. Попробуйте ещё раз.");

  const result = JSON.parse(jsonMatch[0]);
  result.pageData = pageData;
  return result;
}


app.listen(PORT, () => {
  console.log(`\n UXLens (GigaChat) запущен: http://localhost:${PORT}\n`);
  if (!process.env.GIGACHAT_CREDENTIALS || process.env.GIGACHAT_CREDENTIALS === "your_credentials_here") {
    console.warn("  GIGACHAT_CREDENTIALS не настроен. Добавьте ключ в файл .env\n");
  }
});
