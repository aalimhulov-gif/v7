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
  apiKey: "AIzaSyAiB6veVSOVDVz5Nx8xZ9Eb_6dEp7JUTBo",
  authDomain: "budgetami.firebaseapp.com",
  projectId: "budgetami",
  storageBucket: "budgetami.firebasestorage.app",
  messagingSenderId: "446736675165",
  appId: "1:446736675165:web:00858e64e042e95bf1b8b4"
};

// Экспорт новой конфигурации
export { firebaseConfig };

// Логирование для отладки
console.log('Firebase Config загружен для проекта:', firebaseConfig.projectId);