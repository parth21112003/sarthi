import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { accessToken, isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  // WebRTC Call State
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, roomId }
  const [activeCall, setActiveCall] = useState(null);     // { roomId, remoteUserId, isInitiator }

  useEffect(() => {
    if (!isAuthenticated || !accessToken) { 
      setOnlineUsers({});
      setSocket(null);
      return undefined;
    }

    const nextSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token: accessToken },
      withCredentials: true,
    });

    nextSocket.on('presence:update', ({ userId, status }) => {
      setOnlineUsers((current) => ({
        ...current,
        [userId]: status === 'online',
      }));
    });

    // WebRTC Signaling: Incoming Call
    nextSocket.on('call:incoming', ({ callerId, callerName, roomId }) => {
      setIncomingCall({ callerId, callerName, roomId });
    });

    nextSocket.on('call:rejected', () => {
      setActiveCall(null);
    });

    nextSocket.on('call:ended', () => {
      setActiveCall(null);
      setIncomingCall(null);
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
      setSocket(null);
      setOnlineUsers({});
    };
  }, [accessToken, isAuthenticated]);

  // Initiate call
  const startCall = useCallback((targetUserId, roomId) => {
    if (!socket || !targetUserId || !roomId) return;
    socket.emit('call:initiate', {
      targetUserId,
      roomId,
      callerName: user?.name || user?.email,
    });
    setActiveCall({ roomId, remoteUserId: targetUserId, isInitiator: true });
  }, [socket, user]);

  // Accept incoming call
  const answerCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    socket.emit('call:accept', {
      callerId: incomingCall.callerId,
      roomId: incomingCall.roomId,
    });
    setActiveCall({
      roomId: incomingCall.roomId,
      remoteUserId: incomingCall.callerId,
      isInitiator: false,
    });
    setIncomingCall(null);
  }, [socket, incomingCall]);

  // Reject incoming call
  const declineCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    socket.emit('call:reject', {
      callerId: incomingCall.callerId,
      roomId: incomingCall.roomId,
    });
    setIncomingCall(null);
  }, [socket, incomingCall]);

  // End active call
  const hangupCall = useCallback((roomId) => {
    if (!socket) return;
    const targetRoomId = roomId || activeCall?.roomId;
    if (targetRoomId) {
      socket.emit('call:end', { roomId: targetRoomId });
    }
    setActiveCall(null);
    setIncomingCall(null);
  }, [socket, activeCall]);

  const value = useMemo(() => ({
    socket,
    onlineUsers,
    incomingCall,
    activeCall,
    startCall,
    answerCall,
    declineCall,
    hangupCall,
  }), [socket, onlineUsers, incomingCall, activeCall, startCall, answerCall, declineCall, hangupCall]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
