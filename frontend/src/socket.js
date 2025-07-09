import { io } from 'socket.io-client';
import { BACKEND_URL } from './config.js';

const socket = io(BACKEND_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

export default socket;
