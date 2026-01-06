// src/components/Header/header.utils.ts

// Функция принимает имя и возвращает инициалы
export function getInitials(name: string | undefined): string {
  // 1. Проверка на пустое или undefined значение
  if (!name) return "NN"; // Если имени нет, возвращаем "No Name"

  // 2. Разбиваем строку с именем по пробелам и берем первые два слова
  const [a = "", b = ""] = name.trim().split(/\s+/);
  
  // 3. Берем первую букву первого слова и первую букву второго слова, склеиваем и приводим к верхнему регистру
  return (a[0] ?? "").concat(b[0] ?? "").toUpperCase();
}