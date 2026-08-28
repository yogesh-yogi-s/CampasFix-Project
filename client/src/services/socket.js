import { io } from 'socket.io-client';

let socket;

export const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(serverUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};
export default socket;
