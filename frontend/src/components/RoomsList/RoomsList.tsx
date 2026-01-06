// src/components/Rooms/RoomsList/RoomsList.tsx
import { RoomCard } from '@/components/Room/RoomCard';
import { type Room} from "src/types/room.ts"

interface RoomsListProps {
  rooms: Room[];
}

export function RoomsList({ rooms}: RoomsListProps) {
  if (rooms.length === 0) {
    return (
      <div>
        <div>Аудитории не найдены</div>
        <div>
          Попробуйте изменить параметры фильтрации или поиска
        </div>
      </div>
    );
  }

  return (
    <div>
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
        />
      ))}
    </div>
  );
}