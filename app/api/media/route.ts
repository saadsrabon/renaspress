import { NextRequest, NextResponse } from 'next/server'
import { WORDPRESS_CONFIG, getWordPressUrl } from '@/lib/wordpress-config'

// GET - Fetch user's media library
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
    const perPage = searchParams.get('per_page') || '20'
    const type = searchParams.get('type') // 'image' or 'video'

    // Build query parameters
    let queryParams = `page=${page}&per_page=${perPage}`
    if (type) {
      queryParams += `&type=${type}`
    }

    // Use custom WordPress endpoint to get user's media
    const url = getWordPressUrl(`${WORDPRESS_CONFIG.ENDPOINTS.USER_MEDIA}?${queryParams}`)

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.message || 'Failed to fetch media' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      media: data.media || [],
      total: data.total || 0
    })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


