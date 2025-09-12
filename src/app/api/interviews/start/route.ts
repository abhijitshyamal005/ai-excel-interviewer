// API Route: Start Interview

import { NextRequest, NextResponse } from 'next/server';
import { InterviewOrchestrator } from '@/services/interview/interview-orchestrator';
import { CandidateRepository } from '@/lib/repositories/candidate';
import { logger } from '@/lib/logger';
import { generateCandidateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, targetRole, experienceLevel, roleLevel } = body;

    // Validate required fields
    if (!email || !name || !roleLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, roleLevel' },
        { status: 400 }
      );
    }

    // Validate roleLevel
    if (!['basic', 'intermediate', 'advanced'].includes(roleLevel)) {
      return NextResponse.json(
        { error: 'Invalid roleLevel. Must be: basic, intermediate, or advanced' },
        { status: 400 }
      );
    }

    const candidateRepo = new CandidateRepository();
    const interviewOrchestrator = new InterviewOrchestrator();

    // Create or get candidate
    let candidate = await candidateRepo.findByEmail(email);
    if (!candidate) {
      candidate = await candidateRepo.create({
        email,
        name,
        targetRole: targetRole || '',
        experienceLevel: experienceLevel || roleLevel
      });
    }

    // Start interview session
    const session = await interviewOrchestrator.startInterview(candidate.id, roleLevel);

    // Generate candidate token for authentication
    const token = generateCandidateToken({
      id: candidate.id,
      email: candidate.email,
      name: candidate.name,
      interviewSessionId: session.id,
      createdAt: new Date()
    });

    logger.info('Interview started via API', {
      candidateId: candidate.id,
      sessionId: session.id,
      roleLevel
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        candidateId: candidate.id,
        token,
        message: 'Interview session created successfully',
        instructions: 'Use the WebSocket connection with this token to begin the interview'
      }
    });

  } catch (error) {
    logger.error('Failed to start interview', {}, error as Error);
    
    return NextResponse.json(
      { 
        error: 'Failed to start interview',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Interview API is running',
    endpoints: {
      start: 'POST /api/interviews/start',
      status: 'GET /api/interviews/[id]/status',
      complete: 'POST /api/interviews/[id]/complete'
    }
  });
}