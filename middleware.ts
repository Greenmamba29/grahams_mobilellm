import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/settings',
  '/billing',
  '/api/queries',
  '/api/analytics',
  '/api/admin'
];

// API routes that require API key authentication
const apiRoutes = [
  '/api/search',
  '/api/chat',
  '/api/function-call'
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/docs',
  '/api/auth',
  '/api/webhooks'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Organization-ID');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    // API Key authentication for API routes
    if (apiRoutes.some(route => pathname.startsWith(route))) {
      const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
      const orgId = request.headers.get('X-Organization-ID');
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'API key required', code: 'MISSING_API_KEY' },
          { status: 401 }
        );
      }
      
      // Validate API key (would be implemented in actual database call)
      const isValidApiKey = await validateApiKey(apiKey, orgId);
      
      if (!isValidApiKey) {
        return NextResponse.json(
          { error: 'Invalid API key', code: 'INVALID_API_KEY' },
          { status: 401 }
        );
      }
      
      // Add organization context to headers
      response.headers.set('X-Organization-ID', orgId || '');
      return response;
    }
    
    return response;
  }
  
  // Check if route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Session-based authentication for protected web routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token) {
      // Redirect to login page
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Add user context to headers
    const response = NextResponse.next();
    response.headers.set('X-User-ID', token.sub || '');
    response.headers.set('X-User-Email', token.email || '');
    response.headers.set('X-Organization-ID', (token as any).organizationId || '');
    
    return response;
  }
  
  return NextResponse.next();
}

// Mock API key validation - replace with actual database call
async function validateApiKey(apiKey: string, orgId?: string | null): Promise<boolean> {
  // In production, this would query the database to validate the API key
  // and return the associated organization ID and permissions
  
  // Mock validation for development
  const validKeys = [
    'sk-test-123456789',
    'sk-prod-987654321'
  ];
  
  return validKeys.includes(apiKey);
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

// Types for enhanced request context
declare module 'next/server' {
  interface NextRequest {
    user?: {
      id: string;
      email: string;
      organizationId: string;
      role: string;
    };
    organization?: {
      id: string;
      name: string;
      plan: string;
      limits: {
        maxQueriesPerMonth: number;
        maxUsers: number;
      };
    };
  }
}