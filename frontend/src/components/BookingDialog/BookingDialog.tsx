// src/components/BookingDialog/BookingDialog.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Alert,
  Typography,
  CircularProgress,
} from "@mui/material";

import {
  createBooking,
  updateBooking,
  fetchBookingById,
  type BookingCreateDto,
} from "../../api/bookingsApi";

type Mode = "create" | "edit";

const ROOMS: Array<{ id: string; label: string }> = [
  { id: "101", label: "101" },
  { id: "102", label: "102" },
  { id: "201", label: "201" },
  { id: "202", label: "202" },
];

interface BookingDialogProps {
  open: boolean;
  mode: Mode;
  onClose: () => void;

  bookingId?: string;

  onSuccess?: () => void;
}

function toDateInputValue(dtIso: string) {
  const d = new Date(dtIso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toTimeInputValue(dtIso: string) {
  const d = new Date(dtIso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildIso(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString();
}

export function BookingDialog({
                                open,
                                mode,
                                onClose,
                                bookingId,
                                onSuccess,
                              }: BookingDialogProps) {
  const [organizerName, setOrganizerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const [loadingBooking, setLoadingBooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const title = mode === "create" ? "Создать бронирование" : "Изменить бронирование";
  const submitLabel = mode === "create" ? "Создать" : "Сохранить";

  const roomLabel = useMemo(
      () => ROOMS.find((r) => r.id === roomId)?.label ?? "",
      [roomId]
  );

  const resetForm = () => {
    setOrganizerName("");
    setRoomId("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
  };

  useEffect(() => {
    if (!open) return;

    setFormError(null);

    if (mode === "create") {
      resetForm();
      return;
    }

    if (!bookingId) {
      resetForm();
      setFormError("Не передан bookingId для редактирования");
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setLoadingBooking(true);
        const b = await fetchBookingById(bookingId);

        if (!mounted) return;

        setOrganizerName(b.organizerName ?? "");
        setRoomId(b.roomId ?? "");

        setStartDate(toDateInputValue(b.startTime));
        setStartTime(toTimeInputValue(b.startTime));

        setEndDate(toDateInputValue(b.endTime));
        setEndTime(toTimeInputValue(b.endTime));
      } catch (e) {
        if (!mounted) return;
        setFormError(e instanceof Error ? e.message : "Не удалось загрузить бронирование");
      } finally {
        if (mounted) setLoadingBooking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, mode, bookingId]);

  const handleSubmit = async () => {
    setFormError(null);

    if (!organizerName || !roomId || !startDate || !startTime || !endDate || !endTime) {
      setFormError("Заполните все поля");
      return;
    }

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setFormError("Некорректная дата/время");
      return;
    }
    if (start >= end) {
      setFormError("Время окончания должно быть позже времени начала");
      return;
    }

    try {
      setSubmitting(true);

      const payload: BookingCreateDto = {
        organizerName,
        roomId,
        startTime: buildIso(startDate, startTime),
        endTime: buildIso(endDate, endTime),
      } as BookingCreateDto;

      if (mode === "create") {
        await createBooking(payload);
      } else {
        if (!bookingId) throw new Error("Не передан bookingId для редактирования");
        await updateBooking(bookingId, payload);
      }

      onSuccess?.();
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Не удалось сохранить бронирование");
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || loadingBooking;

  return (
      <Dialog open={open} onClose={disabled ? undefined : onClose} maxWidth="md" fullWidth>
        <DialogTitle>{title}</DialogTitle>

        <DialogContent>
          {loadingBooking ? (
              <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
                <CircularProgress />
              </Box>
          ) : (
              <Box component="form" sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                  <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Организатор"
                      value={organizerName}
                      onChange={(e) => setOrganizerName(e.target.value)}
                      placeholder="Иванов И.И."
                      disabled={disabled}
                  />
                </Box>

                <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                  <FormControl fullWidth margin="normal" required disabled={disabled}>
                    <InputLabel>Аудитория</InputLabel>
                    <Select
                        value={roomId}
                        label="Аудитория"
                        onChange={(e) => setRoomId(String(e.target.value))}
                    >
                      {ROOMS.map((r) => (
                          <MenuItem key={r.id} value={r.id}>
                            {r.label}
                          </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                  <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Дата начала"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      disabled={disabled}
                  />
                </Box>

                <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                  <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Время начала"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      disabled={disabled}
                  />
                </Box>

                <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                  <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Дата окончания"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      disabled={disabled}
                  />
                </Box>

                <Box sx={{ width: { xs: "100%", sm: "calc(50% - 8px)" } }}>
                  <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Время окончания"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      disabled={disabled}
                  />
                </Box>

                <Box sx={{ width: "100%", mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Выбранная аудитория: <b>{roomLabel || "—"}</b>
                  </Typography>
                </Box>

                {formError && (
                    <Box sx={{ width: "100%", mt: 1 }}>
                      <Alert severity="error">{formError}</Alert>
                    </Box>
                )}
              </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={disabled}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={disabled}>
            {submitLabel}
          </Button>
        </DialogActions>
      </Dialog>
  );
}
