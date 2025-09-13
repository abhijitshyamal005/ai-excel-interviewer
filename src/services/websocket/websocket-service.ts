// WebSocket Service - Real-time interview communication

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SessionManager } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { InterviewOrchestrator } from '@/services/interview/interview-orchestrator';
import { authenticateRequest } from '@/lib/auth';
import { ExcelLevel } from '@/lib/types';

export interface SocketData {
  sessionId?: string;
  candidateId?: string;
  isAuthenticated: boolean;
}

export class WebSocketService {
  private io: SocketIOServer;
  private interviewOrchestrator: InterviewOrchestrator;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.interviewOrchestrator = new InterviewOrchestrator();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Authentication middleware
      socket.use(async (packet, next) => {
        const [event] = packet;
        
        if (event === 'authenticate') {
          return next();
        }

        const socketData = socket.data as SocketData;
        if (!socketData.isAuthenticated) {
          return next(new Error('Not authenticated'));
        }

        next();
      });

      // Authentication
      socket.on('authenticate', async (data: { token: string; type: 'candidate' | 'admin' }) => {
        try {
          // Validate token based on type
          let isValid = false;
          let userId = '';

          if (data.type === 'candidate') {
            // Validate candidate token
            const payload = this.validateCandidateToken(data.token);
            if (payload) {
              isValid = true;
              userId = payload.candidateId;
            }
          } else if (data.type === 'admin') {
            // Validate admin token
            const payload = this.validateAdminToken(data.token);
            if (payload) {
              isValid = true;
              userId = payload.userId;
            }
          }

          if (isValid) {
            socket.data = {
              candidateId: data.type === 'candidate' ? userId : undefined,
              isAuthenticated: true
            } as SocketData;

            socket.emit('authenticated', { success: true });
            logger.info('Client authenticated', { 
              socketId: socket.id, 
              type: data.type,
              userId 
            });
          } else {
            socket.emit('authentication_error', { message: 'Invalid token' });
            socket.disconnect();
          }
        } catch (error) {
          logger.error('Authentication failed', { socketId: socket.id }, error as Error);
          socket.emit('authentication_error', { message: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Join interview session
      socket.on('join_interview', async (data: { sessionId: string }) => {
        try {
          const socketData = socket.data as SocketData;
          
          // Validate session access
          const session = await SessionManager.getSession(data.sessionId);
          if (!session) {
            socket.emit('error', { message: 'Invalid session' });
            return;
          }

          // Check if candidate owns this session
          if (socketData.candidateId && session.candidateId !== socketData.candidateId) {
            socket.emit('error', { message: 'Unauthorized access to session' });
            return;
          }

          socket.join(data.sessionId);
          socketData.sessionId = data.sessionId;

          socket.emit('joined_interview', { 
            sessionId: data.sessionId,
            status: session.status 
          });

          logger.info('Client joined interview', { 
            socketId: socket.id, 
            sessionId: data.sessionId 
          });

        } catch (error) {
          logger.error('Failed to join interview', { socketId: socket.id }, error as Error);
          socket.emit('error', { message: 'Failed to join interview' });
        }
      });

      // Start interview
      socket.on('start_interview', async (data: { candidateId: string; roleLevel: string }) => {
        try {
          const session = await this.interviewOrchestrator.startInterview(
            data.candidateId, 
            data.roleLevel as ExcelLevel
          );

          socket.join(session.id);
          (socket.data as SocketData).sessionId = session.id;

          socket.emit('interview_started', {
            sessionId: session.id,
            message: 'Welcome to your Excel skills assessment. I\'ll be conducting your interview today.'
          });

          // Send first question
          const firstStep = await this.interviewOrchestrator.getNextQuestion(session.id);
          socket.emit('question', firstStep);

          logger.info('Interview started via WebSocket', { 
            sessionId: session.id,
            candidateId: data.candidateId 
          });

        } catch (error) {
          logger.error('Failed to start interview', { socketId: socket.id }, error as Error);
          socket.emit('error', { message: 'Failed to start interview' });
        }
      });

      // Submit response
      socket.on('submit_response', async (data: { response: string }) => {
        try {
          const socketData = socket.data as SocketData;
          
          if (!socketData.sessionId) {
            socket.emit('error', { message: 'No active session' });
            return;
          }

          // Emit typing indicator
          socket.to(socketData.sessionId).emit('interviewer_typing');

          await this.interviewOrchestrator.submitResponse(
            socketData.sessionId,
            data.response
          );

          // Stop typing indicator
          socket.to(socketData.sessionId).emit('interviewer_stopped_typing');

          // Get next question or complete interview
          const nextQuestion = await this.interviewOrchestrator.getNextQuestion(socketData.sessionId);
          
          if (!nextQuestion) {
            const completedSession = await this.interviewOrchestrator.completeInterview(socketData.sessionId);
            socket.emit('interview_completed', { report: completedSession });
          } else {
            socket.emit('response_acknowledged', { 
              message: 'Thank you for your response.' 
            });
            
            socket.emit('question', nextQuestion);
          }

          logger.debug('Response processed via WebSocket', { 
            sessionId: socketData.sessionId,
            hasNextQuestion: !!nextQuestion
          });

        } catch (error) {
          logger.error('Failed to process response', { socketId: socket.id }, error as Error);
          socket.emit('error', { message: 'Failed to process response' });
        }
      });

      // Pause interview
      socket.on('pause_interview', async () => {
        try {
          const socketData = socket.data as SocketData;
          
          if (!socketData.sessionId) {
            socket.emit('error', { message: 'No active session' });
            return;
          }

          await this.interviewOrchestrator.pauseInterview(socketData.sessionId);
          socket.emit('interview_paused', { message: 'Interview paused. You can resume later.' });

          logger.info('Interview paused via WebSocket', { 
            sessionId: socketData.sessionId 
          });

        } catch (error) {
          logger.error('Failed to pause interview', { socketId: socket.id }, error as Error);
          socket.emit('error', { message: 'Failed to pause interview' });
        }
      });

      // Resume interview
      socket.on('resume_interview', async () => {
        try {
          const socketData = socket.data as SocketData;
          
          if (!socketData.sessionId) {
            socket.emit('error', { message: 'No active session' });
            return;
          }

          const result = await this.interviewOrchestrator.resumeInterview(socketData.sessionId);
          socket.emit('interview_resumed', result);

          logger.info('Interview resumed via WebSocket', { 
            sessionId: socketData.sessionId 
          });

        } catch (error) {
          logger.error('Failed to resume interview', { socketId: socket.id }, error as Error);
          socket.emit('error', { message: 'Failed to resume interview' });
        }
      });

      // Typing indicators
      socket.on('candidate_typing', () => {
        const socketData = socket.data as SocketData;
        if (socketData.sessionId) {
          socket.to(socketData.sessionId).emit('candidate_typing');
        }
      });

      socket.on('candidate_stopped_typing', () => {
        const socketData = socket.data as SocketData;
        if (socketData.sessionId) {
          socket.to(socketData.sessionId).emit('candidate_stopped_typing');
        }
      });

      // Heartbeat for connection monitoring
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Disconnection
      socket.on('disconnect', (reason) => {
        logger.info('Client disconnected', { 
          socketId: socket.id, 
          reason,
          sessionId: (socket.data as SocketData)?.sessionId 
        });

        // Auto-save session state if needed
        const socketData = socket.data as SocketData;
        if (socketData?.sessionId) {
          this.handleDisconnection(socketData.sessionId);
        }
      });

      // Error handling
      socket.on('error', (error) => {
        logger.error('Socket error', { socketId: socket.id }, error);
      });
    });

    logger.info('WebSocket service initialized');
  }

  private validateCandidateToken(_token: string): { candidateId: string } | null {
    // Implement candidate token validation
    // This would use the auth utilities
    try {
      // Placeholder implementation
      return { candidateId: 'candidate-id' };
    } catch {
      return null;
    }
  }

  private validateAdminToken(_token: string): { userId: string } | null {
    // Implement admin token validation
    try {
      // Placeholder implementation
      return { userId: 'admin-id' };
    } catch {
      return null;
    }
  }

  private async handleDisconnection(sessionId: string): Promise<void> {
    try {
      // Auto-save session state
      await SessionManager.extendSession(sessionId);
      logger.debug('Session state preserved on disconnect', { sessionId });
    } catch (error) {
      logger.error('Failed to preserve session state', { sessionId }, error as Error);
    }
  }

  // Admin methods for monitoring
  public getConnectedClients(): number {
    return this.io.sockets.sockets.size;
  }

  public getActiveInterviews(): string[] {
    const activeRooms: string[] = [];
    this.io.sockets.adapter.rooms.forEach((sockets, room) => {
      if (room.startsWith('interview-')) {
        activeRooms.push(room);
      }
    });
    return activeRooms;
  }

  // Broadcast system messages
  public broadcastSystemMessage(message: string): void {
    this.io.emit('system_message', { message, timestamp: new Date() });
    logger.info('System message broadcasted', { message });
  }
}