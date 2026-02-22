import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * RacePass Middleware
 * 
 * Architecture Note:
 * - In Web3 apps, authentication is client-side (wallet connection via wagmi)
 * - Middleware runs server-side and cannot access wallet state directly
 * - We use a hybrid approach:
 *   1. Middleware: Basic route structure, headers, future session checks
 *   2. Client-side redirects: Check on-chain identity status and redirect accordingly
 * 
 * Current Implementation:
 * - Allows all routes to load
 * - Each protected page handles its own redirects based on wallet/verification status
 * - KYC pages redirect verified users to home
 * - Dashboard/Events show appropriate UI based on verification status
 * 
 * Future Enhancement:
 * - Add session cookies after wallet signature
 * - Use middleware to check session before protected routes load
 * - Implement SIWE (Sign-In With Ethereum) for server-side auth
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that generally require wallet connection
  const protectedRoutes = ['/dashboard', '/credentials', '/verify'];
  const kycRoutes = ['/kyc','/'];
  
  // Check route type
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isKycRoute = kycRoutes.some(route => pathname.startsWith(route));
  
  // For now, allow all routes - redirects handled client-side
  // This is necessary because:
  // 1. Wallet connection state lives in wagmi (client-side)
  // 2. On-chain identity verification requires RPC calls
  // 3. No server-side session exists yet
  
  // Add custom headers for debugging (optional)
  const response = NextResponse.next();
  response.headers.set('x-racepass-route-type', 
    isProtectedRoute ? 'protected' : (isKycRoute ? 'kyc' : 'public')
  );
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
