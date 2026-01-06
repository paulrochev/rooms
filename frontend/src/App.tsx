// src/App.tsx
import { useState } from "react";
import { Container, Box } from "@mui/material";

import { Header } from "./components/Header";
import { StatsCard } from "./components/Stats/Card";
import { Footer } from "./components/Footer/Footer.tsx";
import { AddRoomDialog } from "./components/AddRoomDialog/AddRoom.Dialog.tsx";
import { BookingDialog } from "./components/BookingDialog/BookingDialog.tsx";
import { Button } from "./components/Button";

import { BookingsTable } from "./components/BookingsTable/BookingsTable.tsx";

import "./App.css";

function App() {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [bookingId, setBookingId] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  const openCreateBooking = () => {
    setMode("create");
    setBookingId(undefined);
    setBookingDialogOpen(true);
  };

  const openEditBooking = (id: string) => {
    setMode("edit");
    setBookingId(id);
    setBookingDialogOpen(true);
  };

  const handleAddRoom = (roomData: {
    code: string;
    name: string;
    capacity: number;
    equipment: string[];
  }) => {
    console.log("Добавлена новая аудитория:", roomData);
    alert(`Аудитория "${roomData.name}" успешно добавлена!`);
  };

  return (
      <>
        <Header
            activeNavId="catalog"
            onNavigate={(id) => console.log("goto", id)}
            onBellClick={() => console.log("bell")}
        />

        <main style={{ padding: "16px", color: "black" }}>
          <h2>Каталог аудиторий</h2>

          <div
              style={{
                margin: "auto",
                display: "flex",
                gap: 16,
                justifyContent: "space-around",
                width: "97%",
              }}
          >
            <StatsCard id={1} label="Всего аудиторий" value={3} />
            <StatsCard id={2} label="Доступно сейчас" value={3} />
            <StatsCard id={3} label="Забронированы" value={0} />
            <StatsCard id={4} label="Единиц оборудования" value={9} />
          </div>

          <div
              style={{
                backgroundColor: "#fff",
                padding: "3px 15px",
                border: "1px #eee solid",
                borderRadius: "10px",
                width: "97%",
                margin: "30px auto",
              }}
          >
            <h3>Список бронирований</h3>

            <Container maxWidth="xl">
              <Box sx={{ my: 2 }}>
                <BookingsTable key={reloadKey} onEdit={openEditBooking} />
              </Box>
            </Container>
          </div>

          <div
              style={{
                backgroundColor: "#fff",
                padding: "3px 15px",
                border: "1px #eee solid",
                borderRadius: "10px",
                width: "97%",
                margin: "auto",
              }}
          >
            <h3>Быстрые действия</h3>
            <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  height: "70px",
                  justifyContent: "space-around",
                }}
            >
              <Button iconId={1} onClick={() => setOpenAddDialog(true)}>
                Добавить аудиторию
              </Button>

              <Button iconId={2} onClick={openCreateBooking}>
                Создать бронирование
              </Button>

              <Button iconId={3}>Массовое редактирование</Button>
            </div>
          </div>

          <Footer />
        </main>

        <AddRoomDialog
            open={openAddDialog}
            onClose={() => setOpenAddDialog(false)}
            onAdd={handleAddRoom}
        />

        <BookingDialog
            open={bookingDialogOpen}
            mode={mode}
            bookingId={bookingId}
            onClose={() => setBookingDialogOpen(false)}
            onSuccess={() => setReloadKey((x) => x + 1)}
        />
      </>
  );
}

export default App;
