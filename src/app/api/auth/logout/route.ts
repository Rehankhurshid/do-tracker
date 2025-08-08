import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Method 1: Delete using cookies().delete()
    cookieStore.delete('token');
    
    // Method 2: Set cookie with expired date
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
    
    // Set the cookie to empty with all possible clearing methods
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Must be 'none' for cross-site cookies with secure
      maxAge: -1, // Negative maxAge to delete
      expires: new Date(0), // Expired date
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
    });
    
    // Additional headers to ensure no caching
    response.headers.set('Clear-Site-Data', '"cookies"');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    console.log('Logout executed - cookie should be cleared');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}