import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { CallType, CallSignalPayload, UserProfile } from '../types';
import { socket } from '../services/socket';
import { sound } from '../services/sound';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface ActiveCall {
  callId: string;
  targetUser: UserProfile;
  callType: CallType;
  isOutgoing: boolean;
  status: 'calling' | 'ringing' | 'connected' | 'ended';
  startedAt?: string;
}

interface CallContextType {
  activeCall: ActiveCall | null;
  incomingCall: CallSignalPayload | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callDuration: number; // in seconds
  startCall: (targetUser: UserProfile, callType: CallType, conversationId?: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSignalPayload | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  // Cleanup helper
  const cleanupCall = useCallback(() => {
    sound.stopRinging();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
    setActiveCall(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setCallDuration(0);
    pendingCandidates.current = [];
  }, []);

  // Listen to WebRTC Call Signals
  useEffect(() => {
    if (!currentUser) return;

    const unbindSignal = socket.on('call:signal', async (signal: CallSignalPayload) => {
      // 1. Incoming Call Offer
      if (signal.type === 'initiate') {
        if (activeCall || incomingCall) {
          // Send busy signal back
          socket.sendCallSignal({
            type: 'reject',
            callId: signal.callId,
            targetUserId: signal.callerId,
            reason: 'busy',
          });
          return;
        }

        setIncomingCall(signal);
        sound.startRinging();
      }

      // 2. Call Accepted
      else if (signal.type === 'accept') {
        sound.stopRinging();
        if (pcRef.current && signal.sdp) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          // Process queued ICE candidates
          while (pendingCandidates.current.length > 0) {
            const cand = pendingCandidates.current.shift();
            if (cand) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
          }

          setActiveCall((prev) => (prev ? { ...prev, status: 'connected', startedAt: new Date().toISOString() } : null));

          // Start duration timer
          setCallDuration(0);
          timerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }
      }

      // 3. Call Rejected / Busy
      else if (signal.type === 'reject') {
        sound.playHangupSound();
        cleanupCall();
      }

      // 4. ICE Candidate Relay
      else if (signal.type === 'ice-candidate') {
        if (pcRef.current && pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch((err) => {
            console.warn('Error adding ICE candidate:', err);
          });
        } else if (signal.candidate) {
          pendingCandidates.current.push(signal.candidate);
        }
      }

      // 5. Call Ended
      else if (signal.type === 'end') {
        sound.playHangupSound();
        cleanupCall();
      }
    });

    return () => {
      unbindSignal();
    };
  }, [currentUser, activeCall, incomingCall, cleanupCall]);

  // Initiate an Outgoing Call
  const startCall = async (targetUser: UserProfile, callType: CallType, conversationId?: string) => {
    if (!currentUser) return;

    try {
      cleanupCall();

      const callId = `call_${Date.now()}`;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
          setRemoteStream(remoteStreamRef.current);
        }
        event.streams[0].getTracks().forEach((track) => {
          remoteStreamRef.current?.addTrack(track);
        });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.sendCallSignal({
            type: 'ice-candidate',
            callId,
            targetUserId: targetUser.id,
            candidate: event.candidate,
          });
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setActiveCall({
        callId,
        targetUser,
        callType,
        isOutgoing: true,
        status: 'calling',
      });

      sound.startRinging();

      // Send initiate signal via socket
      socket.sendCallSignal({
        type: 'initiate',
        callId,
        callerId: currentUser.id,
        targetUserId: targetUser.id,
        callType,
        sdp: offer,
        caller: currentUser,
      });
    } catch (err) {
      console.error('Failed to start call (camera/mic permission error):', err);
      cleanupCall();
    }
  };

  // Accept Incoming Call
  const acceptCall = async () => {
    if (!incomingCall || !currentUser) return;

    sound.stopRinging();

    try {
      const { callId, callerId, callType, sdp, caller } = incomingCall;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
          setRemoteStream(remoteStreamRef.current);
        }
        event.streams[0].getTracks().forEach((track) => {
          remoteStreamRef.current?.addTrack(track);
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.sendCallSignal({
            type: 'ice-candidate',
            callId,
            targetUserId: callerId,
            candidate: event.candidate,
          });
        }
      };

      if (sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }

      // Add pending ICE candidates
      while (pendingCandidates.current.length > 0) {
        const cand = pendingCandidates.current.shift();
        if (cand) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.sendCallSignal({
        type: 'accept',
        callId,
        callerId: currentUser.id,
        targetUserId: callerId,
        sdp: answer,
      });

      const fallbackTarget: UserProfile = caller || {
        id: callerId,
        displayName: 'Caller',
        username: 'caller',
        email: '',
        role: 'member',
        status: 'approved',
        isOnline: true,
        lastSeen: '',
        createdAt: '',
      };

      setActiveCall({
        callId,
        targetUser: fallbackTarget,
        callType,
        isOutgoing: false,
        status: 'connected',
        startedAt: new Date().toISOString(),
      });

      setIncomingCall(null);

      // Start duration timer
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to accept call:', err);
      rejectCall();
    }
  };

  // Reject Incoming Call
  const rejectCall = () => {
    sound.stopRinging();
    if (incomingCall && currentUser) {
      socket.sendCallSignal({
        type: 'reject',
        callId: incomingCall.callId,
        targetUserId: incomingCall.callerId,
      });
      // Log missed/declined call
      api.logCall({
        callerId: incomingCall.callerId,
        receiverId: currentUser.id,
        callType: incomingCall.callType,
        status: 'declined',
        durationSeconds: 0,
      }).catch(() => {});
    }
    setIncomingCall(null);
  };

  // End Active Call
  const endCall = () => {
    if (activeCall && currentUser) {
      socket.sendCallSignal({
        type: 'end',
        callId: activeCall.callId,
        targetUserId: activeCall.targetUser.id,
      });

      // Log call to backend
      api.logCall({
        callerId: activeCall.isOutgoing ? currentUser.id : activeCall.targetUser.id,
        receiverId: activeCall.isOutgoing ? activeCall.targetUser.id : currentUser.id,
        callType: activeCall.callType,
        status: activeCall.status === 'connected' ? 'completed' : 'missed',
        durationSeconds: callDuration,
        startedAt: activeCall.startedAt,
        endedAt: new Date().toISOString(),
      }).catch(() => {});
    }

    sound.playHangupSound();
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        callDuration,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
