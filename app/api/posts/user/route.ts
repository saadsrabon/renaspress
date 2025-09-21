import { NextRequest, NextResponse } from 'next/server'
import { WORDPRESS_CONFIG, getWordPressUrl } from '@/lib/wordpress-config'

// GET - Fetch user's posts
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('per_page') || '10'
    const status = searchParams.get('status') || 'publish,draft,pending'

    // Use custom WordPress endpoint to get user's posts
    const url = getWordPressUrl(`${WORDPRESS_CONFIG.ENDPOINTS.USER_POSTS}?page=${page}&per_page=${perPage}&status=${status}`)

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.message || 'Failed to fetch user posts' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      posts: data.posts || [],
      total: data.total || 0,
      pages: data.pages || 1,
      current_page: data.current_page || 1
    })
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}