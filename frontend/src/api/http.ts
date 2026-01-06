// src/api/http.ts
import axios from "axios";
export const http = axios.create({
  baseURL: "https://rooms-hoxx.onrender.com/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});
http.interceptors.response.use(
  (r) => r,
  (err) => { console.error("HTTP error:", err); throw err; }
);