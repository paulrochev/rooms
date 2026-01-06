// src/components/BookingsTable/BookingsTable.tsx
import { useEffect, useState } from "react";
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Box,
  IconButton,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  VisibilityOutlined,
  EditOutlined,
  DeleteOutline,
  EventOutlined,
  PersonOutline,
  MeetingRoomOutlined,
} from "@mui/icons-material";

import {
  fetchActiveBookings,
  deleteBooking,
  type BookingDto,
} from "../../api/bookingsApi.ts";

function fmt(dtIso: string) {
  const d = new Date(dtIso);
  if (Number.isNaN(d.getTime())) return dtIso;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  onEdit: (id: string) => void;
};

export function BookingsTable({ onEdit }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BookingDto[]>([]);
  const [toDelete, setToDelete] = useState<BookingDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveBookings();
      setItems(data);
    } catch (e) {
      setError((e as Error).message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await deleteBooking(toDelete.id);
      setToDelete(null);
      await load();
    } catch (e) {
      setError((e as Error).message || "Не удалось удалить бронирование");
    } finally {
      setDeleting(false);
    }
  };

  if (loading)
    return (
        <Box sx={{ p: 3, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
    );

  if (error)
    return (
        <Box sx={{ p: 3 }}>
          <Typography color="error">Не удалось загрузить данные: {error}</Typography>
        </Box>
    );

  return (
      <>
        <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #eef0f3",
            }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={140}>Аудитория</TableCell>
                <TableCell width={280}>Период</TableCell>
                <TableCell>Организатор</TableCell>
                <TableCell width={170} align="center">
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <MeetingRoomOutlined fontSize="small" />
                        <Typography sx={{ color: "text.secondary" }}>
                          {b.room?.number ?? b.roomId ?? "—"}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.25}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <EventOutlined fontSize="small" />
                          <Typography variant="body2">{fmt(b.startTime)}</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {fmt(b.endTime)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PersonOutline fontSize="small" />
                        <Typography fontWeight={600}>{b.organizerName ?? "—"}</Typography>
                      </Stack>
                    </TableCell>

                    <TableCell align="center">
                      <IconButton size="small" title="Просмотр">
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>

                      <IconButton
                          size="small"
                          title="Редактировать"
                          onClick={() => onEdit(b.id)}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>

                      <IconButton
                          size="small"
                          color="error"
                          title="Удалить"
                          onClick={() => setToDelete(b)}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
              ))}

              {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography sx={{ py: 3 }} color="text.secondary" align="center">
                        Активных бронирований пока нет
                      </Typography>
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        <Dialog open={!!toDelete} onClose={deleting ? undefined : () => setToDelete(null)}>
          <DialogTitle>Удалить бронирование?</DialogTitle>
          <DialogContent>
            <Typography>
              Аудитория: <b>{toDelete?.room?.number ?? toDelete?.roomId ?? "—"}</b>
              <br />
              Период: {toDelete ? `${fmt(toDelete.startTime)} — ${fmt(toDelete.endTime)}` : "—"}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setToDelete(null)} disabled={deleting}>
              Отмена
            </Button>
            <Button
                color="error"
                variant="contained"
                onClick={handleConfirmDelete}
                disabled={deleting}
            >
              Удалить
            </Button>
          </DialogActions>
        </Dialog>
      </>
  );
}
