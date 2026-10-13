import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Hook to manage a Socket.io connection.
 * @param {string} doctorId - Doctor ID to join the room for
 * @param {Function} onAvailabilityUpdated - Callback for availability_updated event
 */
const useSocket = (doctorId, onAvailabilityUpdated) => {
  const socketRef = useRef(null);

  const stableCallback = useCallback(
    (data) => {
      if (onAvailabilityUpdated) {
        onAvailabilityUpdated(data);
      }
    },
    [onAvailabilityUpdated]
  );

  useEffect(() => {
    if (!doctorId) return;

    // Connect via the Vite proxy
    const socket = io('/', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      socket.emit('join_doctor_room', doctorId);
    });

    socket.on('availability_updated', stableCallback);

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    return () => {
      socket.off('availability_updated', stableCallback);
      socket.disconnect();
    };
  }, [doctorId, stableCallback]);

  return socketRef;
};

export default useSocket;
