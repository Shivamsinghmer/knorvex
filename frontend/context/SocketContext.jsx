'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '@/store/authStore';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuthStore();
  const socketRef = useRef(null);
  const userId = user?.id || user?._id;
  // Expose a stable version number so consumers can re-subscribe after reconnect
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Already connected for the same user — skip
    if (socketRef.current?.connected) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
    });

    socket.on('connect', () => {
      socket.emit('join', { userId });
      setVersion((v) => v + 1);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socketRef, version }}>
      {children}
    </SocketContext.Provider>
  );
}

/** Returns { socket, connected } — socket may be null before first connect */
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) return { socket: null, connected: false };
  return {
    socket: ctx.socketRef.current,
    socketRef: ctx.socketRef,
    version: ctx.version,
  };
}
