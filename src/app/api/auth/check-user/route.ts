import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username || username.length < 2) {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }

    // Find user by username
    const { data: user, error } = await supabase
      .from('User')
      .select('username, role, isActive, email')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }

    // Get role display information
    const roleInfo = {
      ADMIN: {
        label: 'Administrator',
        description: 'Full system access',
        icon: '👨‍💼',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
      },
      AREA_OFFICE: {
        label: 'Area Office',
        description: 'Create and manage delivery orders',
        icon: '📝',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      },
      PROJECT_OFFICE: {
        label: 'Project Office',
        description: 'Process and forward orders',
        icon: '📊',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      },
      ROAD_SALE: {
        label: 'Road Sale',
        description: 'Final delivery point',
        icon: '🚚',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
      },
    };

    return NextResponse.json({
      exists: true,
      user: {
        username: user.username,
        role: user.role,
        roleInfo: roleInfo[user.role as keyof typeof roleInfo] || {
          label: user.role,
          description: 'System user',
          icon: '👤',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        },
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { exists: false },
      { status: 200 }
    );
  }
}
