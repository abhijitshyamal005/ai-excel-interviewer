// API Route: Interview Reports

import { NextRequest, NextResponse } from 'next/server';
import { ComprehensiveReportService } from '@/services/reports/report-service';
import { InterviewRepository } from '@/lib/repositories/interview';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const interviewRepo = new InterviewRepository();
    const reportService = new ComprehensiveReportService();

    // Get interview session
    const session = await interviewRepo.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Interview session not found' },
        { status: 404 }
      );
    }

    // Check if interview is completed
    if (session.status !== 'completed') {
      return NextResponse.json(
        { error: 'Interview is not yet completed' },
        { status: 400 }
      );
    }

    // Generate comprehensive report
    const report = await reportService.generateReport(session);

    // Get baseline comparison
    const comparison = reportService.compareToBaseline(
      report.skillBreakdown,
      session.roleLevel as any
    );

    logger.info('Report generated via API', {
      sessionId,
      overallScore: report.overallScore,
      recommendation: report.hiringRecommendation
    });

    return NextResponse.json({
      success: true,
      data: {
        report,
        comparison,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to generate report', { sessionId: params.sessionId }, error as Error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const body = await request.json();
    const { format = 'json' } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!['json', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be json or pdf' },
        { status: 400 }
      );
    }

    const reportService = new ComprehensiveReportService();

    // Export report in requested format
    const exportedReport = await reportService.exportReport(sessionId, format);

    const contentType = format === 'pdf' ? 'application/pdf' : 'application/json';
    const filename = `interview-report-${sessionId}.${format}`;

    logger.info('Report exported via API', { sessionId, format });

    return new NextResponse(exportedReport, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    logger.error('Failed to export report', { sessionId: params.sessionId }, error as Error);
    
    return NextResponse.json(
      { 
        error: 'Failed to export report',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}