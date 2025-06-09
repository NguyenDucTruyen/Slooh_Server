// client/socket-example.ts
import { io, Socket } from 'socket.io-client';

interface PhienEvents {
  'phien:create': (data: { maPhong: string }, callback: (response: any) => void) => void;
  'phien:join': (
    data: { maPin: string; tenThanhVien?: string },
    callback: (response: any) => void
  ) => void;
  'phien:navigate': (data: { trangIndex: number }) => void;
  'phien:startQuestion': (data: { trangIndex: number }) => void;
  'phien:submitAnswer': (
    data: { maLuaChon: string; thoiGian: number },
    callback: (response: any) => void
  ) => void;
  'phien:showLeaderboard': () => void;
  'phien:end': (callback: (response: any) => void) => void;
  'phien:leave': (callback: (response: any) => void) => void;
}
interface BaseResponse {
  success: boolean;
  message?: string;
}

interface CreateSessionResponse extends BaseResponse {
  maPhien?: string;
  maPin?: string;
}

interface JoinSessionResponse extends BaseResponse {
  maThanhVienPhien?: string;
}

interface SubmitAnswerResponse extends BaseResponse {
  score?: number;
}
interface CreateSessionResponse {
  success: boolean;
  message?: string;
  maPhien?: string;
  maPin?: string;
}

interface PhienListeners {
  'phien:started': (data: { maPhien: string; maPin: string }) => void;
  'phien:memberJoined': (data: {
    maThanhVienPhien: string;
    tenThanhVien: string;
    anhDaiDien?: string;
  }) => void;
  'phien:memberLeft': (data: { maThanhVienPhien: string }) => void;
  'phien:navigated': (data: { trangIndex: number }) => void;
  'phien:questionStarted': (data: { trangIndex: number; startTime: number }) => void;
  'phien:answerSubmitted': (data: { maThanhVienPhien: string }) => void;
  'phien:leaderboard': (data: any[]) => void;
  'phien:ended': (data: { finalLeaderboard: any[] }) => void;
  error: (data: { message: string }) => void;
}

class PresentationClient {
  private socket: Socket;
  private accessToken?: string;

  constructor(serverUrl: string, accessToken?: string) {
    this.accessToken = accessToken;
    this.socket = io(serverUrl, {
      auth: {
        token: accessToken
      }
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  // Host functions
  async createSession(maPhong: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket.emit('phien:create', { maPhong }, (response: CreateSessionResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  navigateToPage(trangIndex: number) {
    this.socket.emit('phien:navigate', { trangIndex });
  }

  startQuestion(trangIndex: number) {
    this.socket.emit('phien:startQuestion', { trangIndex });
  }

  showLeaderboard() {
    this.socket.emit('phien:showLeaderboard');
  }

  async endSession(): Promise<BaseResponse> {
    return new Promise((resolve, reject) => {
      this.socket.emit('phien:end', (response: BaseResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  // Participant functions
  async joinSession(maPin: string, tenThanhVien?: string): Promise<JoinSessionResponse> {
    return new Promise((resolve, reject) => {
      this.socket.emit('phien:join', { maPin, tenThanhVien }, (response: JoinSessionResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  async submitAnswer(maLuaChon: string, thoiGian: number): Promise<SubmitAnswerResponse> {
    return new Promise((resolve, reject) => {
      this.socket.emit(
        'phien:submitAnswer',
        { maLuaChon, thoiGian },
        (response: SubmitAnswerResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.message));
          }
        }
      );
    });
  }

  async leaveSession(): Promise<BaseResponse> {
    return new Promise((resolve, reject) => {
      this.socket.emit('phien:leave', (response: BaseResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  // Event listeners
  onSessionStarted(callback: (data: { maPhien: string; maPin: string }) => void) {
    this.socket.on('phien:started', callback);
  }

  onMemberJoined(
    callback: (data: {
      maThanhVienPhien: string;
      tenThanhVien: string;
      anhDaiDien?: string;
    }) => void
  ) {
    this.socket.on('phien:memberJoined', callback);
  }

  onMemberLeft(callback: (data: { maThanhVienPhien: string }) => void) {
    this.socket.on('phien:memberLeft', callback);
  }

  onNavigated(callback: (data: { trangIndex: number }) => void) {
    this.socket.on('phien:navigated', callback);
  }

  onQuestionStarted(callback: (data: { trangIndex: number; startTime: number }) => void) {
    this.socket.on('phien:questionStarted', callback);
  }

  onAnswerSubmitted(callback: (data: { maThanhVienPhien: string }) => void) {
    this.socket.on('phien:answerSubmitted', callback);
  }

  onLeaderboard(callback: (data: any[]) => void) {
    this.socket.on('phien:leaderboard', callback);
  }

  onSessionEnded(callback: (data: { finalLeaderboard: any[] }) => void) {
    this.socket.on('phien:ended', callback);
  }

  onError(callback: (data: { message: string }) => void) {
    this.socket.on('error', callback);
  }

  // Cleanup
  disconnect() {
    this.socket.disconnect();
  }
}

// Usage example
/*
// For host (authenticated user)
const hostClient = new PresentationClient('http://localhost:3000', accessToken);

// Create session
const session = await hostClient.createSession('room-id-123');
console.log('Session created:', session);

// Listen for members joining
hostClient.onMemberJoined((data) => {
  console.log('Member joined:', data);
});

// Navigate to a page
hostClient.navigateToPage(0);

// Start a question
hostClient.startQuestion(1);

// For participant (can be anonymous)
const participantClient = new PresentationClient('http://localhost:3000');

// Join by PIN
const joinResult = await participantClient.joinSession('123456', 'John Doe');
console.log('Joined session:', joinResult);

// Listen for navigation
participantClient.onNavigated((data) => {
  console.log('Navigate to page:', data.trangIndex);
});

// Submit answer
const answerResult = await participantClient.submitAnswer('choice-id-123', 5);
console.log('Answer submitted:', answerResult);
*/

export default PresentationClient;
