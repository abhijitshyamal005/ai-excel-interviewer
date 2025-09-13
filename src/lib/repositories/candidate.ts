// Candidate repository implementation

import { Candidate } from '@prisma/client';
import { BaseRepository, PaginatedRepository, PaginationOptions, PaginatedResult } from './base';
import { Candidate as CandidateType } from '@/lib/types';

export interface CreateCandidateData {
  email: string;
  name: string;
  targetRole?: string;
  experienceLevel?: string;
}

export interface UpdateCandidateData {
  name?: string;
  targetRole?: string;
  experienceLevel?: string;
}

export interface CandidateFilters {
  email?: string;
  targetRole?: string;
  experienceLevel?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export class CandidateRepository extends PaginatedRepository<Candidate> {
  async create(data: CreateCandidateData): Promise<Candidate> {
    return this.handleError('create candidate', async () => {
      this.validateRequired(data, ['email', 'name']);
      
      // Check if candidate already exists
      const existing = await this.findByEmail(data.email);
      if (existing) {
        throw new Error(`Candidate with email ${data.email} already exists`);
      }

      return await this.db.candidate.create({
        data: {
          email: data.email.toLowerCase().trim(),
          name: data.name.trim(),
          targetRole: data.targetRole?.trim(),
          experienceLevel: data.experienceLevel?.trim(),
        }
      });
    });
  }

  async findById(id: string): Promise<Candidate | null> {
    return this.handleError('find candidate by id', async () => {
      this.validateId(id);
      return await this.db.candidate.findUnique({
        where: { id },
        include: {
          interviewSessions: {
            orderBy: { createdAt: 'desc' },
            take: 5 // Latest 5 sessions
          }
        }
      });
    });
  }

  async findByEmail(email: string): Promise<Candidate | null> {
    return this.handleError('find candidate by email', async () => {
      if (!email) throw new Error('Email is required');
      
      return await this.db.candidate.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          interviewSessions: {
            orderBy: { createdAt: 'desc' },
            take: 1 // Latest session
          }
        }
      });
    });
  }

  async update(id: string, data: UpdateCandidateData): Promise<Candidate> {
    return this.handleError('update candidate', async () => {
      this.validateId(id);
      
      const updateData: Partial<CreateCandidateData> = {};
      if (data.name) updateData.name = data.name.trim();
      if (data.targetRole) updateData.targetRole = data.targetRole.trim();
      if (data.experienceLevel) updateData.experienceLevel = data.experienceLevel.trim();

      return await this.db.candidate.update({
        where: { id },
        data: updateData
      });
    });
  }

  async delete(id: string): Promise<void> {
    return this.handleError('delete candidate', async () => {
      this.validateId(id);
      await this.db.candidate.delete({
        where: { id }
      });
    });
  }

  async findMany(
    filters: CandidateFilters = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<Candidate>> {
    return this.handleError('find many candidates', async () => {
      const where: any = {};

      if (filters.email) {
        where.email = { contains: filters.email.toLowerCase(), mode: 'insensitive' };
      }
      if (filters.targetRole) {
        where.targetRole = { contains: filters.targetRole, mode: 'insensitive' };
      }
      if (filters.experienceLevel) {
        where.experienceLevel = filters.experienceLevel;
      }
      if (filters.createdAfter || filters.createdBefore) {
        where.createdAt = {};
        if (filters.createdAfter) where.createdAt.gte = filters.createdAfter;
        if (filters.createdBefore) where.createdAt.lte = filters.createdBefore;
      }

      const findManyQuery = () => this.db.candidate.findMany({
        where,
        include: {
          interviewSessions: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              skillAssessment: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: options.sortBy ? 
          { [options.sortBy]: options.sortOrder || 'desc' } : 
          { createdAt: 'desc' }
      });

      const countQuery = () => this.db.candidate.count({ where });

      return await this.paginate(findManyQuery, countQuery, options);
    });
  }

  async getInterviewHistory(candidateId: string): Promise<any[]> {
    return this.handleError('get interview history', async () => {
      this.validateId(candidateId);
      
      const candidate = await this.db.candidate.findUnique({
        where: { id: candidateId },
        include: {
          interviewSessions: {
            include: {
              evaluationResults: {
                select: {
                  score: true,
                  questionId: true,
                  createdAt: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return candidate?.interviewSessions || [];
    });
  }

  async getStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
    byExperience: Record<string, number>;
    recentSignups: number;
  }> {
    return this.handleError('get candidate stats', async () => {
      const [
        total,
        byRole,
        byExperience,
        recentSignups
      ] = await Promise.all([
        this.db.candidate.count(),
        this.db.candidate.groupBy({
          by: ['targetRole'],
          _count: { targetRole: true },
          where: { targetRole: { not: null } }
        }),
        this.db.candidate.groupBy({
          by: ['experienceLevel'],
          _count: { experienceLevel: true },
          where: { experienceLevel: { not: null } }
        }),
        this.db.candidate.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ]);

      return {
        total,
        byRole: byRole.reduce((acc, item) => {
          acc[item.targetRole || 'Unknown'] = item._count.targetRole;
          return acc;
        }, {} as Record<string, number>),
        byExperience: byExperience.reduce((acc, item) => {
          acc[item.experienceLevel || 'Unknown'] = item._count.experienceLevel;
          return acc;
        }, {} as Record<string, number>),
        recentSignups
      };
    });
  }
}