// OpenAI client for Excel evaluation

import OpenAI from 'openai';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { Question, EvaluationResult, InterviewContext } from '@/lib/types';

export class OpenAIClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.openai.apiKey,
    });
  }

  async evaluateExcelResponse(
    question: Question,
    response: string,
    context: InterviewContext
  ): Promise<EvaluationResult> {
    logger.debug('Evaluating response with OpenAI', {
      questionId: question.id,
      responseLength: response.length
    });

    const prompt = this.buildEvaluationPrompt(question, response, context);

    try {
      const completion = await this.client.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.ai.openai.temperature,
        max_tokens: config.ai.openai.maxTokens,
        tools: [
          {
            type: 'function',
            function: {
              name: 'evaluate_excel_response',
              description: 'Evaluate an Excel-related response and provide scoring',
              parameters: {
                type: 'object',
                properties: {
                  score: {
                    type: 'number',
                    description: 'Score from 0-100 based on accuracy and completeness',
                    minimum: 0,
                    maximum: 100
                  },
                  confidence: {
                    type: 'number',
                    description: 'Confidence in the evaluation from 0-1',
                    minimum: 0,
                    maximum: 1
                  },
                  reasoning: {
                    type: 'string',
                    description: 'Detailed explanation of the scoring rationale'
                  },
                  partialCredits: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        criterion: { type: 'string' },
                        points: { type: 'number' },
                        reasoning: { type: 'string' }
                      }
                    }
                  },
                  suggestedFollowUp: {
                    type: 'string',
                    description: 'Optional follow-up question if needed'
                  }
                },
                required: ['score', 'confidence', 'reasoning', 'partialCredits']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'evaluate_excel_response' } }
      });

      const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall || !toolCall.function.arguments) {
        throw new Error('No tool call response received');
      }

      const evaluation = JSON.parse(toolCall.function.arguments);
      
      logger.info('OpenAI evaluation completed', {
        questionId: question.id,
        score: evaluation.score,
        confidence: evaluation.confidence
      });

      return {
        questionId: question.id,
        score: evaluation.score,
        confidence: evaluation.confidence,
        reasoning: evaluation.reasoning,
        partialCredits: evaluation.partialCredits || [],
        suggestedFollowUp: evaluation.suggestedFollowUp
      };

    } catch (error) {
      logger.error('OpenAI evaluation failed', { questionId: question.id }, error as Error);
      throw error;
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert Excel interviewer and evaluator. Your role is to assess candidates' Excel knowledge and skills based on their responses to technical questions.

EVALUATION CRITERIA:
1. Technical Accuracy: Is the Excel formula, function, or concept correct?
2. Syntax Correctness: Is the syntax properly formatted for Excel?
3. Completeness: Does the response fully address the question?
4. Efficiency: Is the proposed solution efficient and best practice?
5. Understanding: Does the candidate demonstrate conceptual understanding?

SCORING GUIDELINES:
- 90-100: Excellent - Perfect or near-perfect response with deep understanding
- 80-89: Good - Correct approach with minor issues or missing details
- 70-79: Satisfactory - Generally correct but with some errors or inefficiencies
- 60-69: Needs Improvement - Partially correct but significant gaps
- 50-59: Poor - Major errors or misunderstanding
- 0-49: Inadequate - Incorrect or no meaningful response

PARTIAL CREDIT RULES:
- Award partial credit for correct concepts even with syntax errors
- Recognize alternative valid approaches even if not optimal
- Consider the candidate's level (basic/intermediate/advanced)
- Give credit for explaining thought process even if execution is flawed

Be fair, consistent, and constructive in your evaluations. Focus on both what the candidate got right and areas for improvement.`;
  }

  private buildEvaluationPrompt(
    question: Question,
    response: string,
    context: InterviewContext
  ): string {
    return `
QUESTION DETAILS:
Category: ${question.category}
Difficulty: ${question.difficulty}
Question: ${question.text}

EXPECTED ANSWERS:
${question.expectedAnswerPatterns.map(pattern => `- ${pattern}`).join('\n')}

EVALUATION RUBRIC:
Max Score: ${question.evaluationCriteria.maxScore}
Criteria:
${question.evaluationCriteria.criteria.map(c => 
  `- ${c.name} (${(c.weight * 100).toFixed(0)}%): ${c.description}`
).join('\n')}

Common Mistakes to Watch For:
${question.evaluationCriteria.commonMistakes.map(m => 
  `- ${m.pattern}: -${m.deduction} points (${m.feedback})`
).join('\n')}

CANDIDATE CONTEXT:
Level: ${context.candidateLevel}
Previous Performance: ${JSON.stringify(context.currentSkillScores)}

CANDIDATE RESPONSE:
"${response}"

Please evaluate this response according to the criteria above and provide a detailed assessment.`;
  }

  async generateInterviewQuestion(
    category: string,
    difficulty: string,
    context: InterviewContext
  ): Promise<string> {
    const prompt = `Generate a ${difficulty} level Excel interview question for the ${category} category.
    
Context:
- Candidate level: ${context.candidateLevel}
- Previous questions covered: ${context.previousQuestions.length}
- Current skill scores: ${JSON.stringify(context.currentSkillScores)}

The question should:
1. Be appropriate for the difficulty level
2. Test practical Excel knowledge
3. Be different from previously asked questions
4. Allow for multiple valid approaches
5. Be clear and unambiguous

Return only the question text, no additional formatting.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: config.ai.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert Excel interviewer creating technical assessment questions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const questionText = completion.choices[0]?.message?.content?.trim();
      if (!questionText) {
        throw new Error('No question generated');
      }

      logger.info('AI question generated', { category, difficulty });
      return questionText;

    } catch (error) {
      logger.error('Question generation failed', { category, difficulty }, error as Error);
      throw error;
    }
  }
}