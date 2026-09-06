import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Video, Phone, PhoneOff } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import './IncomingCallModal.css';

const IncomingCallModal = () => {
  const { incomingCall, answerCall, declineCall, clearIncomingCall } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const audioContextRef = useRef(null);
  const ringIntervalRef = useRef(null);

  // Helper to play synthesized ringtone using Web Audio API (no external MP3 needed)
  const startRingingSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const playChime = () => {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;

        // Pleasant dual-tone chord (E5 = 659.25Hz, G#5 = 830.61Hz)
        const freqs = [659.25, 830.61];
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.85);
        });

        // Second beat of the ring pulse (after 250ms)
        const secondBeat = now + 0.25;
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * 1.12, secondBeat);

          gain.gain.setValueAtTime(0, secondBeat);
          gain.gain.linearRampToValueAtTime(0.08, secondBeat + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, secondBeat + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(secondBeat);
          osc.stop(secondBeat + 0.85);
        });
      };

      // Play initial chime
      playChime();

      // Repeat chime every 2.5 seconds
      ringIntervalRef.current = setInterval(playChime, 2500);
    } catch (err) {
      console.warn('Audio ringtone note:', err);
    }
  };

  const stopRingingSound = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch (err) {}
      audioContextRef.current = null;
    }
  };

  // Manage ringing sound and 45-second auto-timeout
  useEffect(() => {
    if (incomingCall) {
      // If user is already on the exact call page, auto clear
      if (location.pathname === `/call/${incomingCall.meetingId}`) {
        clearIncomingCall();
        return;
      }

      startRingingSound();

      // Auto decline after 45 seconds of ringing
      const timeoutId = setTimeout(() => {
        stopRingingSound();
        declineCall();
      }, 45000);

      return () => {
        stopRingingSound();
        clearTimeout(timeoutId);
      };
    } else {
      stopRingingSound();
    }
  }, [incomingCall, location.pathname]);

  if (!incomingCall) return null;

  const handleAccept = () => {
    stopRingingSound();
    const callInfo = answerCall();
    if (callInfo?.meetingId) {
      navigate(`/call/${callInfo.meetingId}`);
    }
  };

  const handleDecline = () => {
    stopRingingSound();
    declineCall();
  };

  return (
    <div className="incoming-call-overlay" role="dialog" aria-modal="true">
      <div className="incoming-call-card">
        {/* Pulsing Avatar / Video Icon */}
        <div className="incoming-call-avatar-wrapper">
          <div className="call-pulse-ring ring-1" />
          <div className="call-pulse-ring ring-2" />
          <div className="incoming-call-avatar">
            <Video size={32} color="#ffffff" />
          </div>
        </div>

        {/* Caller Info */}
        <div className="incoming-call-content">
          <span className="incoming-call-badge">Incoming Video Consultation</span>
          <h3 className="incoming-call-name">
            {incomingCall.callerName || 'Participant'}
          </h3>
          <p className="incoming-call-role">
            {incomingCall.callerRole === 'counselor' ? '🎓 Career Counselor' : '👤 Student'}
          </p>
          <p className="incoming-call-topic">
            "{incomingCall.topic || 'Career Guidance Session'}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="incoming-call-actions">
          <button
            type="button"
            className="call-btn call-decline-btn"
            onClick={handleDecline}
            title="Decline Call"
          >
            <PhoneOff size={22} />
            <span>Decline</span>
          </button>

          <button
            type="button"
            className="call-btn call-accept-btn"
            onClick={handleAccept}
            title="Accept Video Call"
          >
            <Phone size={22} className="phone-icon-animated" />
            <span>Accept Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
