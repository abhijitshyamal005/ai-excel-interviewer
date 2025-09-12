'use client';

// Interview Interface - Main interview component

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { InterviewStep, InterviewReport } from '@/lib/types';

interface InterviewInterfaceProps {
  token: string;
  sessionId: string;
  candidateId: string;
}

interface Message {
  id: string;
  type: 'question' | 'response' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export default function InterviewInterface({ 
  token, 
  sessionId, 
  candidateId 
}: InterviewInterfaceProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [interviewStatus, setInterviewStatus] = useState<'waiting' | 'active' | 'paused' | 'completed'>('waiting');
  const [isInterviewerTyping, setIsInterviewerTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewStep | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || window.location.origin, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // Authenticate
      newSocket.emit('authenticate', { token, type: 'candidate' });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setIsAuthenticated(false);
    });

    // Authentication events
    newSocket.on('authenticated', () => {
      console.log('Authenticated successfully');
      setIsAuthenticated(true);
      
      // Join interview session
      newSocket.emit('join_interview', { sessionId });
    });

    newSocket.on('authentication_error', (data) => {
      console.error('Authentication failed:', data.message);
      setError('Authentication failed. Please refresh and try again.');
    });

    // Interview events
    newSocket.on('joined_interview', (data) => {
      console.log('Joined interview:', data);
      addSystemMessage('Connected to interview session. Starting your Excel assessment...');
      
      // Start the interview
      newSocket.emit('start_interview', { candidateId, roleLevel: 'intermediate' });
    });

    newSocket.on('interview_started', (data) => {
      console.log('Interview started:', data);
      setInterviewStatus('active');
      addSystemMessage(data.message);
    });

    newSocket.on('question', (step: InterviewStep) => {
      console.log('New question received:', step);
      setCurrentQuestion(step);
      if (step.question) {
        addMessage({
          id: `q-${Date.now()}`,
          type: 'question',
          content: step.question.text,
          timestamp: new Date()
        });
      }
      setIsInterviewerTyping(false);
    });

    newSocket.on('response_acknowledged', (data) => {
      addSystemMessage(data.message);
    });

    newSocket.on('interview_completed', (data) => {
      console.log('Interview completed:', data);
      setInterviewStatus('completed');
      setReport(data.report);
      addSystemMessage('Interview completed! Thank you for your time.');
    });

    newSocket.on('interview_paused', (data) => {
      setInterviewStatus('paused');
      addSystemMessage(data.message);
    });

    newSocket.on('interview_resumed', (step: InterviewStep) => {
      setInterviewStatus('active');
      setCurrentQuestion(step);
      addSystemMessage('Interview resumed.');
    });

    // Typing indicators
    newSocket.on('interviewer_typing', () => {
      setIsInterviewerTyping(true);
    });

    newSocket.on('interviewer_stopped_typing', () => {
      setIsInterviewerTyping(false);
    });

    // Error handling
    newSocket.on('error', (data) => {
      console.error('Socket error:', data);
      setError(data.message);
    });

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('ping');
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      newSocket.disconnect();
    };
  }, [token, sessionId, candidateId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isInterviewerTyping]);

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const addSystemMessage = (content: string) => {
    addMessage({
      id: `sys-${Date.now()}`,
      type: 'system',
      content,
      timestamp: new Date()
    });
  };

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentResponse(e.target.value);
    
    // Send typing indicator
    if (socket && isAuthenticated) {
      socket.emit('candidate_typing');
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('candidate_stopped_typing');
      }, 1000);
    }
  };

  const handleSubmitResponse = () => {
    if (!currentResponse.trim() || !socket || !isAuthenticated) return;

    // Add response to messages
    addMessage({
      id: `r-${Date.now()}`,
      type: 'response',
      content: currentResponse,
      timestamp: new Date()
    });

    // Send response to server
    socket.emit('submit_response', { response: currentResponse });

    // Clear input
    setCurrentResponse('');
    
    // Stop typing indicator
    socket.emit('candidate_stopped_typing');
  };

  const handlePauseInterview = () => {
    if (socket && isAuthenticated) {
      socket.emit('pause_interview');
    }
  };

  const handleResumeInterview = () => {
    if (socket && isAuthenticated) {
      socket.emit('resume_interview');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitResponse();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-semibold mb-4">Connection Error</h2>
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (interviewStatus === 'completed' && report) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-green-600">
            Interview Completed!
          </h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Overall Performance</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {report.overallScore.toFixed(1)}%
                </div>
                <div className="text-gray-600">
                  Recommendation: <span className="font-semibold capitalize">
                    {report.hiringRecommendation.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Skill Breakdown</h2>
              <div className="space-y-2">
                {Object.entries(report.skillBreakdown).map(([skill, score]) => {
                  if (skill === 'overall') return null;
                  return (
                    <div key={skill} className="flex justify-between">
                      <span className="capitalize">
                        {skill.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <span className="font-semibold">{score.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Strengths</h2>
            <ul className="list-disc list-inside space-y-1 text-green-700">
              {report.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Areas for Improvement</h2>
            <ul className="list-disc list-inside space-y-1 text-orange-600">
              {report.improvementAreas.map((area, index) => (
                <li key={index}>{area}</li>
              ))}
            </ul>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Interview Duration: {formatTime(report.interviewDuration)}
            </p>
            <button 
              onClick={() => window.print()}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mr-4"
            >
              Print Report
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Excel Skills Assessment</h1>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="text-sm text-gray-600 capitalize">
                Status: {interviewStatus}
              </div>
              {interviewStatus === 'active' && (
                <button
                  onClick={handlePauseInterview}
                  className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                >
                  Pause
                </button>
              )}
              {interviewStatus === 'paused' && (
                <button
                  onClick={handleResumeInterview}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'response' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'response'
                      ? 'bg-blue-600 text-white'
                      : message.type === 'system'
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isInterviewerTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {interviewStatus === 'active' && (
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <textarea
                  ref={responseInputRef}
                  value={currentResponse}
                  onChange={handleResponseChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your response here... (Press Enter to send, Shift+Enter for new line)"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  disabled={!isAuthenticated}
                />
                <button
                  onClick={handleSubmitResponse}
                  disabled={!currentResponse.trim() || !isAuthenticated}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}