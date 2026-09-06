import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Users, AlertCircle, RefreshCw, Bell, Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import meetingService from '../services/meetingService';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import './Phase2.css';

// Rock-solid STUN servers with NAT traversal pool
const iceConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

const VideoCall = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, hangupCall } = useSocket();

  const [loading, setLoading] = useState(true);
  const [meetingData, setMeetingData] = useState(null);
  const [callStatus, setCallStatus] = useState('initializing'); // initializing, waiting, connecting, connected, ended
  const [roomParticipantCount, setRoomParticipantCount] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isRinging, setIsRinging] = useState(false);
  const [needsAutoplayUnlock, setNeedsAutoplayUnlock] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  // WebRTC Perfect Negotiation & Candidate Queue Refs
  const candidateQueue = useRef([]);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const hasSignaledEntry = useRef(false);

  // Clean up media and peer connection
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
    setCameraError(null);
    candidateQueue.current = [];
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }
  }, []);

  // Robust media stream acquisition with device enumeration
  const initMediaStream = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API not supported in this browser.');
        return null;
      }

      // Enumerate devices to pick a true RGB webcam (filtering out Windows Hello IR sensors)
      let preferredDeviceId = null;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        const rgbCamera = videoInputs.find(
          (d) => !d.label.toLowerCase().includes('ir') && !d.label.toLowerCase().includes('virtual')
        );
        if (rgbCamera && rgbCamera.deviceId) {
          preferredDeviceId = rgbCamera.deviceId;
        }
      } catch (devErr) {
        console.warn('Webcam device enumeration note:', devErr);
      }

      let stream = null;

      // Attempt 1: Combined video + audio
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: preferredDeviceId ? { deviceId: { exact: preferredDeviceId } } : true,
          audio: true,
        });
      } catch (err1) {
        console.warn('Combined stream failed, trying video only:', err1);
        // Attempt 2: Video only
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });

          // Attempt to add microphone track
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getAudioTracks().forEach((track) => stream.addTrack(track));
          } catch (audioErr) {
            console.warn('Microphone track could not be added:', audioErr);
          }
        } catch (err2) {
          console.error('All camera requests failed:', err2);
          if (err2.name === 'NotAllowedError' || err2.name === 'PermissionDeniedError') {
            setCameraError('Camera permission blocked. Click the lock/camera icon in your address bar to allow.');
          } else if (err2.name === 'NotReadableError' || err2.name === 'TrackStartError') {
            setCameraError('Camera is in use by another app. Close other apps and click Retry.');
          } else if (err2.name === 'NotFoundError' || err2.name === 'DevicesNotFoundError') {
            setCameraError('No webcam detected.');
          } else {
            setCameraError(`Camera error (${err2.name || 'Hardware unavailable'}).`);
          }
          return null;
        }
      }

      if (stream) {
        localStreamRef.current = stream;
        setLocalStream(stream);
        setCameraError(null);

        // If peer connection already exists, feed tracks
        if (pcRef.current) {
          stream.getTracks().forEach((track) => {
            const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track).catch((e) => console.warn('replaceTrack notice:', e));
            } else {
              try {
                pcRef.current.addTrack(track, stream);
              } catch (addErr) {
                console.warn('addTrack notice:', addErr);
              }
            }
          });
        }
        return stream;
      }
    } catch (generalErr) {
      console.error('General media acquisition error:', generalErr);
      setCameraError('Unable to start camera.');
    }
    return null;
  }, []);

  // Determine opposing participant
  const otherPerson = user?.role === 'counselor'
    ? meetingData?.meeting?.student
    : meetingData?.meeting?.counselor;

  // The peer with the lower numeric user ID is designated the "polite" peer
  const isPolite = user?.id && otherPerson?.id
    ? Number(user.id) < Number(otherPerson.id)
    : user?.role === 'student';

  // Ring the opposing participant with high-visibility push notification
  const ringParticipant = useCallback((customMsg = null) => {
    if (!socket || !otherPerson?.id || !meetingData) return;
    setIsRinging(true);
    socket.emit('call:initiate', {
      targetUserId: otherPerson.id,
      roomId: meetingData.roomId,
      meetingId: meetingData.meeting.id,
      topic: meetingData.meeting.topic,
      callerName: user?.name || user?.email,
      callerRole: user?.role,
    });
    toast.success(customMsg || `Calling ${otherPerson.name || 'participant'}...`);
    setTimeout(() => setIsRinging(false), 8000);
  }, [socket, otherPerson, meetingData, user]);

  // Drain ICE candidates safely once remote description is set
  const drainCandidateQueue = useCallback(async (pc) => {
    while (candidateQueue.current.length > 0) {
      const candidate = candidateQueue.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('ICE candidate drain notice:', err);
      }
    }
  }, []);

  // Create or return active PeerConnection
  const getOrCreatePeerConnection = useCallback((roomId) => {
    if (pcRef.current && pcRef.current.signalingState !== 'closed') {
      return pcRef.current;
    }

    const pc = new RTCPeerConnection(iceConfiguration);
    pcRef.current = pc;

    // Pre-add transceivers so SDP negotiation prepares both audio and video m-lines immediately
    try {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      pc.addTransceiver('video', { direction: 'sendrecv' });
    } catch (e) {
      console.warn('Transceiver addition note:', e);
    }

    // Attach local media tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch(() => {});
        } else {
          try {
            pc.addTrack(track, localStreamRef.current);
          } catch (e) {}
        }
      });
    }

    // Handle incoming remote media tracks (combines streams safely for mobile/desktop)
    pc.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!remoteStreamRef.current.getTracks().some((t) => t.id === track.id)) {
            remoteStreamRef.current.addTrack(track);
          }
        });
      } else if (event.track) {
        if (!remoteStreamRef.current.getTracks().some((t) => t.id === event.track.id)) {
          remoteStreamRef.current.addTrack(event.track);
        }
      }

      setRemoteStream(remoteStreamRef.current);
      setPeerConnected(true);
      setCallStatus('connected');

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch((err) => {
          console.warn('Autoplay waiting for user gesture:', err);
          setNeedsAutoplayUnlock(true);
        });
      }
    };

    // Forward ICE candidates to remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:signal', {
          roomId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    // Connection state listeners
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        setPeerConnected(true);
        setCallStatus('connected');
      } else if (state === 'failed') {
        console.warn('ICE connection failed, attempting restart...');
        if (pc.restartIce) {
          pc.restartIce();
        }
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        setPeerConnected(true);
        setCallStatus('connected');
      } else if (state === 'disconnected') {
        setCallStatus('connecting');
      } else if (state === 'failed') {
        setCallStatus('waiting');
        setPeerConnected(false);
      }
    };

    return pc;
  }, [socket]);

  // Initiate WebRTC Offer (Perfect Negotiation pattern)
  const createAndSendOffer = useCallback(async (roomId, options = {}) => {
    if (!socket || !roomId) return;
    try {
      const pc = getOrCreatePeerConnection(roomId);
      makingOfferRef.current = true;
      setCallStatus('connecting');

      const offer = await pc.createOffer(options);
      if (pc.signalingState !== 'stable') return;
      await pc.setLocalDescription(offer);

      socket.emit('call:signal', {
        roomId,
        signal: { type: 'offer', sdp: pc.localDescription },
      });
    } catch (err) {
      console.error('Offer generation error:', err);
    } finally {
      makingOfferRef.current = false;
    }
  }, [socket, getOrCreatePeerConnection]);

  // Handle re-sync request or manual user reconnect
  const handleResyncConnection = useCallback(() => {
    if (!meetingData?.roomId || !socket) return;
    toast('Re-synchronizing video stream...');
    socket.emit('call:sync', { roomId: meetingData.roomId });
    createAndSendOffer(meetingData.roomId, { iceRestart: true });
  }, [meetingData, socket, createAndSendOffer]);

  // Mobile Autoplay unlocker
  const handleUnlockAutoplay = () => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().then(() => {
        setNeedsAutoplayUnlock(false);
      }).catch((e) => console.warn('Unlock play error:', e));
    }
  };

  // Fetch meeting room & setup socket room
  useEffect(() => {
    let isMounted = true;

    const setupCall = async () => {
      try {
        const roomData = await meetingService.getRoom(meetingId);
        if (!isMounted) return;
        setMeetingData(roomData);

        // Acquire webcam and microphone
        await initMediaStream();

        // Join room in socket
        if (socket && roomData.roomId) {
          socket.emit('call:join-room', { roomId: roomData.roomId });
          setCallStatus('waiting');
        }

        setLoading(false);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load video session');
        navigate(user?.role === 'counselor' ? '/counselor/meetings' : '/student/meetings');
      }
    };

    setupCall();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [meetingId, socket, navigate, user, cleanup, initMediaStream]);

  // Auto-ring participant once on initial entry if participant has not joined
  useEffect(() => {
    if (meetingData && socket && otherPerson?.id && !hasSignaledEntry.current) {
      hasSignaledEntry.current = true;
      // Delay slightly to let socket room subscribe
      const timer = setTimeout(() => {
        ringParticipant(`Notifying ${otherPerson.name || 'participant'} of call start...`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [meetingData, socket, otherPerson, ringParticipant]);

  // Synchronize local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      const video = localVideoRef.current;
      if (video.srcObject !== localStream) {
        video.srcObject = localStream;
      }
      video.muted = true;
      video.defaultMuted = true;
      video.play().catch(() => {});
    }
  }, [localStream, isVideoOff]);

  // Socket Signaling Event Listeners
  useEffect(() => {
    if (!socket || !meetingData?.roomId) return;
    const roomId = meetingData.roomId;

    // Room Status update (received upon joining)
    const handleRoomStatus = ({ participantCount }) => {
      setRoomParticipantCount(participantCount);
      if (participantCount > 1) {
        // If we are the second or later joiner, initiate offer if not polite
        if (!isPolite) {
          createAndSendOffer(roomId);
        }
      }
    };

    // Remote peer joined the room
    const handleUserJoined = () => {
      setRoomParticipantCount((prev) => Math.max(prev, 2));
      toast(`${otherPerson?.name || 'Participant'} joined the room`);
      // When peer arrives, the caller / impolite peer initiates the offer
      if (!isPolite) {
        createAndSendOffer(roomId);
      }
    };

    // Both peers present: Synchronized negotiation trigger
    const handleCallReady = () => {
      setRoomParticipantCount((prev) => Math.max(prev, 2));
      if (!isPolite) {
        createAndSendOffer(roomId);
      }
    };

    // Incoming WebRTC Signal (Offer, Answer, ICE Candidate)
    const handleSignal = async ({ signal }) => {
      const pc = getOrCreatePeerConnection(roomId);

      try {
        if (signal.type === 'offer') {
          const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';
          ignoreOfferRef.current = !isPolite && offerCollision;

          if (ignoreOfferRef.current) {
            console.log('Glare detected: Impolite peer ignoring collision offer');
            return;
          }

          if (offerCollision) {
            await pc.setLocalDescription({ type: 'rollback' });
          }

          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await drainCandidateQueue(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('call:signal', {
            roomId,
            signal: { type: 'answer', sdp: pc.localDescription },
          });
        } else if (signal.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            await drainCandidateQueue(pc);
          }
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (candErr) {
              if (!ignoreOfferRef.current) {
                console.warn('addIceCandidate error:', candErr);
              }
            }
          } else {
            candidateQueue.current.push(signal.candidate);
          }
        }
      } catch (err) {
        console.error('Signaling processing error:', err);
      }
    };

    // Remote peer requested re-sync
    const handleSyncRequest = () => {
      console.log('Sync request received from peer');
      if (!isPolite) {
        createAndSendOffer(roomId, { iceRestart: true });
      }
    };

    const handleCallAccepted = () => {
      toast.success(`${otherPerson?.name || 'Participant'} accepted the call!`);
    };

    const handleCallRejected = () => {
      toast.error(`${otherPerson?.name || 'Participant'} declined the call`);
      setCallStatus('ended');
    };

    const handleCallEnded = () => {
      toast('Call ended by participant');
      setCallStatus('ended');
      setPeerConnected(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

    socket.on('call:room-status', handleRoomStatus);
    socket.on('call:user-joined', handleUserJoined);
    socket.on('call:ready', handleCallReady);
    socket.on('call:signal', handleSignal);
    socket.on('call:sync-request', handleSyncRequest);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:room-status', handleRoomStatus);
      socket.off('call:user-joined', handleUserJoined);
      socket.off('call:ready', handleCallReady);
      socket.off('call:signal', handleSignal);
      socket.off('call:sync-request', handleSyncRequest);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
    };
  }, [
    socket, 
    meetingData, 
    isPolite, 
    otherPerson, 
    getOrCreatePeerConnection, 
    createAndSendOffer, 
    drainCandidateQueue
  ]);

  // Audio Toggle
  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Video Toggle
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // End Call & Return to Meetings
  const handleLeaveCall = () => {
    if (meetingData?.roomId) {
      hangupCall(meetingData.roomId);
    }
    cleanup();
    toast.success('Call ended');
    navigate(user?.role === 'counselor' ? '/counselor/meetings' : '/student/meetings');
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
        <Spinner size="lg" text="Preparing video consultation room..." />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#070714',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          padding: 'var(--space-3) var(--space-6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(17, 17, 51, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span className="logo-icon gradient-bg" style={{ width: 32, height: 32, fontSize: '0.9rem' }}>S</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#ffffff' }}>
              {meetingData?.meeting?.topic || 'Career Consultation Session'}
            </h4>
            <span className="muted small-text" style={{ color: '#a1a1aa' }}>
              Session with {otherPerson?.name || 'Participant'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Status Indicator */}
          <span
            style={{
              padding: '5px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              background: peerConnected 
                ? 'rgba(16, 185, 129, 0.2)' 
                : roomParticipantCount > 1 
                  ? 'rgba(245, 158, 11, 0.2)' 
                  : 'rgba(99, 102, 241, 0.15)',
              color: peerConnected 
                ? '#10b981' 
                : roomParticipantCount > 1 
                  ? '#f59e0b' 
                  : '#a5b4fc',
              border: `1px solid ${
                peerConnected 
                  ? 'rgba(16, 185, 129, 0.4)' 
                  : roomParticipantCount > 1 
                    ? 'rgba(245, 158, 11, 0.4)' 
                    : 'rgba(99, 102, 241, 0.3)'
              }`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: peerConnected 
                  ? '#10b981' 
                  : roomParticipantCount > 1 
                    ? '#f59e0b' 
                    : '#818cf8',
              }}
            />
            {peerConnected 
              ? 'Live Connected' 
              : roomParticipantCount > 1 
                ? 'Connecting Stream...' 
                : `Waiting for ${otherPerson?.name || 'Participant'}`}
          </span>

          {/* Manual Ring Button */}
          {!peerConnected && (
            <button
              onClick={() => ringParticipant()}
              disabled={isRinging}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                background: isRinging ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: isRinging ? '#10b981' : '#ffffff',
                border: '1px solid var(--glass-border)',
                fontSize: 'var(--text-xs)',
                cursor: isRinging ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Send incoming call notification to participant"
            >
              <Bell size={13} className={isRinging ? 'phone-icon-animated' : ''} />
              <span>{isRinging ? 'Ringing...' : 'Ring Again'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Video Grid */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
        }}
      >
        {/* Remote Video (Main Frame) */}
        <div
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '1200px',
            maxHeight: '80vh',
            borderRadius: 'var(--radius-lg)',
            background: '#0f0f23',
            border: '1px solid var(--glass-border)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={(node) => {
              remoteVideoRef.current = node;
              if (node && remoteStreamRef.current) {
                if (node.srcObject !== remoteStreamRef.current) {
                  node.srcObject = remoteStreamRef.current;
                }
                node.play().catch(() => setNeedsAutoplayUnlock(true));
              }
            }}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: peerConnected ? 'block' : 'none',
            }}
          />

          {/* Autoplay Unlock Banner for Mobile Browsers */}
          {needsAutoplayUnlock && peerConnected && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
              }}
            >
              <Volume2 size={40} color="#10b981" style={{ marginBottom: 12 }} />
              <h4 style={{ color: '#fff', marginBottom: 8 }}>Tap to Enable Audio & Video</h4>
              <button
                onClick={handleUnlockAutoplay}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                Start Watching
              </button>
            </div>
          )}

          {/* Waiting & Ringing Display */}
          {!peerConnected && (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)', maxWidth: 440 }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  background: roomParticipantCount > 1 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  border: `2px dashed ${roomParticipantCount > 1 ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)'}`,
                }}
              >
                {roomParticipantCount > 1 ? (
                  <RefreshCw size={36} color="#f59e0b" className="spin-slow" />
                ) : (
                  <Users size={36} color="#818cf8" />
                )}
              </div>

              <h3 style={{ marginBottom: 'var(--space-2)', color: '#ffffff' }}>
                {roomParticipantCount > 1
                  ? 'Connecting with ' + (otherPerson?.name || 'Participant') + '...'
                  : 'Waiting for ' + (otherPerson?.name || 'Participant')}
              </h3>

              <p className="muted small-text" style={{ margin: '0 auto var(--space-4)', color: '#a1a1aa' }}>
                {roomParticipantCount > 1
                  ? 'Both devices are in the room! Handshaking WebRTC video stream...'
                  : `We sent an incoming call notification to ${otherPerson?.name || 'them'}. Your camera is ready.`}
              </p>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                <Button
                  size="sm"
                  variant="primary"
                  iconLeft={<Bell size={15} />}
                  onClick={() => ringParticipant()}
                  disabled={isRinging}
                >
                  {isRinging ? 'Ringing...' : 'Send Call Notification'}
                </Button>

                {roomParticipantCount > 1 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    iconLeft={<RefreshCw size={15} />}
                    onClick={handleResyncConnection}
                  >
                    Re-sync Stream
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Local Video (Floating Picture-in-Picture) */}
          <div
            style={{
              position: 'absolute',
              bottom: 'var(--space-4)',
              right: 'var(--space-4)',
              width: '220px',
              height: '140px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: '#1a1a3a',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
              zIndex: 10,
            }}
          >
            <video
              ref={(node) => {
                localVideoRef.current = node;
                if (node && localStreamRef.current) {
                  if (node.srcObject !== localStreamRef.current) {
                    node.srcObject = localStreamRef.current;
                  }
                  node.muted = true;
                  node.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // mirror selfie
                display: isVideoOff || cameraError ? 'none' : 'block',
              }}
            />

            {isVideoOff && !cameraError && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--text-xs)',
                  background: '#121226',
                }}
              >
                Camera Off
              </div>
            )}

            {cameraError && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  padding: 'var(--space-2)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  background: 'rgba(235, 77, 75, 0.15)',
                  color: '#ff6b6b',
                  fontSize: '10px',
                  lineHeight: 1.3,
                }}
              >
                <AlertCircle size={16} style={{ marginBottom: 4 }} />
                <span>{cameraError}</span>
                <button
                  onClick={initMediaStream}
                  style={{
                    marginTop: 6,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #ff6b6b',
                    background: 'rgba(255, 107, 107, 0.25)',
                    color: '#fff',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={10} /> Retry Camera
                </button>
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: 6,
                fontSize: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              You ({cameraError ? 'No cam' : isMuted ? 'Muted' : 'Mic on'})
            </div>
          </div>
        </div>
      </div>

      {/* Video Call Action Controls Bar */}
      <div
        style={{
          padding: 'var(--space-4)',
          background: 'rgba(10, 10, 26, 0.95)',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <button
          onClick={toggleAudio}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: 'none',
            background: isMuted ? '#f97316' : 'rgba(255, 255, 255, 0.12)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          onClick={toggleVideo}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: 'none',
            background: isVideoOff ? '#f97316' : 'rgba(255, 255, 255, 0.12)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          title={isVideoOff ? 'Start camera' : 'Stop camera'}
        >
          {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
        </button>

        {/* Resync Button */}
        <button
          onClick={handleResyncConnection}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
          title="Re-synchronize connection"
        >
          <RefreshCw size={20} />
        </button>

        <button
          onClick={handleLeaveCall}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.5)',
            transition: 'all var(--transition-fast)',
          }}
          title="Leave consultation call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
