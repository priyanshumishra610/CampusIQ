import io, {Socket} from 'socket.io-client';

const SOCKET_URL = process.env.SOCKET_URL || process.env.API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(userId: string, role: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.socket?.emit('join-user-room', userId);
      this.socket?.emit('join-role-room', role);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    // Set up listeners for real-time events
    this.setupListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  private setupListeners() {
    if (!this.socket) return;

    // Attendance updates
    this.socket.on('attendance-updated', (data: any) => {
      this.emitToListeners('attendance-updated', data);
    });

    this.socket.on('attendance-bulk-updated', (data: any) => {
      this.emitToListeners('attendance-bulk-updated', data);
    });

    // SOS alerts
    this.socket.on('sos-alert', (data: any) => {
      this.emitToListeners('sos-alert', data);
    });

    // Geofence breaches
    this.socket.on('geofence-breach', (data: any) => {
      this.emitToListeners('geofence-breach', data);
    });

    // Notifications
    this.socket.on('notification', (data: any) => {
      this.emitToListeners('notification', data);
    });

    // Emergency alerts
    this.socket.on('emergency-alert', (data: any) => {
      this.emitToListeners('emergency-alert', data);
    });

    // Announcements
    this.socket.on('announcement-created', (data: any) => {
      this.emitToListeners('announcement-created', data);
    });
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emitToListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket listener for ${event}:`, error);
        }
      });
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketClient = new SocketClient();
export default socketClient;

