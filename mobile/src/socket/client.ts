import { io } from "socket.io-client";
import { mobileEnv } from "../config/env";

export const socket = io(mobileEnv.socketUrl, {
  autoConnect: false,
  transports: ["websocket"],
});
