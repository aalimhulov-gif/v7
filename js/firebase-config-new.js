// Резервная копия старой конфигурации Firebase
const oldFirebaseConfig = {
  apiKey: "ATZaEVeSSGtLRpQq7e_ZQKPjOZkRq-YRKOpSjE",
  authDomain: "my-budżet.firebaseapp.com", 
  databaseURL: "https://my-budżet-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-budżet",
  storageBucket: "my-budżet.firebasestorage.app",
  messagingSenderId: "38303046323",
  appId: "1:38303046323:web:e60dbad863a6db92c6",
  measurementId: "G-3SWHMH2ZF8"
};

// НОВАЯ конфигурация Firebase (замените после создания нового проекта)
const firebaseConfig = {
  // Вставьте сюда конфигурацию из нового Firebase проекта
  apiKey: "НОВЫЙ_API_KEY",
  authDomain: "budget-artur-valeria.firebaseapp.com",
  databaseURL: "https://budget-artur-valeria-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "budget-artur-valeria", 
  storageBucket: "budget-artur-valeria.appspot.com",
  messagingSenderId: "НОВЫЙ_SENDER_ID",
  appId: "НОВЫЙ_APP_ID"
};

// Экспорт новой конфигурации
export { firebaseConfig };

// Логирование для отладки
console.log('Firebase Config загружен для проекта:', firebaseConfig.projectId);