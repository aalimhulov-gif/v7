# 💰 Семейный Бюджет - Артур & Валерия

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Currency](https://img.shields.io/badge/currency-PLN-green.svg)
![Firebase](https://img.shields.io/badge/storage-Firebase-orange.svg)

Современное веб-приложение для управления семейным бюджетом с красивым дизайном и облачной синхронизацией.

## 🌟 Особенности

- 💳 **Индивидуальные балансы** для каждого партнера
- 💰 **Польские злотые (zł)** как основная валюта
- ☁️ **Firebase синхронизация** данных
- 📱 **Адаптивный дизайн** для всех устройств
- 🎯 **Цели накопления** с прогресс-барами
- 📊 **Аналитика расходов** по категориям
- 🔄 **Экспорт/импорт** данных

## 🚀 Быстрый старт

### Локальное использование:

1. Скачайте все файлы
2. Откройте `index.html` в браузере
3. Начните добавлять операции!

### С Firebase (синхронизация):

1. Создайте проект в [Firebase Console](https://console.firebase.google.com)
2. Включите Firestore Database
3. Добавьте конфигурацию в `index.html` (см. инструкции ниже)

## ⚙️ Настройка Firebase

Добавьте перед закрывающим тегом `</body>` в `index.html`:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js"></script>

<script>
  const firebaseConfig = {
    apiKey: "ваш-api-key",
    authDomain: "ваш-проект.firebaseapp.com",
    projectId: "ваш-project-id",
    storageBucket: "ваш-проект.appspot.com",
    messagingSenderId: "123456789",
    appId: "ваш-app-id",
  };

  initializeFirebase(firebaseConfig);
</script>
```

## 📁 Структура проекта

```
family-budget-app/
├── index.html              # Главная страница
├── css/                    # Стили
│   ├── variables.css       # CSS переменные
│   ├── layout.css          # Компоновка
│   ├── components.css      # UI компоненты
│   ├── operations.css      # Операции
│   └── modals.css          # Модальные окна
├── js/                     # JavaScript
│   ├── config.js           # Конфигурация
│   ├── utils.js            # Утилиты
│   ├── app.js              # Основной класс
│   ├── cloud-storage.js    # Облачное хранилище
│   ├── rendering.js        # Отрисовка UI
│   ├── data-management.js  # Управление данными
│   ├── analytics.js        # Аналитика
│   └── main.js             # Инициализация
└── README.md               # Документация
```

## 🔧 Деплой

### GitHub Pages:

1. Загрузите код в GitHub репозиторий
2. Settings → Pages → Source: Deploy from a branch
3. Branch: main, folder: / (root)

### Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Netlify:

1. Перетащите папку на https://app.netlify.com/drop
2. Или подключите GitHub репозиторий

## 🎨 Функции

- ✅ Добавление доходов и расходов
- ✅ Управление категориями
- ✅ Установка лимитов по категориям
- ✅ Цели накопления
- ✅ Детальная аналитика
- ✅ Экспорт/импорт данных
- ✅ Темная тема
- ✅ Мобильная версия

## 🛡️ Безопасность

- Анонимная аутентификация Firebase
- Данные синхронизируются только между вашими устройствами
- Локальное резервное копирование
- Нет доступа к персональным данным

## 📞 Поддержка

Если нужна помощь:

1. Проверьте консоль браузера (F12)
2. Убедитесь что все файлы загрузились
3. Проверьте настройки Firebase (если используется)

---

**Сделано с ❤️ для семьи**
