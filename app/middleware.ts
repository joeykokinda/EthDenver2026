import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  
  // Detect AI agents / bots
  const isBot = /bot|crawler|spider|curl|wget|python|agent|openai|anthropic|claude|gpt/i.test(userAgent)
  
  // If bot accessing root, redirect to skill.md
  if (isBot && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/skill.md', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|skill.md).*)',
  ],
}
