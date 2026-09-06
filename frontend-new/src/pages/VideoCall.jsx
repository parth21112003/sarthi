import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Users, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import meetingService from '../services/meetingService';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import './Phase2.css';

// Free Google Public STUN servers for WebRTC peer connection
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const VideoCall = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, hangupCall } = useSocket();

  const [loading, setLoading] = useState(true);
  const [meetingData, setMeetingData] = useState(null);
  const [callStatus, setCallStatus] = useState('initializing'); // initializing, waiting, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  // Clean up media and peer connection
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  // Fetch meeting room data & setup media
  useEffect(() => {
    let isMounted = true;

    const setupCall = async () => {
      try {
        const roomData = await meetingService.getRoom(meetingId);
        if (!isMounted) return;
        setMeetingData(roomData);

        // Get user camera & microphone
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (!isMounted) return;
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (mediaErr) {
          toast.error('Unable to access camera or microphone. Please check browser permissions.');
        }

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
  }, [meetingId, socket, navigate, user, cleanup]);

  // Create PeerConnection instance
  const createPeerConnection = useCallback((roomId) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(iceServers);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setPeerConnected(true);
        setCallStatus('connected');
      }
    };

    // Send ICE candidates to peer through socket
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:signal', {
          roomId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
        setPeerConnected(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setCallStatus('waiting');
        setPeerConnected(false);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [socket]);

  // Handle WebRTC signaling socket events
  useEffect(() => {
    if (!socket || !meetingData?.roomId) return;
    const roomId = meetingData.roomId;

    // A peer joined: Caller creates Offer
    const handleUserJoined = async () => {
      try {
        const pc = createPeerConnection(roomId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:signal', {
          roomId,
          signal: { type: 'offer', sdp: offer },
        });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    };

    // Received signal from peer (offer, answer, or candidate)
    const handleSignal = async ({ signal }) => {
      try {
        let pc = pcRef.current;
        if (!pc) {
          pc = createPeerConnection(roomId);
        }

        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:signal', {
            roomId,
            signal: { type: 'answer', sdp: answer },
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === 'candidate' && signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (iceErr) {
            console.error('Error adding ICE candidate:', iceErr);
          }
        }
      } catch (err) {
        console.error('Signaling processing error:', err);
      }
    };

    const handleCallEnded = () => {
      toast('Call ended by participant');
      setCallStatus('ended');
      setPeerConnected(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

    socket.on('call:user-joined', handleUserJoined);
    socket.on('call:signal', handleSignal);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:user-joined', handleUserJoined);
      socket.off('call:signal', handleSignal);
      socket.off('call:ended', handleCallEnded);
    };
  }, [socket, meetingData, createPeerConnection]);

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

  const otherPerson = user?.role === 'counselor'
    ? meetingData?.meeting?.student
    : meetingData?.meeting?.counselor;

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
          background: 'rgba(17, 17, 51, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span className="logo-icon gradient-bg" style={{ width: 32, height: 32, fontSize: '0.9rem' }}>S</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>
              {meetingData?.meeting?.topic || 'Career Consultation Session'}
            </h4>
            <span className="muted small-text">
              Meeting with {otherPerson?.name}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              background: peerConnected ? 'rgba(0, 184, 148, 0.2)' : 'rgba(253, 203, 110, 0.2)',
              color: peerConnected ? 'var(--accent-green)' : 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: peerConnected ? 'var(--accent-green)' : 'var(--accent-amber)',
              }}
            />
            {peerConnected ? 'Connected' : 'Waiting for participant...'}
          </span>
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
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: peerConnected ? 'block' : 'none',
            }}
          />

          {!peerConnected && (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                }}
              >
                <Users size={36} color="var(--primary-light)" />
              </div>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>
                Waiting for {otherPerson?.name || 'Participant'}
              </h3>
              <p className="muted small-text" style={{ maxWidth: 360, margin: '0 auto' }}>
                Your camera and audio are active. Once they join the meeting link, the live video connection will start automatically.
              </p>
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
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              zIndex: 10,
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // mirror selfie video
                display: isVideoOff ? 'none' : 'block',
              }}
            />
            {isVideoOff && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                Camera Off
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: 6,
                fontSize: '10px',
                background: 'rgba(0,0,0,0.6)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              You ({isMuted ? 'Muted' : 'Mic on'})
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
            background: isMuted ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.1)',
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
            background: isVideoOff ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.1)',
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

        <button
          onClick={handleLeaveCall}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            background: '#eb4d4b',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(235, 77, 75, 0.5)',
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
