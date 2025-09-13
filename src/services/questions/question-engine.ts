// Question Engine Service - Adaptive question selection and management

import { QuestionEngine, Question, InterviewSession, SkillCoverage, ExcelLevel, ExcelSkillCategory } from '@/lib/types';
import { QuestionRepository } from '@/lib/repositories/question';
import { excelQuestions, getQuestionsByCategory, roleQuestionWeights, skillProgression } from '@/data/excel-questions';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export class AdaptiveQuestionEngine implements QuestionEngine {
  private questionRepo: QuestionRepository;

  constructor() {
    this.questionRepo = new QuestionRepository();
  }

  async getNextQuestion(session: InterviewSession): Promise<Question> {
    logger.debug('Selecting next question', { 
      sessionId: session.id, 
      currentIndex: session.currentQuestionIndex 
    });

    // Analyze current skill coverage
    const coverage = this.validateQuestionCoverage(session);
    
    // Determine next question category based on coverage and performance
    const nextCategory = this.selectNextCategory(session, coverage);
    
    // Determine difficulty based on recent performance
    const difficulty = this.adaptDifficulty(session, nextCategory);
    
    // Get available questions for this category and difficulty
    const availableQuestions = await this.getAvailableQuestions(
      session, 
      nextCategory, 
      difficulty
    );

    if (availableQuestions.length === 0) {
      // Fallback to any available question
      const fallbackQuestions = await this.getFallbackQuestions(session);
      if (fallbackQuestions.length === 0) {
        throw new Error('No more questions available');
      }
      return this.selectQuestion(fallbackQuestions);
    }

    const selectedQuestion = this.selectQuestion(availableQuestions);
    
    logger.info('Question selected', {
      sessionId: session.id,
      questionId: selectedQuestion.id,
      category: selectedQuestion.category,
      difficulty: selectedQuestion.difficulty
    });

    return selectedQuestion;
  }

  async generateFollowUp(
    previousQ: Question, 
    response: string, 
    score: number
  ): Promise<Question> {
    logger.debug('Generating follow-up question', {
      previousQuestionId: previousQ.id,
      score
    });

    // Check if previous question has follow-up triggers
    for (const trigger of previousQ.followUpTriggers) {
      if (this.evaluateTrigger(trigger.trigger, score, response)) {
        // Generate follow-up based on template
        const followUpQuestion: Question = {
          id: uuidv4(),
          category: previousQ.category,
          difficulty: previousQ.difficulty,
          text: this.processQuestionTemplate(trigger.questionTemplate, response),
          expectedAnswerPatterns: [], // Will be populated by AI
          evaluationCriteria: previousQ.evaluationCriteria,
          followUpTriggers: []
        };

        logger.info('Follow-up question generated', {
          originalQuestionId: previousQ.id,
          followUpQuestionId: followUpQuestion.id
        });

        return followUpQuestion;
      }
    }

    // No follow-up needed
    throw new Error('No follow-up question needed');
  }

  validateQuestionCoverage(session: InterviewSession): SkillCoverage {
    const askedQuestions = this.getAskedQuestions(session);
    const roleWeights = roleQuestionWeights[session.roleLevel];
    
    const categoryCoverage: Record<string, number> = {};
    let totalWeight = 0;
    let coveredWeight = 0;

    // Calculate coverage for each category
    Object.entries(roleWeights).forEach(([category, weight]) => {
      const categoryQuestions = askedQuestions.filter(q => q.category === category);
      const expectedQuestions = this.getExpectedQuestionsForCategory(category as any, session.roleLevel);
      
      const coverage = expectedQuestions > 0 ? categoryQuestions.length / expectedQuestions : 0;
      categoryCoverage[category] = Math.min(coverage, 1.0);
      
      totalWeight += weight;
      coveredWeight += coverage * weight;
    });

    const overallCoverage = totalWeight > 0 ? coveredWeight / totalWeight : 0;
    
    // Identify missing areas
    const missingAreas = Object.entries(categoryCoverage)
      .filter(([_, coverage]) => coverage < 0.5)
      .map(([category, _]) => category as any);

    return {
      categories: categoryCoverage as any,
      overallCoverage,
      missingAreas
    };
  }

  private selectNextCategory(session: InterviewSession, coverage: SkillCoverage): string {
    const roleWeights = roleQuestionWeights[session.roleLevel];
    
    // Prioritize categories with low coverage and high importance
    const categoryScores = Object.entries(roleWeights).map(([category, weight]) => {
      const currentCoverage = (coverage.categories as any)[category] || 0;
      const priority = weight * (1 - currentCoverage);
      return { category, priority };
    });

    // Sort by priority and select highest
    categoryScores.sort((a, b) => b.priority - a.priority);
    
    return categoryScores[0].category;
  }

  private adaptDifficulty(session: InterviewSession, category: string): string {
    const recentQuestions = this.getRecentQuestions(session, 3);
    const categoryQuestions = recentQuestions.filter(q => q.category === category);
    
    if (categoryQuestions.length === 0) {
      // Start with basic for new categories
      return 'basic';
    }

    // Calculate average performance in this category
    const scores = this.getQuestionScores(session, categoryQuestions);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;

    // Adapt difficulty based on performance
    if (avgScore >= 80) {
      return 'advanced';
    } else if (avgScore >= 60) {
      return 'intermediate';
    } else {
      return 'basic';
    }
  }

  private async getAvailableQuestions(
    session: InterviewSession, 
    category: string, 
    difficulty: string
  ): Promise<Question[]> {
    const askedQuestionIds = this.getAskedQuestions(session).map(q => q.id);
    
    // Get questions from database first
    const dbQuestions = await this.questionRepo.findByCategory(category as any);
    const availableDbQuestions = dbQuestions
      .filter(q => q.difficulty === difficulty)
      .filter(q => !askedQuestionIds.includes(q.id))
      .map(q => this.convertDbQuestionToQuestion(q));

    // If we have database questions, use them
    if (availableDbQuestions.length > 0) {
      return availableDbQuestions;
    }

    // Fallback to static questions
    const staticQuestions = excelQuestions
      .filter(q => q.category === category && q.difficulty === difficulty)
      .map(q => this.mapExcelQuestionToQuestion(q));

    return staticQuestions.filter(q => !askedQuestionIds.includes(q.id));
  }

  private async getFallbackQuestions(session: InterviewSession): Promise<Question[]> {
    const askedQuestionIds = this.getAskedQuestions(session).map(q => q.id);
    
    // Get any available questions
    const allQuestions = excelQuestions.map(q => this.mapExcelQuestionToQuestion(q));
    return allQuestions.filter(q => !askedQuestionIds.includes(q.id));
  }

  private selectQuestion(questions: Question[]): Question {
    if (questions.length === 0) {
      throw new Error('No questions available for selection');
    }

    // For now, select randomly. Could be enhanced with ML-based selection
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  private evaluateTrigger(trigger: string, score: number, response: string): boolean {
    // Simple trigger evaluation - can be enhanced
    if (trigger.includes('score <')) {
      const threshold = parseInt(trigger.match(/\d+/)?.[0] || '0');
      return score < threshold;
    }
    
    if (trigger.includes('score >')) {
      const threshold = parseInt(trigger.match(/\d+/)?.[0] || '100');
      return score > threshold;
    }

    return false;
  }

  private processQuestionTemplate(template: string, response: string): string {
    // Simple template processing - can be enhanced with AI
    return template.replace(/\{response\}/g, response);
  }

  private getAskedQuestions(session: InterviewSession): Question[] {
    // Extract questions from conversation history
    return session.conversationHistory
      .filter(turn => turn.type === 'question')
      .map(turn => turn.metadata?.question)
      .filter(Boolean) as Question[];
  }

  private getRecentQuestions(session: InterviewSession, count: number): Question[] {
    const askedQuestions = this.getAskedQuestions(session);
    return askedQuestions.slice(-count);
  }

  private getQuestionScores(session: InterviewSession, questions: Question[]): number[] {
    // Extract scores from conversation history or evaluation results
    // This would typically come from the evaluation results
    return questions.map(() => Math.random() * 100); // Placeholder
  }

  private getExpectedQuestionsForCategory(category: ExcelSkillCategory, roleLevel: ExcelLevel): number {
    const weights = roleQuestionWeights[roleLevel];
    const weight = weights[category] || 0;
    const totalQuestions = 15; // Max questions per interview
    return Math.ceil(totalQuestions * weight);
  }

  private convertDbQuestionToQuestion(dbQuestion: any): Question {
    return {
      id: dbQuestion.id,
      category: dbQuestion.category,
      difficulty: dbQuestion.difficulty,
      text: dbQuestion.text,
      expectedAnswerPatterns: dbQuestion.expectedAnswers.map((a: any) => a.pattern),
      evaluationCriteria: dbQuestion.evaluationRubric,
      followUpTriggers: []
    };
  }

  private mapExcelQuestionToQuestion(excelQuestion: any): Question {
    return {
      id: uuidv4(),
      category: excelQuestion.category,
      difficulty: excelQuestion.difficulty,
      text: excelQuestion.text,
      expectedAnswerPatterns: excelQuestion.expectedAnswers.map((a: any) => a.pattern),
      evaluationCriteria: excelQuestion.evaluationRubric,
      followUpTriggers: []
    };
  }
}