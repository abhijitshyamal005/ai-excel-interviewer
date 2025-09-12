// Interview Orchestrator - Manages the complete interview lifecycle

import { InterviewSessionRepository } from '@/lib/repositories/interview';
import { CandidateRepository } from '@/lib/repositories/candidate';
import { AdaptiveQuestionEngine } from '@/services/questions/question-engine';
import { IntelligentEvaluationEngine } from '@/services/evaluation/evaluation-engine';
import { logger } from '@/lib/logger';
import { ExcelLevel, InterviewSession, InterviewStep } from '@/lib/types';

export class InterviewOrchestrator {
    private interviewRepo: InterviewSessionRepository;
    private candidateRepo: CandidateRepository;
    private questionEngine: AdaptiveQuestionEngine;
    private evaluationEngine: IntelligentEvaluationEngine;

    constructor() {
        this.interviewRepo = new InterviewSessionRepository();
        this.candidateRepo = new CandidateRepository();
        this.questionEngine = new AdaptiveQuestionEngine();
        this.evaluationEngine = new IntelligentEvaluationEngine();
        
        // Initialize services for future use
        logger.debug('InterviewOrchestrator initialized', {
            candidateRepo: !!this.candidateRepo,
            evaluationEngine: !!this.evaluationEngine
        });
    }

    async startInterview(candidateId: string, roleLevel: ExcelLevel): Promise<InterviewSession> {
        try {
            logger.info('Starting interview', { candidateId, roleLevel });

            // Create interview session
            const session = await this.interviewRepo.create({
                candidateId,
                roleLevel
            });

            logger.info('Interview session created', { sessionId: session.id });
            return session as any;

        } catch (error) {
            logger.error('Failed to start interview', { candidateId, roleLevel }, error as Error);
            throw error;
        }
    }

    async getNextQuestion(sessionId: string): Promise<InterviewStep | null> {
        try {
            const session = await this.interviewRepo.findById(sessionId);
            if (!session) {
                throw new Error(`Interview session ${sessionId} not found`);
            }

            // Get next question based on current progress
            const question = await this.questionEngine.getNextQuestion(session as any);

            if (!question) {
                return null; // Interview complete
            }

            return {
                question,
                nextAction: 'continue' as const,
                message: 'Next question ready'
            };

        } catch (error) {
            logger.error('Failed to get next question', { sessionId }, error as Error);
            throw error;
        }
    }

    async submitResponse(sessionId: string, response: string): Promise<void> {
        try {
            const session = await this.interviewRepo.findById(sessionId);
            if (!session) {
                throw new Error(`Interview session ${sessionId} not found`);
            }

            // Add conversation turn
            await this.interviewRepo.addConversationTurn(sessionId, {
                id: `turn-${Date.now()}`,
                type: 'response',
                content: response,
                timestamp: new Date(),
                metadata: { questionIndex: session.currentQuestionIndex }
            });

            // Update question index
            await this.interviewRepo.update(sessionId, {
                currentQuestionIndex: session.currentQuestionIndex + 1
            });

            logger.info('Response submitted', { sessionId, questionIndex: session.currentQuestionIndex });

        } catch (error) {
            logger.error('Failed to submit response', { sessionId }, error as Error);
            throw error;
        }
    }

    async completeInterview(sessionId: string): Promise<InterviewSession> {
        try {
            const session = await this.interviewRepo.findById(sessionId);
            if (!session) {
                throw new Error(`Interview session ${sessionId} not found`);
            }

            // Calculate final scores (placeholder implementation)
            const finalScores = {
                overall: 75,
                basicFormulas: 80,
                dataManipulation: 70,
                pivotTables: 75,
                advancedFunctions: 70,
                dataVisualization: 80,
                macrosVBA: 60,
                dataModeling: 65
            };

            const completedSession = await this.interviewRepo.completeSession(sessionId, finalScores);

            logger.info('Interview completed', { sessionId, overallScore: finalScores.overall });
            return completedSession as any;

        } catch (error) {
            logger.error('Failed to complete interview', { sessionId }, error as Error);
            throw error;
        }
    }

    async pauseInterview(sessionId: string): Promise<InterviewSession> {
        try {
            return await this.interviewRepo.pauseSession(sessionId) as any;
        } catch (error) {
            logger.error('Failed to pause interview', { sessionId }, error as Error);
            throw error;
        }
    }

    async resumeInterview(sessionId: string): Promise<InterviewSession> {
        try {
            return await this.interviewRepo.resumeSession(sessionId) as any;
        } catch (error) {
            logger.error('Failed to resume interview', { sessionId }, error as Error);
            throw error;
        }
    }
}