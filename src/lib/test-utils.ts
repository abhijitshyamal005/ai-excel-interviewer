// Test utilities for the AI Excel Interviewer

import { InterviewSession, Question, EvaluationResult, ExcelSkillCategory } from '@/lib/types';

export const mockCandidate = {
  id: 'test-candidate-1',
  email: 'test@example.com',
  name: 'John Doe',
  targetRole: 'Financial Analyst',
  experienceLevel: 'intermediate',
  createdAt: new Date()
};

export const mockInterviewSession: InterviewSession = {
  id: 'test-session-1',
  candidateId: 'test-candidate-1',
  roleLevel: 'intermediate',
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
  startTime: new Date(),
  metadata: {}
};

export const mockQuestion: Question = {
  id: 'test-question-1',
  category: ExcelSkillCategory.BASIC_FORMULAS,
  difficulty: 'intermediate',
  text: 'How would you calculate the sum of values in cells A1 to A10?',
  expectedAnswerPatterns: ['=SUM(A1:A10)', 'SUM function', 'A1:A10'],
  evaluationCriteria: {
    maxScore: 100,
    criteria: [
      {
        name: 'Correct Formula',
        weight: 0.6,
        description: 'Uses correct SUM formula syntax'
      },
      {
        name: 'Range Reference',
        weight: 0.4,
        description: 'Correctly specifies cell range'
      }
    ],
    commonMistakes: [
      {
        pattern: 'SUM(A1,A2,A3...)',
        deduction: 20,
        feedback: 'Using individual cell references instead of range'
      }
    ],
    partialCreditRules: [
      {
        condition: 'mentions SUM',
        creditPercentage: 50,
        feedback: 'Understands SUM function concept'
      }
    ]
  },
  followUpTriggers: []
};

export const mockEvaluationResult: EvaluationResult = {
  questionId: 'test-question-1',
  score: 85,
  confidence: 0.9,
  reasoning: 'Correct formula syntax with proper range reference',
  partialCredits: [
    {
      criterion: 'Correct Formula',
      points: 60,
      reasoning: 'Used correct SUM function'
    },
    {
      criterion: 'Range Reference',
      points: 25,
      reasoning: 'Properly specified A1:A10 range'
    }
  ]
};

export const sampleResponses = {
  excellent: '=SUM(A1:A10) - This formula will calculate the sum of all values in the range from A1 to A10.',
  good: 'I would use the SUM function with the range A1:A10',
  partial: 'Use SUM to add up the numbers',
  poor: 'Add all the cells together manually',
  incorrect: 'Use AVERAGE function'
};

export const sampleQuestions = [
  {
    category: ExcelSkillCategory.BASIC_FORMULAS,
    difficulty: 'basic',
    text: 'How do you create a simple addition formula in Excel?',
    expectedAnswers: ['=A1+B1', '= sign', 'cell references']
  },
  {
    category: ExcelSkillCategory.DATA_MANIPULATION,
    difficulty: 'intermediate',
    text: 'Explain how to sort data in Excel and what options are available.',
    expectedAnswers: ['Data tab', 'Sort button', 'ascending/descending', 'custom sort']
  },
  {
    category: ExcelSkillCategory.PIVOT_TABLES,
    difficulty: 'advanced',
    text: 'How would you create a pivot table to analyze sales data by region and product?',
    expectedAnswers: ['Insert tab', 'PivotTable', 'drag fields', 'rows/columns/values']
  }
];

// Test data validation
export function validateTestData(): boolean {
  try {
    // Validate mock data structure
    if (!mockCandidate.id || !mockCandidate.email) {
      throw new Error('Invalid mock candidate data');
    }

    if (!mockInterviewSession.id || !mockInterviewSession.candidateId) {
      throw new Error('Invalid mock interview session data');
    }

    if (!mockQuestion.id || !mockQuestion.text) {
      throw new Error('Invalid mock question data');
    }

    if (mockEvaluationResult.score < 0 || mockEvaluationResult.score > 100) {
      throw new Error('Invalid evaluation score');
    }

    return true;
  } catch (error) {
    console.error('Test data validation failed:', error);
    return false;
  }
}

// Helper functions for testing
export function createMockSession(overrides: Partial<InterviewSession> = {}): InterviewSession {
  return {
    ...mockInterviewSession,
    ...overrides,
    id: `test-session-${Date.now()}`,
    startTime: new Date()
  };
}

export function createMockQuestion(overrides: Partial<Question> = {}): Question {
  return {
    ...mockQuestion,
    ...overrides,
    id: `test-question-${Date.now()}`
  };
}

export function createMockEvaluation(overrides: Partial<EvaluationResult> = {}): EvaluationResult {
  return {
    ...mockEvaluationResult,
    ...overrides
  };
}