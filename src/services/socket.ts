type EventHandler = (data: any) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private reconnectTimeout: any = null;
  private currentUserId: string | null = null;
  private isExplicitlyClosed = false;

  connect(userId: string) {
    this.currentUserId = userId;
    this.isExplicitlyClosed = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      // Already connecting or open; authenticate again if needed
      this.send('auth', { userId });
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.send('auth', { userId });
        this.emit('connection:status', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const { event: eventName, payload } = parsed;
          if (eventName) {
            this.emit(eventName, payload);
          }
        } catch (e) {
          console.error('Socket message parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.emit('connection:status', { connected: false });
        if (!this.isExplicitlyClosed && this.currentUserId) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => {
            this.connect(this.currentUserId!);
          }, 2500);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket encountered an issue, will auto-reconnect if closed:', err);
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentUserId = null;
  }

  send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  sendTyping(conversationId: string, userId: string, isTyping: boolean) {
    this.send('typing', { conversationId, userId, isTyping });
  }

  sendCallSignal(payload: any) {
    this.send('call:signal', payload);
  }

  on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(data);
        } catch (e) {
          console.error(`Error in socket event handler for ${event}:`, e);
        }
      });
    }
  }
}

export const socket = new SocketService();
