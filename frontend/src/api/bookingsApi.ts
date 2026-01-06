// src/api/bookingApi.ts
import { http } from "./http";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type BookingDto = {
  id: string;
  roomId: string;
  room?: { number: string } | null
  organizerName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status?: BookingStatus;
};

export type BookingCreateDto = Omit<BookingDto, "id" | "room">;

export async function fetchActiveBookings() {
  const { data } = await http.get<BookingDto[]>("/bookings");
  return data;
}

export async function fetchBookingById(id: string) {
  const { data } = await http.get<BookingDto>(`/bookings/${id}`);
  return data;
}

export async function createBooking(payload: BookingCreateDto) {
  const { data } = await http.post<{ id: string }>("/bookings", payload);
  return data;
}

export async function updateBooking(id: string, payload: Partial<BookingCreateDto>) {
  const { data } = await http.patch<{ id: string }>(`/bookings/${id}`, payload);
  return data;
}

export async function deleteBooking(id: string) {
  await http.delete(`/bookings/${id}`);
}
