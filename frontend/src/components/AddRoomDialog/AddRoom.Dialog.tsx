// src/components/AddRoomDialog/AddRoomDialog.tsx
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  Stack,
  Typography,
} from "@mui/material";

const EQUIPMENT_OPTIONS = [
  { key: "projector", label: "Проектор" },
  { key: "microphone", label: "Микрофон" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "computers", label: "Компьютеры" },
  { key: "board", label: "Доска" },
];

interface AddRoomDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (roomData: {
    code: string;
    name: string;
    capacity: number;
    equipment: string[];
  }) => void;
}

export function AddRoomDialog({ open, onClose, onAdd }: AddRoomDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number | string>("");
  const [equipment, setEquipment] = useState<string[]>([]);

  const handleEquipmentChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setEquipment([...equipment, key]);
    } else {
      setEquipment(equipment.filter((item) => item !== key));
    }
  };

  const handleSubmit = () => {
    if (!code || !name || !capacity) {
      alert("Заполните все обязательные поля");
      return;
    }
    
    onAdd({
      code,
      name,
      capacity: Number(capacity),
      equipment,
    });
    
    // Сброс формы
    setCode("");
    setName("");
    setCapacity("");
    setEquipment([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить новую аудиторию</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Номер аудитории"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Например: 301"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Лекционная аудитория"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Вместимость"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Например: 50"
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Оборудование:
            </Typography>
            <Stack spacing={1}>
              {EQUIPMENT_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option.key}
                  control={
                    <Checkbox
                      checked={equipment.includes(option.key)}
                      onChange={handleEquipmentChange(option.key)}
                    />
                  }
                  label={option.label}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained">
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
}