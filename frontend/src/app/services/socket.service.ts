import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type SocketConnectionState = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  connectionState = signal<SocketConnectionState>('connecting');

  constructor() {
    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      this.connectionState.set('connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionState.set('disconnected');
    });

    this.socket.on('connect_error', () => {
      this.connectionState.set('disconnected');
    });

    this.socket.io.on('reconnect_attempt', () => {
      this.connectionState.set('reconnecting');
    });

    this.socket.io.on('reconnect', () => {
      this.connectionState.set('connected');
    });
  }

  isConnected(): boolean {
    return this.connectionState() === 'connected';
  }

  joinRole(role: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_role_room', role);
    }
  }

  onEvent<T>(eventName: string): Observable<T> {
    return new Observable<T>((observer) => {
      this.socket.on(eventName, (data: T) => {
        observer.next(data);
      });
      return () => {
        this.socket.off(eventName);
      };
    });
  }
}
