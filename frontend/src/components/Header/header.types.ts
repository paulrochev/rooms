// src/components/Header/header.types.ts
import { type SvgIconComponent } from "@mui/icons-material";

// Описываем один элемент навигации
export interface NavItem {
  id: string;         // Уникальный идентификатор, нужен для React (key) и для определения активной вкладки
  label: string;      // Текст, который увидит пользователь
  icon?: SvgIconComponent; // Иконка. Тип SvgIconComponent берется из MUI, это обеспечивает строгую типизацию
  href?: string;      // Необязательная ссылка, если бы мы делали обычные <a> вместо кнопок
}

// Описываем данные пользователя для аватара
export interface UserBrief {
  name: string;       // Имя пользователя
  avatarUrl?: string; // Опциональная ссылка на аватарку
}