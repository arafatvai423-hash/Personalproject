import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { VoiceRecorder } from './VoiceRecorder';
import { Paperclip, Smile, Send, X, Image as ImageIcon, File, Mic } from 'lucide-react';

const COMMON_EMOJIS = ['😀', '😂', '🔥', '❤️', '👍', '🎉', '🙌', '😍', '😎', '🙏', '💯', '✨', '🚀', '👏', '🤔', '👋'];

export const MessageInput: React.FC = () => {
  const {
    sendMessage,
    editMessage,
    replyingToMessage,
    editingMessage,
    setReplyingToMessage,
    setEditingMessage,
    setTyping,
  } = useChat();

  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    previewUrl: string;
    fileType: string;
  } | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<any>(null);

  // If entering edit mode, prefill textarea
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
      textareaRef.current?.focus();
    } else {
      setText('');
    }
  }, [editingMessage]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    // Notify typing
    setTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setSelectedFile({
      file,
      previewUrl,
      fileType: file.type || 'application/octet-stream',
    });
  };

  const clearFile = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.previewUrl);
      setSelectedFile(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!text.trim() && !selectedFile) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setTyping(false);

    // Handle Edit Message
    if (editingMessage) {
      await editMessage(editingMessage.id, text.trim());
      setText('');
      return;
    }

    // Handle File Attachment
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileUrl = reader.result as string;
        let messageType = 'file';
        if (selectedFile.fileType.startsWith('image/')) messageType = 'image';
        else if (selectedFile.fileType.startsWith('video/')) messageType = 'video';
        else if (selectedFile.fileType.startsWith('audio/')) messageType = 'audio';

        const attachment = {
          fileName: selectedFile.file.name,
          fileType: selectedFile.fileType,
          fileSize: selectedFile.file.size,
          fileUrl,
        };

        await sendMessage(text.trim(), messageType, [attachment]);
        clearFile();
        setText('');
      };
      reader.readAsDataURL(selectedFile.file);
      return;
    }

    // Regular Text Message
    const contentToSend = text.trim();
    setText('');
    await sendMessage(contentToSend, 'text');
  };

  const handleSendVoice = async (audioDataUrl: string, durationSeconds: number) => {
    setIsRecordingVoice(false);
    const attachment = {
      fileName: `voice_memo_${Date.now()}.webm`,
      fileType: 'audio/webm',
      fileSize: Math.round(audioDataUrl.length * 0.75),
      fileUrl: audioDataUrl,
      durationSeconds,
    };
    await sendMessage('', 'voice', [attachment]);
  };

  return (
    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      {/* Replying Banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-[#0866FF]">
              Replying to {replyingToMessage.sender?.displayName || 'User'}:
            </span>
            <span className="truncate max-w-md">{replyingToMessage.content}</span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingToMessage(null)}
            className="p-1 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editing Banner */}
      {editingMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold">Editing message</span>
            <span className="truncate max-w-md">{editingMessage.content}</span>
          </div>
          <button
            type="button"
            onClick={() => setEditingMessage(null)}
            className="p-1 hover:text-amber-950 dark:hover:text-amber-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected File Preview Chip */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-2 mb-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 w-fit max-w-md">
          {selectedFile.fileType.startsWith('image/') ? (
            <img
              src={selectedFile.previewUrl}
              alt="attachment"
              className="w-10 h-10 object-cover rounded-lg"
            />
          ) : (
            <div className="w-10 h-10 bg-[#0866FF]/10 text-[#0866FF] flex items-center justify-center rounded-lg">
              <File className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0 pr-2">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
              {selectedFile.file.name}
            </p>
            <p className="text-[10px] text-slate-500">
              {(selectedFile.file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="p-1 text-slate-400 hover:text-red-500 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Recording Mode or Standard Input */}
      {isRecordingVoice ? (
        <VoiceRecorder
          onSend={handleSendVoice}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        <div className="flex items-end gap-2">
          {/* File Picker Hidden Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-500 hover:text-[#0866FF] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"
            title="Attach file or photo"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Emoji Picker Popover */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 text-slate-500 hover:text-[#0866FF] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-40 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-64 grid grid-cols-8 gap-1">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                      textareaRef.current?.focus();
                    }}
                    className="p-1.5 text-lg hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Area Input */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2 border border-transparent focus-within:border-[#0866FF]/40 dark:focus-within:border-[#0866FF]/50 transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Aa"
              className="w-full bg-transparent resize-none outline-hidden text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm max-h-32 min-h-[22px] leading-relaxed"
            />
          </div>

          {/* Send or Voice Record Action */}
          {text.trim() || selectedFile || editingMessage ? (
            <button
              type="button"
              onClick={handleSend}
              className="p-2.5 bg-[#0866FF] text-white hover:bg-[#0756d6] rounded-full transition-transform active:scale-95 shadow-xs shrink-0"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="p-2.5 text-slate-500 hover:text-[#0866FF] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"
              title="Record voice message"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
