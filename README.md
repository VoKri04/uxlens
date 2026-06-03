# UXLens — AI-анализ UX/UI сайтов (GigaChat)

## Структура проекта

```
uxlens/
├── server/
│   └── index.js          # Бэкенд (Node.js + Express + GigaChat)
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── .env.example
├── package.json
└── README.md
```

## Запуск

### 1. Установить Node.js
Скачать с https://nodejs.org (версия 18+)

### 2. Установить зависимости
```bash
cd uxlens
npm install
```

### 3. Получить ключ GigaChat
1. Зайти на https://developers.sber.ru/studio
2. Войти через Сбер ID
3. Создать проект → GigaChat API
4. Скопировать "Client Secret" (это и есть ключ авторизации)

### 4. Настроить .env
```bash
cp .env.example .env
```
Открыть .env и вставить ключ:
```
GIGACHAT_CREDENTIALS=ваш_client_secret
```

### 5. Запустить
```bash
npm start
```

Открыть: http://localhost:3000
