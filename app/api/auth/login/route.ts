import { NextRequest, NextResponse } from 'next/server'
import { authenticateWordPressUser } from '@/lib/wordpress-api'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Authenticate with WordPress
    const result = await authenticateWordPressUser(email, password)

    if (result.success && result.user && result.token) {
      return NextResponse.json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.roles[0] || 'subscriber'
        },
        token: result.token,
        message: 'Login successful'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Invalid credentials' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

