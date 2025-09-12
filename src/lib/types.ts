// Core type definitions for the AI Excel Interviewer

export enum ExcelSkillCategory {
  BASIC_FORMULAS = 'basic_formulas',
  DATA_MANIPULATION = 'data_manipulation',
  PIVOT_TABLES = 'pivot_tables',
  ADVANCED_FUNCTIONS = 'advanced_functions',
  DATA_VISUALIZATION = 'data_visualization',
  MACROS_VBA = 'macros_vba',
  DATA_MODELING = 'data_modeling'
}

export type ExcelLevel = 'basic' | 'intermediate' | 'advanced';
export type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';
export type InterviewStatus = 'active' | 'paused' | 'completed';

// Candidate and Interview Management
export interface Candidate {
  id: string;
  email: string;
  name: string;
  targetRole: string;
  experienceLevel: string;
  createdAt: Date;
}

export interface ConversationTurn {
  id: string;
  type: 'question' | 'response' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SkillScores {
  overall: number;
  basicFormulas: number;
  dataManipulation: number;
  pivotTables: number;
  advancedFunctions: number;
  dataVisualization: number;
  macrosVBA: number;
  dataModeling: number;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  roleLevel: ExcelLevel;
  status: InterviewStatus;
  currentQuestionIndex: number;
  conversationHistory: ConversationTurn[];
  skillAssessment: SkillScores;
  startTime: Date;
  endTime?: Date;
  metadata: Record<string, any>;
}

// Question and Evaluation Models
export interface ExpectedAnswer {
  pattern: string;
  score: number;
  explanation: string;
}

export interface EvaluationCriterion {
  name: string;
  weight: number;
  description: string;
}

export interface CommonMistake {
  pattern: string;
  deduction: number;
  feedback: string;
}

export interface PartialCreditRule {
  condition: string;
  creditPercentage: number;
  feedback: string;
}

export interface EvaluationRubric {
  maxScore: number;
  criteria: EvaluationCriterion[];
  commonMistakes: CommonMistake[];
  partialCreditRules: PartialCreditRule[];
}

export interface FollowUpCondition {
  trigger: string;
  questionTemplate: string;
}

export interface Question {
  id: string;
  category: ExcelSkillCategory;
  difficulty: DifficultyLevel;
  text: string;
  expectedAnswerPatterns: string[];
  evaluationCriteria: EvaluationRubric;
  followUpTriggers: FollowUpCondition[];
}

export interface ExcelQuestion {
  id: string;
  category: ExcelSkillCategory;
  difficulty: DifficultyLevel;
  text: string;
  expectedAnswers: ExpectedAnswer[];
  evaluationRubric: EvaluationRubric;
  tags: string[];
  usageCount: number;
  averageScore: number;
}

// Evaluation Results
export interface PartialCredit {
  criterion: string;
  points: number;
  reasoning: string;
}

export interface EvaluationResult {
  questionId: string;
  score: number; // 0-100
  confidence: number; // 0-1
  reasoning: string;
  partialCredits: PartialCredit[];
  suggestedFollowUp?: string;
}

export interface DetailedFeedback {
  questionId: string;
  response: string;
  score: number;
  strengths: string[];
  improvements: string[];
  specificFeedback: string;
}

// Interview Context and Steps
export interface InterviewContext {
  sessionId: string;
  candidateLevel: ExcelLevel;
  previousQuestions: Question[];
  currentSkillScores: Partial<SkillScores>;
  conversationHistory: ConversationTurn[];
}

export interface InterviewStep {
  question?: Question;
  evaluation?: EvaluationResult;
  nextAction: 'continue' | 'complete' | 'pause';
  message: string;
}

// Reporting
export interface ComparisonResult {
  percentile: number;
  benchmark: string;
  recommendation: string;
}

export interface InterviewReport {
  candidateId: string;
  overallScore: number;
  skillBreakdown: SkillScores;
  strengths: string[];
  improvementAreas: string[];
  hiringRecommendation: 'strong_hire' | 'hire' | 'no_hire' | 'insufficient_data';
  detailedFeedback: DetailedFeedback[];
  interviewDuration: number;
  completionRate: number;
}

// Service Interfaces
export interface InterviewOrchestrator {
  startInterview(candidateId: string, roleLevel: ExcelLevel): Promise<InterviewSession>;
  processResponse(sessionId: string, response: string): Promise<InterviewStep>;
  endInterview(sessionId: string): Promise<InterviewReport>;
  pauseInterview(sessionId: string): Promise<void>;
  resumeInterview(sessionId: string): Promise<InterviewStep>;
}

export interface QuestionEngine {
  getNextQuestion(session: InterviewSession): Promise<Question>;
  generateFollowUp(previousQ: Question, response: string, score: number): Promise<Question>;
  validateQuestionCoverage(session: InterviewSession): SkillCoverage;
}

export interface SkillCoverage {
  categories: Record<ExcelSkillCategory, number>;
  overallCoverage: number;
  missingAreas: ExcelSkillCategory[];
}

export interface EvaluationEngine {
  evaluateResponse(question: Question, response: string, context: InterviewContext): Promise<EvaluationResult>;
  calculateSkillScores(evaluations: EvaluationResult[]): SkillScores;
  generateFeedback(evaluation: EvaluationResult): DetailedFeedback;
}

export interface ReportService {
  generateReport(session: InterviewSession): Promise<InterviewReport>;
  compareToBaseline(scores: SkillScores, roleLevel: ExcelLevel): ComparisonResult;
  exportReport(reportId: string, format: 'pdf' | 'json'): Promise<Buffer>;
}

// Error Handling
export interface AIServiceError extends Error {
  code: string;
  retryable: boolean;
  provider: string;
}

export enum RecoveryAction {
  RETRY_WITH_BACKOFF = 'retry_with_backoff',
  FALLBACK_TO_ALTERNATIVE = 'fallback_to_alternative',
  USE_CACHED_RESPONSE = 'use_cached_response',
  ESCALATE_TO_HUMAN = 'escalate_to_human',
  TERMINATE_GRACEFULLY = 'terminate_gracefully'
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ErrorRecovery {
  handleAIServiceError(error: AIServiceError): Promise<RecoveryAction>;
  recoverInterviewSession(sessionId: string): Promise<InterviewSession>;
  validateSessionIntegrity(session: InterviewSession): ValidationResult;
  escalateToHuman(sessionId: string, reason: string): Promise<void>;
}