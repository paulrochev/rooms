// src/types/room.ts

export interface Equipment {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  num: string;
  name: string;
  loc: string;
  capacity: number;
  equip: Equipment[];
  status: "free" | "booked" | "maint";
}