import s from "./card.module.css";
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import OfflinePinIcon from '@mui/icons-material/OfflinePin';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';

interface CardProps {
    id: 1 | 2 | 3 | 4;
    label: string;
    value: number | string;
    status?: "active" | "busy" | "updated";
}

export function StatsCard({ id,  label, value, status }: CardProps) {
  switch (id) {case 1: return (
            <div className={`${s.card} ${status ? s[status] : ""}`}>
            <MeetingRoomIcon className={s.logo}/>
                <div className={s.value}>{value}</div>
                <div className={s.label}>{label}</div>
            </div>
        );
        break;
        case 2: return (
            <div className={`${s.card} ${status ? s[status] : ""}`}>
            <OfflinePinIcon className={s.logo}/> 
                <div className={s.value}>{value}</div>
                <div className={s.label}>{label}</div>
            </div>
        );
        break;
        case 3: return (
            <div className={`${s.card} ${status ? s[status] : ""}`}>
            <EventAvailableIcon className={s.logo}/>
                <div className={s.value}>{value}</div>
                <div className={s.label}>{label}</div>
            </div>
        );
        break;
        case 4: return (
            <div className={`${s.card} ${status ? s[status] : ""}`}>
            <BuildCircleIcon className={s.logo}/>
                <div className={s.value}>{value}</div>
                <div className={s.label}>{label}</div>
            </div>
        );
    }
}