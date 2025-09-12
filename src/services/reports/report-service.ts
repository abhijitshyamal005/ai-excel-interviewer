// Report Service - Comprehensive assessment reporting

import { 
  ReportService, 
  InterviewSession, 
  InterviewReport, 
  SkillScores, 
  ComparisonResult, 
  ExcelLevel,
  DetailedFeedback 
} from '@/lib/types';
import { EvaluationRepository } from '@/lib/repositories/evaluation';
import { logger } from '@/lib/logger';

export class ComprehensiveReportService implements ReportService {
  private evaluationRepo: EvaluationRepository;

  constructor() {
    this.evaluationRepo = new EvaluationRepository();
  }

  async generateReport(session: InterviewSession): Promise<InterviewReport> {
    logger.info('Generating interview report', { sessionId: session.id });

    try {
      // Get all evaluations for this session
      const evaluations = await this.evaluationRepo.findBySessionId(session.id);
      
      if (evaluations.length === 0) {
        throw new Error('No evaluations found for session');
      }

      // Calculate duration
      const duration = session.endTime 
        ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
        : 0;

      // Calculate completion rate
      const completionRate = evaluations.length > 0 ? 100 : 0;

      // Generate detailed feedback
      const detailedFeedback: DetailedFeedback[] = evaluations.map(evaluation => ({
        questionId: evaluation.questionId,
        response: evaluation.candidateResponse,
        score: evaluation.score,
        strengths: this.extractStrengths(evaluation),
        improvements: this.extractImprovements(evaluation),
        specificFeedback: evaluation.reasoning || 'No specific feedback available'
      }));

      // Extract skill scores from session
      const skillBreakdown = session.skillAssessment as SkillScores;

      // Generate strengths and improvement areas
      const { strengths, improvementAreas } = this.analyzePerformance(skillBreakdown, evaluations);

      // Generate hiring recommendation
      const hiringRecommendation = this.generateHiringRecommendation(
        skillBreakdown.overall,
        session.roleLevel,
        completionRate
      );

      const report: InterviewReport = {
        candidateId: session.candidateId,
        overallScore: skillBreakdown.overall,
        skillBreakdown,
        strengths,
        improvementAreas,
        hiringRecommendation,
        detailedFeedback,
        interviewDuration: duration,
        completionRate
      };

      logger.info('Report generated successfully', {
        sessionId: session.id,
        overallScore: report.overallScore,
        recommendation: report.hiringRecommendation
      });

      return report;

    } catch (error) {
      logger.error('Report generation failed', { sessionId: session.id }, error as Error);
      throw error;
    }
  }

  compareToBaseline(scores: SkillScores, roleLevel: ExcelLevel): ComparisonResult {
    logger.debug('Comparing scores to baseline', { roleLevel, overallScore: scores.overall });

    // Define baseline scores for different role levels
    const baselines = {
      basic: {
        overall: 60,
        basicFormulas: 70,
        dataManipulation: 60,
        pivotTables: 50,
        advancedFunctions: 40,
        dataVisualization: 45,
        macrosVBA: 30,
        dataModeling: 35
      },
      intermediate: {
        overall: 75,
        basicFormulas: 85,
        dataManipulation: 80,
        pivotTables: 75,
        advancedFunctions: 70,
        dataVisualization: 65,
        macrosVBA: 50,
        dataModeling: 60
      },
      advanced: {
        overall: 85,
        basicFormulas: 90,
        dataManipulation: 90,
        pivotTables: 85,
        advancedFunctions: 85,
        dataVisualization: 80,
        macrosVBA: 75,
        dataModeling: 80
      }
    };

    const baseline = baselines[roleLevel];
    const overallDifference = scores.overall - baseline.overall;
    
    // Calculate percentile (simplified)
    let percentile: number;
    if (overallDifference >= 15) percentile = 90;
    else if (overallDifference >= 10) percentile = 80;
    else if (overallDifference >= 5) percentile = 70;
    else if (overallDifference >= 0) percentile = 60;
    else if (overallDifference >= -5) percentile = 50;
    else if (overallDifference >= -10) percentile = 40;
    else if (overallDifference >= -15) percentile = 30;
    else percentile = 20;

    // Generate benchmark description
    let benchmark: string;
    if (percentile >= 80) benchmark = 'Top performer';
    else if (percentile >= 70) benchmark = 'Above average';
    else if (percentile >= 50) benchmark = 'Average performer';
    else if (percentile >= 30) benchmark = 'Below average';
    else benchmark = 'Needs significant improvement';

    // Generate recommendation
    let recommendation: string;
    if (scores.overall >= baseline.overall + 10) {
      recommendation = 'Exceeds role requirements - consider for advanced positions';
    } else if (scores.overall >= baseline.overall) {
      recommendation = 'Meets role requirements - good candidate';
    } else if (scores.overall >= baseline.overall - 10) {
      recommendation = 'Close to requirements - consider with additional training';
    } else {
      recommendation = 'Does not meet minimum requirements for this role';
    }

    return {
      percentile,
      benchmark,
      recommendation
    };
  }

  async exportReport(reportId: string, format: 'pdf' | 'json'): Promise<Buffer> {
    logger.info('Exporting report', { reportId, format });

    // For now, we'll implement JSON export
    // PDF export would require additional libraries like puppeteer or jsPDF
    
    if (format === 'json') {
      // In a real implementation, we'd fetch the report from database
      const reportData = { reportId, message: 'Report export not fully implemented' };
      return Buffer.from(JSON.stringify(reportData, null, 2));
    }

    throw new Error(`Export format ${format} not yet implemented`);
  }

  private extractStrengths(evaluation: any): string[] {
    const strengths: string[] = [];
    
    if (evaluation.score >= 80) {
      strengths.push('Strong technical knowledge demonstrated');
    }
    
    if (evaluation.confidence >= 0.8) {
      strengths.push('Clear and confident response');
    }

    // Extract from partial credits
    if (evaluation.partialCredits) {
      const positiveCredits = evaluation.partialCredits.filter((credit: any) => credit.points > 0);
      strengths.push(...positiveCredits.map((credit: any) => credit.reasoning));
    }

    return strengths.length > 0 ? strengths : ['Response provided'];
  }

  private extractImprovements(evaluation: any): string[] {
    const improvements: string[] = [];
    
    if (evaluation.score < 70) {
      improvements.push('Review fundamental concepts');
    }
    
    if (evaluation.confidence < 0.6) {
      improvements.push('Build confidence through practice');
    }

    // Extract from partial credits
    if (evaluation.partialCredits) {
      const negativeCredits = evaluation.partialCredits.filter((credit: any) => credit.points <= 0);
      improvements.push(...negativeCredits.map((credit: any) => credit.reasoning));
    }

    return improvements;
  }

  private analyzePerformance(skillScores: SkillScores, evaluations: any[]): {
    strengths: string[];
    improvementAreas: string[];
  } {
    const strengths: string[] = [];
    const improvementAreas: string[] = [];

    // Analyze skill scores
    Object.entries(skillScores).forEach(([skill, score]) => {
      if (skill === 'overall') return;
      
      if (score >= 80) {
        strengths.push(`Excellent ${skill.replace(/([A-Z])/g, ' $1').toLowerCase()} skills`);
      } else if (score < 60) {
        improvementAreas.push(`Strengthen ${skill.replace(/([A-Z])/g, ' $1').toLowerCase()} knowledge`);
      }
    });

    // Analyze evaluation patterns
    const avgScore = evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length;
    const avgConfidence = evaluations.reduce((sum, evaluation) => sum + evaluation.confidence, 0) / evaluations.length;

    if (avgConfidence >= 0.8) {
      strengths.push('Consistent and confident responses');
    } else if (avgConfidence < 0.6) {
      improvementAreas.push('Build confidence in Excel knowledge');
    }

    if (avgScore >= 85) {
      strengths.push('Strong overall Excel proficiency');
    } else if (avgScore < 65) {
      improvementAreas.push('Focus on fundamental Excel concepts');
    }

    return { strengths, improvementAreas };
  }

  private generateHiringRecommendation(
    overallScore: number,
    roleLevel: ExcelLevel,
    completionRate: number
  ): 'strong_hire' | 'hire' | 'no_hire' | 'insufficient_data' {
    if (completionRate < 50) {
      return 'insufficient_data';
    }

    const thresholds = {
      basic: { strongHire: 85, hire: 70 },
      intermediate: { strongHire: 90, hire: 75 },
      advanced: { strongHire: 95, hire: 85 }
    };

    const threshold = thresholds[roleLevel];

    if (overallScore >= threshold.strongHire) {
      return 'strong_hire';
    } else if (overallScore >= threshold.hire) {
      return 'hire';
    } else {
      return 'no_hire';
    }
  }
}