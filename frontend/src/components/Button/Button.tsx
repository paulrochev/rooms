import { type ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import s from "./Button.module.css";
import AddBoxIcon from '@mui/icons-material/AddBox';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ConstructionIcon from '@mui/icons-material/Construction';

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

// Базовые нативные пропсы кнопки (type, autoFocus, aria-*, и т.д.)
type NativeButtonProps = ComponentPropsWithoutRef<"button">;
interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconId: 1 | 2 | 3;
  // className, disabled и children уже есть в NativeButtonProps, дублировать не обязательно
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  iconId,
  ...rest
}: ButtonProps) {
  // 1. Создаем объект, который по id возвращает нужный компонент иконки
  const iconMap = {
    1: AddBoxIcon,
    2: PlaylistAddCheckIcon,
    3: ConstructionIcon
  };

  // 2. Находим нужный компонент по id
  const IconComponent = iconMap[iconId];

  return (
    <button
      type={type}
      {...rest}
      className={clsx(
        s.button,
        s[variant],
        s[size],
        rest.disabled && s.disabled,
        rest.className
      )}
    >
      {/* 3. Если компонент найден, рендерим его */}
      {IconComponent && <IconComponent className={s.addlogo} />}
      {children}
    </button>
  );
}