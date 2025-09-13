// Interview session repository implementation

import { InterviewSession } from '@prisma/client';
import { BaseRepository, PaginatedRepository, PaginationOptions, PaginatedResult } from './base';
import { 
  InterviewSession as InterviewSessionType, 
  ExcelLevel, 
  InterviewStatus,
  ConversationTurn,
  SkillScores 
} from '@/lib/types';

export interface CreateInterviewSessionData {
  candidateId: string;
  roleLevel: ExcelLevel;
  metadata?: Record<string, any>;
}

export interface UpdateInterviewSessionData {
  status?: InterviewStatus;
  currentQuestionIndex?: number;
  conversationHistory?: ConversationTurn[];
  skillAssessment?: SkillScores;
  endTime?: Date;
  metadata?: Record<string, any>;
}

export interface InterviewSessionFilters {
  candidateId?: string;
  status?: InterviewStatus;
  roleLevel?: ExcelLevel;
  startedAfter?: Date;
  startedBefore?: Date;
  completedAfter?: Date;
  completedBefore?: Date;
}

export class InterviewSessionRepository extends PaginatedRepository<InterviewSession> {
  async create(data: CreateInterviewSessionData): Promise<InterviewSession> {
    return this.handleError('create interview session', async () => {
      this.validateRequired(data, ['candidateId', 'roleLevel']);
      
      // Check if candidate exists
      const candidate = await this.db.candidate.findUnique({
        where: { id: data.candidateId }
      });
      
      if (!candidate) {
        throw new Error(`Candidate with ID ${data.candidateId} not found`);
      }

      // Check for active sessions
      const activeSession = await this.findActiveByCandidateId(data.candidateId);
      if (activeSession) {
        throw new Error(`Candidate already has an active interview session: ${activeSession.id}`);
      }

      return await this.db.interviewSession.create({
        data: {
          candidateId: data.candidateId,
          roleLevel: data.roleLevel,
          status: 'active',
          currentQuestionIndex: 0,
          conversationHistory: [],
          skillAssessment: {
            overall: 0,
            basicFormulas: 0,
            dataManipulation: 0,
            pivotTables: 0,
            advancedFunctions: 0,
            dataVisualization: 0,
            macrosVBA: 0,
            dataModeling: 0
          },
          metadata: data.metadata || {}
        },
        include: {
          candidate: true
        }
      });
    });
  }

  async findById(id: string): Promise<InterviewSession | null> {
    return this.handleError('find interview session by id', async () => {
      this.validateId(id);
      return await this.db.interviewSession.findUnique({
        where: { id },
        include: {
          candidate: true,
          evaluationResults: {
            include: {
              question: true
            },
            orderBy: { createdAt: 'asc' }
          },
          analytics: true
        }
      });
    });
  }

  async findActiveByCandidateId(candidateId: string): Promise<InterviewSession | null> {
    return this.handleError('find active session by candidate', async () => {
      this.validateId(candidateId);
      return await this.db.interviewSession.findFirst({
        where: {
          candidateId,
          status: 'active'
        },
        include: {
          candidate: true
        }
      });
    });
  }

  async update(id: string, data: UpdateInterviewSessionData): Promise<InterviewSession> {
    return this.handleError('update interview session', async () => {
      this.validateId(id);
      
      const updateData: any = {};
      
      if (data.status) updateData.status = data.status;
      if (data.currentQuestionIndex !== undefined) updateData.currentQuestionIndex = data.currentQuestionIndex;
      if (data.conversationHistory) updateData.conversationHistory = data.conversationHistory;
      if (data.skillAssessment) updateData.skillAssessment = data.skillAssessment;
      if (data.endTime) updateData.endTime = data.endTime;
      if (data.metadata) updateData.metadata = data.metadata;

      return await this.db.interviewSession.update({
        where: { id },
        data: updateData,
        include: {
          candidate: true,
          evaluationResults: true
        }
      });
    });
  }

  async addConversationTurn(sessionId: string, turn: ConversationTurn): Promise<InterviewSession> {
    return this.handleError('add conversation turn', async () => {
      this.validateId(sessionId);
      
      const session = await this.findById(sessionId);
      if (!session) {
        throw new Error(`Interview session ${sessionId} not found`);
      }

      const conversationHistory = Array.isArray(session.conversationHistory) 
        ? session.conversationHistory as unknown as ConversationTurn[]
        : [];
      
      conversationHistory.push(turn);

      return await this.update(sessionId, { conversationHistory });
    });
  }

  async updateSkillScores(sessionId: string, scores: Partial<SkillScores>): Promise<InterviewSession> {
    return this.handleError('update skill scores', async () => {
      this.validateId(sessionId);
      
      const session = await this.findById(sessionId);
      if (!session) {
        throw new Error(`Interview session ${sessionId} not found`);
      }

      const currentScores = (session.skillAssessment as unknown as SkillScores) || {
        overall: 0,
        basicFormulas: 0,
        dataManipulation: 0,
        pivotTables: 0,
        advancedFunctions: 0,
        dataVisualization: 0,
        macrosVBA: 0,
        dataModeling: 0
      };

      const updatedScores = { ...currentScores, ...scores };

      return await this.update(sessionId, { skillAssessment: updatedScores });
    });
  }

  async completeSession(sessionId: string, finalScores: SkillScores): Promise<InterviewSession> {
    return this.handleError('complete session', async () => {
      return await this.update(sessionId, {
        status: 'completed',
        endTime: new Date(),
        skillAssessment: finalScores
      });
    });
  }

  async pauseSession(sessionId: string): Promise<InterviewSession> {
    return this.handleError('pause session', async () => {
      return await this.update(sessionId, { status: 'paused' });
    });
  }

  async resumeSession(sessionId: string): Promise<InterviewSession> {
    return this.handleError('resume session', async () => {
      return await this.update(sessionId, { status: 'active' });
    });
  }

  async findMany(
    filters: InterviewSessionFilters = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<InterviewSession>> {
    return this.handleError('find many interview sessions', async () => {
      const where: any = {};

      if (filters.candidateId) where.candidateId = filters.candidateId;
      if (filters.status) where.status = filters.status;
      if (filters.roleLevel) where.roleLevel = filters.roleLevel;
      
      if (filters.startedAfter || filters.startedBefore) {
        where.startTime = {};
        if (filters.startedAfter) where.startTime.gte = filters.startedAfter;
        if (filters.startedBefore) where.startTime.lte = filters.startedBefore;
      }

      if (filters.completedAfter || filters.completedBefore) {
        where.endTime = {};
        if (filters.completedAfter) where.endTime.gte = filters.completedAfter;
        if (filters.completedBefore) where.endTime.lte = filters.completedBefore;
      }

      const findManyQuery = () => this.db.interviewSession.findMany({
        where,
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              targetRole: true
            }
          },
          evaluationResults: {
            select: {
              score: true,
              confidence: true
            }
          }
        },
        orderBy: options.sortBy ? 
          { [options.sortBy]: options.sortOrder || 'desc' } : 
          { startTime: 'desc' }
      });

      const countQuery = () => this.db.interviewSession.count({ where });

      return await this.paginate(findManyQuery, countQuery, options);
    });
  }

  async getSessionStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byRoleLevel: Record<string, number>;
    averageDuration: number;
    completionRate: number;
  }> {
    return this.handleError('get session stats', async () => {
      const [
        total,
        byStatus,
        byRoleLevel,
        completedSessions
      ] = await Promise.all([
        this.db.interviewSession.count(),
        this.db.interviewSession.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        this.db.interviewSession.groupBy({
          by: ['roleLevel'],
          _count: { roleLevel: true }
        }),
        this.db.interviewSession.findMany({
          where: { 
            status: 'completed',
            endTime: { not: null }
          },
          select: {
            startTime: true,
            endTime: true
          }
        })
      ]);

      const durations = completedSessions
        .filter(session => session.endTime)
        .map(session => 
          (session.endTime!.getTime() - session.startTime.getTime()) / 1000 / 60 // minutes
        );

      const averageDuration = durations.length > 0 
        ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
        : 0;

      const completionRate = total > 0 
        ? (completedSessions.length / total) * 100 
        : 0;

      return {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        byRoleLevel: byRoleLevel.reduce((acc, item) => {
          acc[item.roleLevel] = item._count.roleLevel;
          return acc;
        }, {} as Record<string, number>),
        averageDuration,
        completionRate
      };
    });
  }

  async getActiveSessionsCount(): Promise<number> {
    return this.handleError('get active sessions count', async () => {
      return await this.db.interviewSession.count({
        where: { status: 'active' }
      });
    });
  }

  async cleanupExpiredSessions(maxAgeHours: number = 24): Promise<number> {
    return this.handleError('cleanup expired sessions', async () => {
      const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      
      const result = await this.db.interviewSession.updateMany({
        where: {
          status: 'active',
          startTime: { lt: cutoffTime }
        },
        data: {
          status: 'completed',
          endTime: new Date()
        }
      });

      return result.count;
    });
  }
}