import React, { useRef, useEffect } from 'react';
import { useCall } from '../contexts/CallContext';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';

export const CallModal: React.FC = () => {
  const {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. Incoming Call Dialog
  if (incomingCall && !activeCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
          <div className="relative mb-4">
            <img
              src={
                incomingCall.caller?.avatarUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall.callerId}`
              }
              alt="caller"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-[#0866FF]/20 shadow-md animate-pulse"
            />
            <span className="absolute bottom-0 right-0 p-2 bg-[#0866FF] text-white rounded-full">
              {incomingCall.callType === 'video' ? (
                <Video className="w-4 h-4" />
              ) : (
                <Phone className="w-4 h-4" />
              )}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {incomingCall.caller?.displayName || 'Incoming Call'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Incoming {incomingCall.callType} call...
          </p>

          <div className="flex items-center gap-6 mt-8">
            {/* Decline */}
            <button
              type="button"
              onClick={rejectCall}
              className="flex flex-col items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors"
            >
              <div className="p-4 bg-red-100 dark:bg-red-950/60 text-red-600 hover:bg-red-600 hover:text-white rounded-full transition-colors shadow-xs">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium">Decline</span>
            </button>

            {/* Accept */}
            <button
              type="button"
              onClick={acceptCall}
              className="flex flex-col items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <div className="p-4 bg-emerald-500 text-white hover:bg-emerald-600 rounded-full transition-colors shadow-md animate-bounce">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium">Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Call Floating/Full Screen Overlay
  if (!activeCall) return null;

  const isVideo = activeCall.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[700px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-slate-800">
        {/* Top Call Info Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <img
              src={
                activeCall.targetUser.avatarUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCall.targetUser.id}`
              }
              alt="target"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
            />
            <div>
              <h4 className="text-sm font-bold text-white">
                {activeCall.targetUser.displayName}
              </h4>
              <p className="text-xs text-white/70">
                {activeCall.status === 'connected'
                  ? formatDuration(callDuration)
                  : activeCall.status === 'ringing'
                  ? 'Ringing...'
                  : 'Connecting WebRTC peer...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-full text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="capitalize">{activeCall.callType} Call</span>
          </div>
        </div>

        {/* Video or Voice Center Display */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
          {isVideo ? (
            <>
              {/* Remote Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video Picture-in-Picture */}
              <div className="absolute bottom-24 right-6 w-36 sm:w-48 aspect-4/3 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-800 z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center text-xs text-white/70">
                    Camera Off
                  </div>
                )}
              </div>
            </>
          ) : (
            // Voice Call Visualization
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#0866FF]/20 rounded-full animate-ping" />
                <div className="absolute -inset-8 bg-[#0866FF]/10 rounded-full animate-pulse" />
                <img
                  src={
                    activeCall.targetUser.avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCall.targetUser.id}`
                  }
                  alt="avatar"
                  className="relative w-32 h-32 rounded-full object-cover ring-4 ring-[#0866FF] shadow-2xl"
                />
              </div>

              {/* Audio waveform visualization */}
              <div className="flex items-center gap-1.5 h-8">
                {[30, 60, 40, 80, 50, 90, 70, 100, 45, 75, 55, 85, 65, 40, 95].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-[#0866FF] rounded-full transition-all duration-150 animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-6 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors shadow-lg ${
              isMuted
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Toggle Video */}
          {isVideo && (
            <button
              type="button"
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors shadow-lg ${
                isVideoOff
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
              title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          {/* End Call */}
          <button
            type="button"
            onClick={endCall}
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform active:scale-95 shadow-xl"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
