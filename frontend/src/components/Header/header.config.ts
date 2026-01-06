// src/components/Header/header.config.ts
import type { NavItem } from "./header.types";
// Импортируем конкретные иконки из MUI
import { ListAltOutlined, EventNoteOutlined, SettingsOutlined } from "@mui/icons-material";

// Экспортируем массив элементов навигации
export const DEFAULT_NAV: NavItem[] = [
  { id: "catalog", label: "Каталог аудиторий", icon: ListAltOutlined },
  { id: "bookings", label: "Управление бронированием", icon: EventNoteOutlined },
  { id: "settings", label: "Настройки", icon: SettingsOutlined },
];