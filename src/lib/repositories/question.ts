// Excel question repository implementation

import { ExcelQuestion } from '@prisma/client';
import { BaseRepository, PaginatedRepository, PaginationOptions, PaginatedResult } from './base';
import {
  ExcelQuestion as ExcelQuestionType,
  ExcelSkillCategory,
  DifficultyLevel,
  ExpectedAnswer,
  EvaluationRubric
} from '@/lib/types';

export interface CreateQuestionData {
  category: ExcelSkillCategory;
  difficulty: DifficultyLevel;
  text: string;
  expectedAnswers: ExpectedAnswer[];
  evaluationRubric: EvaluationRubric;
  tags?: string[];
}

export interface UpdateQuestionData {
  category?: ExcelSkillCategory;
  difficulty?: DifficultyLevel;
  text?: string;
  expectedAnswers?: ExpectedAnswer[];
  evaluationRubric?: EvaluationRubric;
  tags?: string[];
}

export interface QuestionFilters {
  category?: ExcelSkillCategory;
  difficulty?: DifficultyLevel;
  tags?: string[];
  searchText?: string;
  minUsageCount?: number;
  maxUsageCount?: number;
  minAverageScore?: number;
  maxAverageScore?: number;
}

export class QuestionRepository extends PaginatedRepository<ExcelQuestion> {
  async create(data: CreateQuestionData): Promise<ExcelQuestion> {
    return this.handleError('create question', async () => {
      this.validateRequired(data, ['category', 'difficulty', 'text', 'expectedAnswers', 'evaluationRubric']);

      return await this.db.excelQuestion.create({
        data: {
          category: data.category,
          difficulty: data.difficulty,
          text: data.text.trim(),
          expectedAnswers: data.expectedAnswers as any,
          evaluationRubric: data.evaluationRubric as any,
          tags: data.tags || [],
          usageCount: 0,
          averageScore: null
        }
      });
    });
  }

  async findById(id: string): Promise<ExcelQuestion | null> {
    return this.handleError('find question by id', async () => {
      this.validateId(id);
      return await this.db.excelQuestion.findUnique({
        where: { id },
        include: {
          evaluationResults: {
            select: {
              score: true,
              confidence: true,
              createdAt: true,
              session: {
                select: {
                  candidate: {
                    select: {
                      experienceLevel: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10 // Recent evaluations
          }
        }
      });
    });
  }

  async update(id: string, data: UpdateQuestionData): Promise<ExcelQuestion> {
    return this.handleError('update question', async () => {
      this.validateId(id);

      const updateData: any = {};

      if (data.category) updateData.category = data.category;
      if (data.difficulty) updateData.difficulty = data.difficulty;
      if (data.text) updateData.text = data.text.trim();
      if (data.expectedAnswers) updateData.expectedAnswers = data.expectedAnswers as any;
      if (data.evaluationRubric) updateData.evaluationRubric = data.evaluationRubric as any;
      if (data.tags) updateData.tags = data.tags;

      return await this.db.excelQuestion.update({
        where: { id },
        data: updateData
      });
    });
  }

  async delete(id: string): Promise<void> {
    return this.handleError('delete question', async () => {
      this.validateId(id);

      // Check if question has been used in evaluations
      const evaluationCount = await this.db.evaluationResult.count({
        where: { questionId: id }
      });

      if (evaluationCount > 0) {
        throw new Error(`Cannot delete question that has been used in ${evaluationCount} evaluations`);
      }

      await this.db.excelQuestion.delete({
        where: { id }
      });
    });
  }

  async findMany(
    filters: QuestionFilters = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ExcelQuestion>> {
    return this.handleError('find many questions', async () => {
      const where: any = {};

      if (filters.category) where.category = filters.category;
      if (filters.difficulty) where.difficulty = filters.difficulty;

      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }

      if (filters.searchText) {
        where.text = { contains: filters.searchText, mode: 'insensitive' };
      }

      if (filters.minUsageCount !== undefined || filters.maxUsageCount !== undefined) {
        where.usageCount = {};
        if (filters.minUsageCount !== undefined) where.usageCount.gte = filters.minUsageCount;
        if (filters.maxUsageCount !== undefined) where.usageCount.lte = filters.maxUsageCount;
      }

      if (filters.minAverageScore !== undefined || filters.maxAverageScore !== undefined) {
        where.averageScore = {};
        if (filters.minAverageScore !== undefined) where.averageScore.gte = filters.minAverageScore;
        if (filters.maxAverageScore !== undefined) where.averageScore.lte = filters.maxAverageScore;
      }

      const findManyQuery = () => this.db.excelQuestion.findMany({
        where,
        include: {
          evaluationResults: {
            select: {
              score: true,
              confidence: true
            },
            take: 5 // Recent evaluations for preview
          }
        },
        orderBy: options.sortBy ?
          { [options.sortBy]: options.sortOrder || 'desc' } :
          { createdAt: 'desc' }
      });

      const countQuery = () => this.db.excelQuestion.count({ where });

      return await this.paginate(findManyQuery, countQuery, options);
    });
  }

  async findByCategory(
    category: ExcelSkillCategory,
    difficulty?: DifficultyLevel,
    limit: number = 10
  ): Promise<ExcelQuestion[]> {
    return this.handleError('find questions by category', async () => {
      const where: any = { category };
      if (difficulty) where.difficulty = difficulty;

      return await this.db.excelQuestion.findMany({
        where,
        take: limit,
        orderBy: [
          { usageCount: 'asc' }, // Prefer less used questions
          { createdAt: 'desc' }
        ]
      });
    });
  }

  async findRandomByDifficulty(
    difficulty: DifficultyLevel,
    excludeIds: string[] = [],
    limit: number = 5
  ): Promise<ExcelQuestion[]> {
    return this.handleError('find random questions by difficulty', async () => {
      const where: any = { difficulty };
      if (excludeIds.length > 0) {
        where.id = { notIn: excludeIds };
      }

      // Get total count first
      const totalCount = await this.db.excelQuestion.count({ where });
      if (totalCount === 0) return [];

      // Generate random offsets
      const randomOffsets = Array.from({ length: Math.min(limit, totalCount) }, () =>
        Math.floor(Math.random() * totalCount)
      );

      const questions = await Promise.all(
        randomOffsets.map(offset =>
          this.db.excelQuestion.findMany({
            where,
            skip: offset,
            take: 1
          })
        )
      );

      return questions.flat().slice(0, limit);
    });
  }

  async incrementUsageCount(id: string): Promise<void> {
    return this.handleError('increment usage count', async () => {
      this.validateId(id);
      await this.db.excelQuestion.update({
        where: { id },
        data: {
          usageCount: { increment: 1 }
        }
      });
    });
  }

  async updateAverageScore(id: string): Promise<void> {
    return this.handleError('update average score', async () => {
      this.validateId(id);

      const result = await this.db.evaluationResult.aggregate({
        where: { questionId: id },
        _avg: { score: true },
        _count: { score: true }
      });

      if (result._count.score > 0 && result._avg.score !== null) {
        await this.db.excelQuestion.update({
          where: { id },
          data: {
            averageScore: result._avg.score
          }
        });
      }
    });
  }

  async getQuestionStats(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
    mostUsed: any[];
    leastUsed: any[];
    averageUsage: number;
  }> {
    return this.handleError('get question stats', async () => {
      const [
        total,
        byCategory,
        byDifficulty,
        mostUsed,
        leastUsed,
        usageStats
      ] = await Promise.all([
        this.db.excelQuestion.count(),
        this.db.excelQuestion.groupBy({
          by: ['category'],
          _count: { category: true }
        }),
        this.db.excelQuestion.groupBy({
          by: ['difficulty'],
          _count: { difficulty: true }
        }),
        this.db.excelQuestion.findMany({
          orderBy: { usageCount: 'desc' },
          take: 5,
          select: {
            id: true,
            text: true,
            category: true,
            difficulty: true,
            usageCount: true
          }
        }),
        this.db.excelQuestion.findMany({
          orderBy: { usageCount: 'asc' },
          take: 5,
          select: {
            id: true,
            text: true,
            category: true,
            difficulty: true,
            usageCount: true
          }
        }),
        this.db.excelQuestion.aggregate({
          _avg: { usageCount: true }
        })
      ]);

      return {
        total,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = item._count.category;
          return acc;
        }, {} as Record<string, number>),
        byDifficulty: byDifficulty.reduce((acc, item) => {
          acc[item.difficulty] = item._count.difficulty;
          return acc;
        }, {} as Record<string, number>),
        mostUsed,
        leastUsed,
        averageUsage: usageStats._avg.usageCount || 0
      };
    });
  }

  async findSimilarQuestions(questionId: string, limit: number = 5): Promise<ExcelQuestion[]> {
    return this.handleError('find similar questions', async () => {
      const question = await this.findById(questionId);
      if (!question) return [];

      return await this.db.excelQuestion.findMany({
        where: {
          id: { not: questionId },
          category: question.category,
          difficulty: question.difficulty
        },
        take: limit,
        orderBy: { usageCount: 'asc' }
      });
    });
  }

  async bulkCreate(questions: CreateQuestionData[]): Promise<ExcelQuestion[]> {
    return this.handleError('bulk create questions', async () => {
      const results = await Promise.all(
        questions.map(questionData => this.create(questionData))
      );
      return results;
    });
  }

  async getUnusedQuestions(category?: ExcelSkillCategory): Promise<ExcelQuestion[]> {
    return this.handleError('get unused questions', async () => {
      const where: any = { usageCount: 0 };
      if (category) where.category = category;

      return await this.db.excelQuestion.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
    });
  }
}