import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Clear the token cookie with matching settings from login
  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax', // Match login cookie settings
    maxAge: 0, // Immediately expire
    expires: new Date(0),
    path: '/',
  });
  
  // Also try to delete the cookie explicitly
  response.cookies.delete('token');
  
  console.log('Logout: Cookie cleared', {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });

  return response;
}