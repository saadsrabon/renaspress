import { NextRequest, NextResponse } from 'next/server'
import { WORDPRESS_CONFIG, getWordPressUrl } from '@/lib/wordpress-config'

// GET - Fetch single post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id

    const response = await fetch(getWordPressUrl(`${WORDPRESS_CONFIG.ENDPOINTS.POSTS}/${postId}?_embed=true`), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const post = await response.json()
    
    return NextResponse.json({
      success: true,
      post
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const postId = params.id
    const body = await request.json()
    
    const { title, content, excerpt, status, category, tags, media } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Process media files and embed them in content
    let processedContent = content
    if (media && media.length > 0) {
      // Add media at the beginning of the content
      let mediaHtml = ''
      
      for (const mediaItem of media) {
        if (mediaItem.type === 'image') {
          mediaHtml += `<figure class="wp-block-image"><img src="${mediaItem.url}" alt="${mediaItem.title || 'Uploaded image'}" class="wp-image" /></figure>`
        } else if (mediaItem.type === 'video') {
          mediaHtml += `<figure class="wp-block-video"><video controls src="${mediaItem.url}" class="wp-video"></video></figure>`
        }
      }
      
      // Check if content already has media, if not prepend it
      if (!content.includes('<figure class="wp-block-image">') && !content.includes('<figure class="wp-block-video">')) {
        processedContent = mediaHtml + content
      } else {
        processedContent = content // Keep existing content with embedded media
      }
    }

    // Get category ID if provided
    const categoryIds = []
    if (category) {
      const categoryId = await getCategoryId(category)
      if (categoryId) {
        categoryIds.push(categoryId)
      }
    }

    // Use custom WordPress endpoint for updating posts with correct format
    const updateData = {
      title: title,
      content: processedContent,
      excerpt: excerpt || '',
      status: status,
      categories: categoryIds.length > 0 ? categoryIds : undefined,
      tags: tags ? await getTagIds(tags) : undefined
      // Note: Removed meta fields - they need to be registered in WordPress first
    }

    const response = await fetch(getWordPressUrl(WORDPRESS_CONFIG.ENDPOINTS.POST_UPDATE(parseInt(postId))), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.message || 'Failed to update post' },
        { status: response.status }
      )
    }

    const post = await response.json()
    
    return NextResponse.json({
      success: true,
      post,
      message: 'Post updated successfully'
    })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const postId = params.id
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Use custom WordPress endpoint for deleting posts
    const response = await fetch(getWordPressUrl(`${WORDPRESS_CONFIG.ENDPOINTS.POST_DELETE(parseInt(postId))}?force=${force}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.message || 'Failed to delete post' },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      message: result.message || 'Post deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get category ID by slug
async function getCategoryId(categorySlug: string): Promise<number | null> {
  try {
    const response = await fetch(getWordPressUrl(`/wp-json/wp/v2/categories?slug=${categorySlug}`))
    if (response.ok) {
      const categories = await response.json()
      return categories.length > 0 ? categories[0].id : null
    }
  } catch (error) {
    console.error('Error fetching category:', error)
  }
  return null
}

// Helper function to get tag IDs by names
async function getTagIds(tagNames: string[]): Promise<number[]> {
  const tagIds: number[] = []
  
  for (const tagName of tagNames) {
    try {
      // First try to find existing tag
      const response = await fetch(getWordPressUrl(`/wp-json/wp/v2/tags?search=${encodeURIComponent(tagName)}`))
      if (response.ok) {
        const tags = await response.json()
        const existingTag = tags.find((tag: any) => tag.name.toLowerCase() === tagName.toLowerCase())
        
        if (existingTag) {
          tagIds.push(existingTag.id)
        } else {
          // Create new tag
          const createResponse = await fetch(getWordPressUrl('/wp-json/wp/v2/tags'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: tagName }),
          })
          
          if (createResponse.ok) {
            const newTag = await createResponse.json()
            tagIds.push(newTag.id)
          }
        }
      }
    } catch (error) {
      console.error('Error processing tag:', tagName, error)
    }
  }
  
  return tagIds
}