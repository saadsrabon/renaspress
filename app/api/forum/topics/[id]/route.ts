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

// GET /api/forum/topics/[id] - Get topic by ID with comments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API route called with params:', params)
    const topicId = parseInt(params.id)
    
    if (isNaN(topicId)) {
      return NextResponse.json(
        { error: 'Invalid topic ID' },
        { status: 400 }
      )
    }

    // Fetch topic from WordPress
    const topicResponse = await fetch(getWordPressUrl(`${WORDPRESS_CONFIG.ENDPOINTS.FORUM_TOPICS}/${topicId}?_embed=true`))
    
    if (!topicResponse.ok) {
      if (topicResponse.status === 404) {
        return NextResponse.json(
          { error: 'Topic not found' },
          { status: 404 }
        )
      }
      throw new Error(`WordPress API error: ${topicResponse.status}`)
    }

    const topicData = await topicResponse.json()
    
    // Transform topic data
    const topic: ForumTopic = {
      id: topicData.id,
      title: topicData.title.rendered,
      content: topicData.content.rendered.replace(/<[^>]*>/g, ''),
      author_id: topicData.author,
      author_name: topicData._embedded?.author?.[0]?.name || 'Unknown',
      category: topicData._embedded?.['wp:term']?.[0]?.[0]?.slug || 'general',
      created_at: topicData.date,
      updated_at: topicData.modified,
      reply_count: topicData.reply_count || 0,
      last_reply_at: topicData.last_reply_at,
      status: topicData.status === 'publish' ? 'active' : topicData.status
    }

    // Fetch comments from WordPress
    const commentsResponse = await fetch(getWordPressUrl(WORDPRESS_CONFIG.ENDPOINTS.TOPIC_COMMENTS(topicId)))
    
    let comments: ForumComment[] = []
    if (commentsResponse.ok) {
      const commentsData = await commentsResponse.json()
      comments = commentsData.map((comment: any) => ({
        id: comment.id,
        topic_id: topicId,
        content: comment.content,
        author_id: comment.is_anonymous ? undefined : comment.author_id,
        author_name: comment.author_name,
        is_anonymous: comment.is_anonymous,
        created_at: comment.created_at
      }))
    }

    return NextResponse.json({
      topic,
      comments
    })

  } catch (error) {
    console.error('Error fetching topic:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topic' },
      { status: 500 }
    )
  }
}
