// API Route: Interview Status

import { NextRequest, NextResponse } from 'next/server';
import { InterviewRepository } from '@/lib/repositories/interview';
import { SessionManager } from '@/lib/redis';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const interviewRepo = new InterviewRepository();

    // Get session from database
    const session = await interviewRepo.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Interview session not found' },
        { status: 404 }
      );
    }

    // Get real-time session data from Redis
    const liveSession = await SessionManager.getSession(sessionId);

    // Calculate progress
    const totalQuestions = 15; // From config
    const progress = Math.round((session.currentQuestionIndex / totalQuestions) * 100);

    // Calculate duration
    const duration = session.endTime 
      ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
      : Math.floor((Date.now() - session.startTime.getTime()) / 1000);

    const response = {
      sessionId: session.id,
      candidateId: session.candidateId,
      status: session.status,
      roleLevel: session.roleLevel,
      progress,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions,
      duration,
      startTime: session.startTime,
      endTime: session.endTime,
      skillAssessment: session.skillAssessment,
      isLive: !!liveSession,
      conversationHistory: liveSession?.conversationHistory || session.conversationHistory
    };

    logger.debug('Interview status retrieved', { sessionId, status: session.status });

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    logger.error('Failed to get interview status', { sessionId: params.id }, error as Error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get interview status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}