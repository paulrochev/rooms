// src/components/Room/RoomCard.tsx

import s from "./roomcard.module.css";
import { type Room } from "../../types/room";

interface RoomProps {
  room: Room;
}

export function RoomCard({ room }: RoomProps) {
  return (
    <div className={s.roomcard}>
      <div className={s.def}>{room.num}</div>
      <div className={s.def}>{room.name}</div>
      <div className={s.def}>{room.loc}</div>
      <div className={s.def}>{room.capacity} чел.</div>
      <div className={s.equip}>{room.equip.map(eq => eq.name).join(', ')}</div>
      {/* Используем data-атрибут для стилизации статуса */}
      <div className={s.status} data-status={room.status}>
        {room.status === 'free' && 'Свободна'}
        {room.status === 'booked' && 'Забронирована'}
        {room.status === 'maint' && 'На обслуживании'}
      </div>
    </div>
  );
}