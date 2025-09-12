// Base repository pattern implementation

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export abstract class BaseRepository<T> {
    protected db: PrismaClient;

    constructor() {
        this.db = prisma;
    }

    protected async handleError<R>(operation: string, fn: () => Promise<R>): Promise<R> {
        try {
            return await fn();
        } catch (error) {
            logger.error(`Repository operation failed: ${operation}`, { error });
            throw error;
        }
    }

    protected validateId(id: string): void {
        if (!id || typeof id !== 'string') {
            throw new Error('Invalid ID provided');
        }
    }

    protected validateRequired(data: Record<string, any>, requiredFields: string[]): void {
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
    }
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export abstract class PaginatedRepository<T> extends BaseRepository<T> {
    protected async paginate<R>(
        findManyQuery: () => Promise<R[]>,
        countQuery: () => Promise<number>,
        options: PaginationOptions = {}
    ): Promise<PaginatedResult<R>> {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 10));

        const [data, total] = await Promise.all([
            findManyQuery(),
            countQuery()
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
}