'use client';

// Interview Page - Entry point for candidates

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import InterviewInterface from '@/components/interview/InterviewInterface';

interface InterviewData {
  sessionId: string;
  candidateId: string;
  token: string;
}

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    targetRole: '',
    experienceLevel: 'intermediate',
    roleLevel: 'intermediate'
  });

  useEffect(() => {
    // Check if we have session data in URL params
    const sessionId = searchParams.get('sessionId');
    const candidateId = searchParams.get('candidateId');
    const token = searchParams.get('token');

    if (sessionId && candidateId && token) {
      setInterviewData({ sessionId, candidateId, token });
    }
  }, [searchParams]);

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/interviews/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start interview');
      }

      setInterviewData({
        sessionId: result.data.sessionId,
        candidateId: result.data.candidateId,
        token: result.data.token
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // If we have interview data, show the interview interface
  if (interviewData) {
    return (
      <InterviewInterface
        token={interviewData.token}
        sessionId={interviewData.sessionId}
        candidateId={interviewData.candidateId}
      />
    );
  }

  // Otherwise, show the registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Excel Skills Assessment
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Welcome to our AI-powered Excel proficiency evaluation. This assessment will test your knowledge across various Excel skills and provide detailed feedback.
            </p>
            <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Assessment Details:</strong>
                  </p>
                  <ul className="text-sm text-blue-600 mt-2 space-y-1">
                    <li>• Duration: Approximately 30-45 minutes</li>
                    <li>• Format: Conversational AI interview</li>
                    <li>• Topics: Formulas, data analysis, pivot tables, and more</li>
                    <li>• Real-time evaluation with detailed feedback</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Get Started
            </h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleStartInterview} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@company.com"
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Role (Optional)
                </label>
                <input
                  type="text"
                  id="targetRole"
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Financial Analyst, Data Analyst"
                />
              </div>

              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Excel Experience Level
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="basic">Basic (Formulas, formatting, basic charts)</option>
                  <option value="intermediate">Intermediate (Pivot tables, VLOOKUP, advanced formulas)</option>
                  <option value="advanced">Advanced (Macros, VBA, complex data modeling)</option>
                </select>
              </div>

              <div>
                <label htmlFor="roleLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Level *
                </label>
                <select
                  id="roleLevel"
                  name="roleLevel"
                  value={formData.roleLevel}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="basic">Basic Level Assessment</option>
                  <option value="intermediate">Intermediate Level Assessment</option>
                  <option value="advanced">Advanced Level Assessment</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Choose the level that matches the role you're applying for
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Before You Begin:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ensure you have a stable internet connection</li>
                  <li>• Find a quiet environment free from distractions</li>
                  <li>• You can pause the interview if needed</li>
                  <li>• Answer questions based on your Excel knowledge</li>
                  <li>• Be specific and detailed in your responses</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Starting Assessment...
                  </div>
                ) : (
                  'Start Excel Assessment'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                By starting this assessment, you agree to our evaluation process. 
                Your responses will be analyzed by our AI system to provide accurate skill assessment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}