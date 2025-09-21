import { NextRequest, NextResponse } from 'next/server'
import { getWordPressUrl, WORDPRESS_CONFIG } from '@/lib/wordpress-config'

export interface ForumTopic {
  id: number
  title: string
  content: string
  author_id: number
  author_name: string
  category: string
  created_at: string
  updated_at: string
  reply_count: number
  last_reply_at?: string
  status: 'active' | 'closed' | 'pinned'
}

export interface ForumComment {
  id: number
  topic_id: number
  content: string
  author_id?: number
  author_name: string
  is_anonymous: boolean
  created_at: string
  parent_id?: number
}

// GET /api/forum/topics - Fetch all topics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    // Fetch from WordPress REST API
    let url = `${getWordPressUrl(WORDPRESS_CONFIG.ENDPOINTS.FORUM_TOPICS)}?per_page=${limit}&page=${page}&_embed=true`
    
    // Add category filter
    if (category !== 'all') {
      // Get category term ID first
      const categoryResponse = await fetch(getWordPressUrl(`${WORDPRESS_CONFIG.ENDPOINTS.FORUM_CATEGORIES}?slug=${category}`))
      if (categoryResponse.ok) {
        const categories = await categoryResponse.json()
        if (categories.length > 0) {
          url += `&forum_category=${categories[0].id}`
        }
      }
    }

    // Add search filter
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }

    console.log('Fetching topics from:', url)
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform WordPress data to our format
    const topics = data.map((post: any) => ({
      id: post.id,
      title: post.title.rendered,
      content: post.content.rendered.replace(/<[^>]*>/g, ''), // Strip HTML
      author_id: post.author,
      author_name: post._embedded?.author?.[0]?.name || 'Unknown',
      category: post._embedded?.['wp:term']?.[0]?.[0]?.slug || 'general',
      created_at: post.date,
      updated_at: post.modified,
      reply_count: post.reply_count || 0,
      last_reply_at: post.last_reply_at,
      status: post.status === 'publish' ? 'active' : post.status
    }))

    return NextResponse.json({
      topics,
      pagination: {
        page,
        limit,
        total: parseInt(response.headers.get('X-WP-Total') || '0'),
        totalPages: parseInt(response.headers.get('X-WP-TotalPages') || '0')
      }
    })

  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}

// POST /api/forum/topics - Create new topic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, category, author_id, author_name } = body

    // Validate required fields
    if (!title || !content || !category || !author_id || !author_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user is authenticated (author_id should be present)
    if (!author_id) {
      return NextResponse.json(
        { error: 'Authentication required to create topics' },
        { status: 401 }
      )
    }

    // Get category term ID
    const categoryResponse = await fetch(getWordPressUrl(`${WORDPRESS_CONFIG.ENDPOINTS.FORUM_CATEGORIES}?slug=${category}`))
    let categoryId = null
    if (categoryResponse.ok) {
      const categories = await categoryResponse.json()
      if (categories.length > 0) {
        categoryId = categories[0].id
      }
    }

    // Create topic in WordPress
    const topicData = {
      title: title,
      content: content,
      status: 'publish',
      author: author_id,
      forum_category: categoryId
    }

    const response = await fetch(getWordPressUrl(WORDPRESS_CONFIG.ENDPOINTS.FORUM_TOPICS), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add authentication here
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(topicData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || 'Failed to create topic in WordPress' },
        { status: response.status }
      )
    }

    const createdTopic = await response.json()
    
    // Transform to our format
    const newTopic: ForumTopic = {
      id: createdTopic.id,
      title: createdTopic.title.rendered,
      content: createdTopic.content.rendered.replace(/<[^>]*>/g, ''),
      author_id: createdTopic.author,
      author_name: author_name,
      category: category,
      created_at: createdTopic.date,
      updated_at: createdTopic.modified,
      reply_count: 0,
      status: 'active'
    }

    return NextResponse.json({
      success: true,
      topic: newTopic
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating topic:', error)
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    )
  }
}

