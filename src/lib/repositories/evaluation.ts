// Evaluation result repository implementation

import { EvaluationResult } from '@prisma/client';
import { BaseRepository, PaginatedRepository, PaginationOptions, PaginatedResult } from './base';
import {
  EvaluationResult as EvaluationResultType,
  PartialCredit
} from '@/lib/types';

export interface CreateEvaluationData {
  sessionId: string;
  questionId: string;
  candidateResponse: string;
  score: number;
  confidence: number;
  reasoning?: string;
  partialCredits?: PartialCredit[];
}

export interface UpdateEvaluationData {
  score?: number;
  confidence?: number;
  reasoning?: string;
  partialCredits?: PartialCredit[];
}

export interface EvaluationFilters {
  sessionId?: string;
  questionId?: string;
  minScore?: number;
  maxScore?: number;
  minConfidence?: number;
  maxConfidence?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export class EvaluationRepository extends PaginatedRepository<EvaluationResult> {
  async create(data: CreateEvaluationData): Promise<EvaluationResult> {
    return this.handleError('create evaluation result', async () => {
      this.validateRequired(data, ['sessionId', 'questionId', 'candidateResponse', 'score', 'confidence']);

      // Validate score and confidence ranges
      if (data.score < 0 || data.score > 100) {
        throw new Error('Score must be between 0 and 100');
      }

      if (data.confidence < 0 || data.confidence > 1) {
        throw new Error('Confidence must be between 0 and 1');
      }

      // Check if session and question exist
      const [session, question] = await Promise.all([
        this.db.interviewSession.findUnique({ where: { id: data.sessionId } }),
        this.db.excelQuestion.findUnique({ where: { id: data.questionId } })
      ]);

      if (!session) {
        throw new Error(`Interview session ${data.sessionId} not found`);
      }

      if (!question) {
        throw new Error(`Excel question ${data.questionId} not found`);
      }

      return await this.db.evaluationResult.create({
        data: {
          sessionId: data.sessionId,
          questionId: data.questionId,
          candidateResponse: data.candidateResponse,
          score: data.score,
          confidence: data.confidence,
          reasoning: data.reasoning || null,
          partialCredits: data.partialCredits || [] as any
        }
      });
    });
  }

  async findById(id: string): Promise<EvaluationResult | null> {
    return this.handleError('find evaluation result by id', async () => {
      this.validateId(id);
      return await this.db.evaluationResult.findUnique({
        where: { id },
        include: {
          session: true,
          question: true
        }
      });
    });
  }

  async findBySessionId(sessionId: string): Promise<EvaluationResult[]> {
    return this.handleError('find evaluation results by session', async () => {
      this.validateId(sessionId);
      return await this.db.evaluationResult.findMany({
        where: { sessionId },
        include: {
          question: true
        },
        orderBy: { createdAt: 'asc' }
      });
    });
  }

  async findByQuestionId(questionId: string): Promise<EvaluationResult[]> {
    return this.handleError('find evaluation results by question', async () => {
      this.validateId(questionId);
      return await this.db.evaluationResult.findMany({
        where: { questionId },
        include: {
          session: true
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  }

  async update(id: string, data: UpdateEvaluationData): Promise<EvaluationResult> {
    return this.handleError('update evaluation result', async () => {
      this.validateId(id);

      // Validate score and confidence if provided
      if (data.score !== undefined && (data.score < 0 || data.score > 100)) {
        throw new Error('Score must be between 0 and 100');
      }

      if (data.confidence !== undefined && (data.confidence < 0 || data.confidence > 1)) {
        throw new Error('Confidence must be between 0 and 1');
      }

      const updateData: any = {};
      if (data.score !== undefined) updateData.score = data.score;
      if (data.confidence !== undefined) updateData.confidence = data.confidence;
      if (data.reasoning !== undefined) updateData.reasoning = data.reasoning;
      if (data.partialCredits !== undefined) updateData.partialCredits = data.partialCredits as any;

      return await this.db.evaluationResult.update({
        where: { id },
        data: updateData,
        include: {
          session: true,
          question: true
        }
      });
    });
  }

  async delete(id: string): Promise<void> {
    return this.handleError('delete evaluation result', async () => {
      this.validateId(id);
      await this.db.evaluationResult.delete({
        where: { id }
      });
    });
  }

  async findWithFilters(
    filters: EvaluationFilters,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<EvaluationResult>> {
    return this.handleError('find evaluation results with filters', async () => {
      const where: any = {};

      if (filters.sessionId) where.sessionId = filters.sessionId;
      if (filters.questionId) where.questionId = filters.questionId;
      if (filters.minScore !== undefined) where.score = { ...where.score, gte: filters.minScore };
      if (filters.maxScore !== undefined) where.score = { ...where.score, lte: filters.maxScore };
      if (filters.minConfidence !== undefined) where.confidence = { ...where.confidence, gte: filters.minConfidence };
      if (filters.maxConfidence !== undefined) where.confidence = { ...where.confidence, lte: filters.maxConfidence };
      if (filters.createdAfter) where.createdAt = { ...where.createdAt, gte: filters.createdAfter };
      if (filters.createdBefore) where.createdAt = { ...where.createdAt, lte: filters.createdBefore };

      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 10));
      const skip = (page - 1) * limit;

      const orderBy: any = {};
      if (options.sortBy) {
        orderBy[options.sortBy] = options.sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      return await this.paginate(
        async () => await this.db.evaluationResult.findMany({
          where,
          include: {
            session: true,
            question: true
          },
          orderBy,
          skip,
          take: limit
        }),
        async () => await this.db.evaluationResult.count({ where }),
        options
      );
    });
  }

  async getAverageScoreByCategory(category: string): Promise<number> {
    return this.handleError('get average score by category', async () => {
      const result = await this.db.evaluationResult.aggregate({
        where: {
          question: {
            category
          }
        },
        _avg: {
          score: true
        }
      });

      return result._avg.score || 0;
    });
  }

  async getScoreDistribution(sessionId?: string): Promise<Record<string, number>> {
    return this.handleError('get score distribution', async () => {
      const where: any = {};
      if (sessionId) where.sessionId = sessionId;

      const results = await this.db.evaluationResult.findMany({
        where,
        select: { score: true }
      });

      const distribution: Record<string, number> = {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
      };

      results.forEach(result => {
        const score = result.score;
        if (score <= 20) distribution['0-20']++;
        else if (score <= 40) distribution['21-40']++;
        else if (score <= 60) distribution['41-60']++;
        else if (score <= 80) distribution['61-80']++;
        else distribution['81-100']++;
      });

      return distribution;
    });
  }

  async getConfidenceStats(sessionId?: string): Promise<{
    average: number;
    min: number;
    max: number;
    count: number;
  }> {
    return this.handleError('get confidence statistics', async () => {
      const where: any = {};
      if (sessionId) where.sessionId = sessionId;

      const result = await this.db.evaluationResult.aggregate({
        where,
        _avg: { confidence: true },
        _min: { confidence: true },
        _max: { confidence: true },
        _count: { confidence: true }
      });

      return {
        average: Number(result._avg.confidence) || 0,
        min: Number(result._min.confidence) || 0,
        max: Number(result._max.confidence) || 0,
        count: result._count.confidence || 0
      };
    });
  }
}
