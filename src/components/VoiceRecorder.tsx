import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (audioDataUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Start recording on mount
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startRecording = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setRecordedBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);

          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
        };

        mediaRecorder.start(100);
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Microphone access denied:', err);
        onCancel();
      }
    };

    startRecording();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onCancel]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (!recordedBlob) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      onSend(base64data, duration || 1);
    };
    reader.readAsDataURL(recordedBlob);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current && audioUrl) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors"
        title="Discard recording"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Recording indicator & timer */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {isRecording ? (
          <>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 font-mono tracking-wider">
              REC {formatDuration(duration)}
            </span>
            {/* Visualizer bars */}
            <div className="flex items-center gap-1 ml-3 h-5 flex-1 max-w-xs">
              {[40, 70, 30, 90, 50, 80, 60, 100, 45, 85, 35, 75, 95, 55, 65].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#0866FF] rounded-full transition-all duration-150"
                  style={{
                    height: `${Math.max(15, (h * Math.sin(Date.now() / 200 + i)) % 100)}%`,
                    opacity: 0.7 + (i % 3) * 0.1,
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <button
              type="button"
              onClick={togglePlayback}
              className="p-1.5 bg-[#0866FF] text-white rounded-full hover:bg-[#0756d6] transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
              Voice Note ({formatDuration(duration)})
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Square className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          <span>Stop</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSend}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#0866FF] hover:bg-[#0756d6] rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      )}
    </div>
  );
};
