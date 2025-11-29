// src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
export function createSocket(token) {
  return io(SOCKET_URL, { auth: { token }, autoConnect: true });
}
