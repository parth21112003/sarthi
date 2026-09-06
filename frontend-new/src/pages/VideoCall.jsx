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
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);

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
    setLocalStream(null);
    setRemoteStream(null);
    setCameraError(null);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  // Robust media stream acquisition with laptop/desktop device selection
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
        // Attempt 2: Video only (in case audio device is busy or blocked)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });

          // Attempt to add microphone track in background
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getAudioTracks().forEach((track) => stream.addTrack(track));
          } catch (audioErr) {
            console.warn('Microphone track could not be added:', audioErr);
          }
        } catch (err2) {
          console.error('All camera requests failed:', err2);
          if (err2.name === 'NotAllowedError' || err2.name === 'PermissionDeniedError') {
            setCameraError('Camera permission blocked. Click the camera icon in your browser address bar to allow.');
          } else if (err2.name === 'NotReadableError' || err2.name === 'TrackStartError') {
            setCameraError('Camera is in use by another app (Zoom, Teams, etc.). Close other apps and click Retry.');
          } else if (err2.name === 'NotFoundError' || err2.name === 'DevicesNotFoundError') {
            setCameraError('No webcam detected on your laptop.');
          } else {
            setCameraError(`Camera error (${err2.name || 'Hardware unavailable'}). Check Windows Camera privacy settings.`);
          }
          return null;
        }
      }

      if (stream) {
        localStreamRef.current = stream;
        setLocalStream(stream);
        setCameraError(null);

        // If peer connection already exists, feed the new tracks
        if (pcRef.current) {
          stream.getTracks().forEach((track) => {
            const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track);
            } else {
              pcRef.current.addTrack(track, stream);
            }
          });
        }
        return stream;
      }
    } catch (generalErr) {
      console.error('General media acquisition error:', generalErr);
      setCameraError('Unable to start webcam.');
    }
    return null;
  }, []);

  // Fetch meeting room data & setup media
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

  // Synchronize local video element whenever stream is acquired or component finishes loading
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      const video = localVideoRef.current;
      if (video.srcObject !== localStream) {
        video.srcObject = localStream;
      }
      video.muted = true;
      video.defaultMuted = true;
      video.onloadedmetadata = () => {
        video.muted = true;
        video.play().catch((err) => {
          console.warn('Local video play warning on metadata:', err);
        });
      };
      video.play().catch((err) => {
        console.warn('Local video auto-play warning:', err);
      });
    }
  }, [localStream, loading, isVideoOff]);

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
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
        }
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
            ref={(node) => {
              remoteVideoRef.current = node;
              if (node && remoteStream) {
                if (node.srcObject !== remoteStream) {
                  node.srcObject = remoteStream;
                }
                node.play().catch(() => {});
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
                transform: 'scaleX(-1)', // mirror selfie video
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
                  background: 'rgba(235, 77, 75, 0.1)',
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
                    background: 'rgba(255, 107, 107, 0.2)',
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
                background: 'rgba(0,0,0,0.6)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              You ({cameraError ? 'Camera issue' : isMuted ? 'Muted' : 'Mic on'})
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
