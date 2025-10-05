# 🔥 Настройка правил для проекта budgetami

## ВАЖНО: Обновите правила безопасности в Firebase

### 1. Откройте ваш проект budgetami

Перейдите на: https://console.firebase.google.com/project/budgetami

### 2. Перейдите в Realtime Database

1. В левом меню нажмите **"Realtime Database"**
2. Если база данных еще не создана, нажмите **"Create Database"**
3. Выберите **"Start in test mode"**
4. Регион: **"europe-west1"**

### 3. Обновите правила безопасности

1. Перейдите во вкладку **"Rules"**
2. **УДАЛИТЕ** все существующие правила
3. **ВСТАВЬТЕ** эти правила:

```json
{
  "rules": {
    "budgets": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId",
        ".validate": "newData.hasChildren(['data', 'lastModified', 'version'])"
      }
    }
  }
}
```

4. Нажмите **"Publish"**

### 4. Включите анонимную аутентификацию

1. В левом меню нажмите **"Authentication"**
2. Перейдите во вкладку **"Sign-in method"**
3. Найдите **"Anonymous"** и нажмите на него
4. **Включите** переключатель "Enable"
5. Нажмите **"Save"**

## ✅ После настройки

Перезагрузите приложение и проверьте:

- http://localhost:8000/firebase-diagnostic.html
- http://localhost:8000/index.html

Синхронизация должна заработать! 🚀
