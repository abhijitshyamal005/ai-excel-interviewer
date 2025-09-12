// Authentication utilities

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// JWT utilities
export function generateToken(user: AuthUser): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Request authentication
export function getTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const tokenCookie = request.cookies.get('auth-token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

export function authenticateRequest(request: NextRequest): TokenPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

// Role-based access control
export function hasRole(user: TokenPayload, requiredRole: string): boolean {
  const roleHierarchy = {
    'admin': 3,
    'interviewer': 2,
    'candidate': 1,
  };

  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}

// Session management for candidates
export interface CandidateSession {
  id: string;
  email: string;
  name: string;
  interviewSessionId?: string;
  createdAt: Date;
}

export function generateCandidateToken(candidate: CandidateSession): string {
  const payload = {
    candidateId: candidate.id,
    email: candidate.email,
    sessionType: 'candidate',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '6h' }); // Shorter expiry for candidates
}

export function verifyCandidateToken(token: string): any | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.sessionType !== 'candidate') {
      return null;
    }
    return payload;
  } catch (error) {
    console.error('Candidate token verification failed:', error);
    return null;
  }
}