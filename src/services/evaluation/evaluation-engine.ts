// Evaluation Engine - Intelligent response assessment

import { 
  EvaluationEngine, 
  Question, 
  EvaluationResult, 
  InterviewContext, 
  SkillScores, 
  DetailedFeedback,
  ExcelSkillCategory 
} from '@/lib/types';
import { OpenAIClient } from '@/services/ai/openai-client';
import { logger, PerformanceMonitor } from '@/lib/logger';

export class IntelligentEvaluationEngine implements EvaluationEngine {
  private aiClient: OpenAIClient;

  constructor() {
    this.aiClient = new OpenAIClient();
  }

  async evaluateResponse(
    question: Question,
    response: string,
    context: InterviewContext
  ): Promise<EvaluationResult> {
    logger.debug('Starting response evaluation', {
      questionId: question.id,
      sessionId: context.sessionId
    });

    return await PerformanceMonitor.measure(
      `evaluation-${question.id}`,
      async () => {
        // First, try rule-based evaluation for quick wins
        const ruleBasedResult = await this.tryRuleBasedEvaluation(question, response);
        
        if (ruleBasedResult && ruleBasedResult.confidence > 0.8) {
          logger.info('Rule-based evaluation successful', {
            questionId: question.id,
            score: ruleBasedResult.score
          });
          return ruleBasedResult;
        }

        // Fall back to AI evaluation for complex responses
        const aiResult = await this.aiClient.evaluateExcelResponse(question, response, context);
        
        // Combine rule-based insights with AI evaluation if available
        if (ruleBasedResult) {
          aiResult.confidence = Math.max(aiResult.confidence, ruleBasedResult.confidence);
          aiResult.partialCredits = [
            ...aiResult.partialCredits,
            ...ruleBasedResult.partialCredits
          ];
        }

        return aiResult;
      }
    );
  }

  calculateSkillScores(evaluations: EvaluationResult[]): SkillScores {
    logger.debug('Calculating skill scores', { evaluationCount: evaluations.length });

    const categoryScores: Record<string, number[]> = {};
    
    // Group evaluations by category
    evaluations.forEach(evaluation => {
      // We need to get the question to know its category
      // For now, we'll extract from questionId or use a lookup
      const category = this.extractCategoryFromEvaluation(evaluation);
      if (!categoryScores[category]) {
        categoryScores[category] = [];
      }
      categoryScores[category].push(evaluation.score);
    });

    // Calculate average scores for each category
    const skillScores: SkillScores = {
      overall: 0,
      basicFormulas: this.calculateCategoryAverage(categoryScores[ExcelSkillCategory.BASIC_FORMULAS]),
      dataManipulation: this.calculateCategoryAverage(categoryScores[ExcelSkillCategory.DATA_MANIPULATION]),
      pivotTables: this.calculateCategoryAverage(categoryScores[ExcelSkillCategory.PIVOT_TABLES]),
      advancedFunctions: this.calculateCategoryAverage(categoryScores[ExcelSkillCategory.ADVANCED_FUNCTIONS]),
      dataVisualization: this.calculateCategoryAverage(categoryScores[ExcelSkillCategory.DATA_VISUALIZATION]),
      macrosVBA: this.calculateCategoryAverage(categoryScores[ExcelSkillCategory.MACROS_VBA]),
      dataModeling: this.calculateCategoryAverage(categoryScores[ExcelSkillCategory.DATA_MODELING])
    };

    // Calculate overall score as weighted average
    const weights = {
      basicFormulas: 0.2,
      dataManipulation: 0.25,
      pivotTables: 0.2,
      advancedFunctions: 0.15,
      dataVisualization: 0.1,
      macrosVBA: 0.05,
      dataModeling: 0.05
    };

    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(weights).forEach(([skill, weight]) => {
      const score = skillScores[skill as keyof SkillScores];
      if (score > 0) {
        weightedSum += score * weight;
        totalWeight += weight;
      }
    });

    skillScores.overall = totalWeight > 0 ? weightedSum / totalWeight : 0;

    logger.info('Skill scores calculated', { 
      overall: skillScores.overall,
      evaluationCount: evaluations.length 
    });

    return skillScores;
  }

  generateFeedback(evaluation: EvaluationResult): DetailedFeedback {
    logger.debug('Generating detailed feedback', { questionId: evaluation.questionId });

    const strengths: string[] = [];
    const improvements: string[] = [];

    // Analyze partial credits for strengths and improvements
    evaluation.partialCredits.forEach(credit => {
      if (credit.points > 0) {
        strengths.push(credit.reasoning);
      } else {
        improvements.push(credit.reasoning);
      }
    });

    // Generate performance-based feedback
    if (evaluation.score >= 90) {
      strengths.push("Excellent understanding of Excel concepts and syntax");
    } else if (evaluation.score >= 70) {
      strengths.push("Good grasp of Excel fundamentals");
      improvements.push("Focus on syntax precision and advanced features");
    } else if (evaluation.score >= 50) {
      improvements.push("Review basic Excel formulas and functions");
      improvements.push("Practice with real-world Excel scenarios");
    } else {
      improvements.push("Strengthen foundational Excel knowledge");
      improvements.push("Consider taking an Excel basics course");
    }

    return {
      questionId: evaluation.questionId,
      response: '', // Would be filled from context
      score: evaluation.score,
      strengths,
      improvements,
      specificFeedback: evaluation.reasoning
    };
  }

  private async tryRuleBasedEvaluation(
    question: Question,
    response: string
  ): Promise<EvaluationResult | null> {
    const normalizedResponse = response.toLowerCase().trim();
    
    // Check for exact matches with expected patterns
    for (const pattern of question.expectedAnswerPatterns) {
      const normalizedPattern = pattern.toLowerCase();
      
      if (normalizedResponse.includes(normalizedPattern)) {
        return {
          questionId: question.id,
          score: 95,
          confidence: 0.9,
          reasoning: `Response matches expected pattern: ${pattern}`,
          partialCredits: [
            {
              criterion: 'Exact Match',
              points: 95,
              reasoning: 'Response contains the expected formula or concept'
            }
          ]
        };
      }
    }

    // Check for common mistakes
    const mistakes = question.evaluationCriteria.commonMistakes;
    let deductions = 0;
    const partialCredits = [];

    for (const mistake of mistakes) {
      if (normalizedResponse.includes(mistake.pattern.toLowerCase())) {
        deductions += mistake.deduction;
        partialCredits.push({
          criterion: 'Common Mistake',
          points: -mistake.deduction,
          reasoning: mistake.feedback
        });
      }
    }

    // Check for partial credit rules
    for (const rule of question.evaluationCriteria.partialCreditRules) {
      if (normalizedResponse.includes(rule.condition.toLowerCase())) {
        const points = (question.evaluationCriteria.maxScore * rule.creditPercentage) / 100;
        partialCredits.push({
          criterion: 'Partial Credit',
          points,
          reasoning: rule.feedback
        });
      }
    }

    if (partialCredits.length > 0) {
      const totalPoints = partialCredits.reduce((sum, credit) => sum + credit.points, 0);
      const score = Math.max(0, Math.min(100, totalPoints));
      
      return {
        questionId: question.id,
        score,
        confidence: 0.7,
        reasoning: 'Rule-based evaluation with pattern matching',
        partialCredits
      };
    }

    return null;
  }

  private extractCategoryFromEvaluation(evaluation: EvaluationResult): string {
    // In a real implementation, this would look up the question by ID
    // For now, we'll use a placeholder
    return ExcelSkillCategory.BASIC_FORMULAS;
  }

  private calculateCategoryAverage(scores: number[] | undefined): number {
    if (!scores || scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
}