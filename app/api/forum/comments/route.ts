import { NextRequest, NextResponse } from 'next/server'
import { getWordPressUrl, WORDPRESS_CONFIG } from '@/lib/wordpress-config'

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

// POST /api/forum/comments - Create new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic_id, content, author_id, author_name, is_anonymous = false, parent_id } = body

    // Validate required fields
    if (!topic_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For anonymous comments, require author_name
    if (is_anonymous && !author_name) {
      return NextResponse.json(
        { error: 'Author name is required for anonymous comments' },
        { status: 400 }
      )
    }

    // For logged-in comments, require author_id
    if (!is_anonymous && !author_id) {
      return NextResponse.json(
        { error: 'Authentication required for logged-in comments' },
        { status: 401 }
      )
    }

    // Create comment in WordPress
    const commentData = {
      topic_id: topic_id,
      content: content,
      author_name: author_name || 'Anonymous User',
      is_anonymous: is_anonymous
    }

    const response = await fetch(getWordPressUrl(WORDPRESS_CONFIG.ENDPOINTS.COMMENTS), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.message || 'Failed to create comment in WordPress' },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    if (result.success) {
      const newComment: ForumComment = {
        id: result.comment.id,
        topic_id: result.comment.topic_id,
        content: result.comment.content,
        author_id: is_anonymous ? undefined : author_id,
        author_name: result.comment.author_name,
        is_anonymous: result.comment.is_anonymous,
        created_at: result.comment.created_at,
        parent_id
      }

      return NextResponse.json({
        success: true,
        comment: newComment
      }, { status: 201 })
    } else {
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

