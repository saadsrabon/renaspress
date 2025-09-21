import { NextRequest, NextResponse } from 'next/server'
import { WORDPRESS_CONFIG, getWordPressUrl } from '@/lib/wordpress-config'

// GET - Fetch posts (public or user-specific)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('per_page') || '10'
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    
    let url = getWordPressUrl(`${WORDPRESS_CONFIG.ENDPOINTS.POSTS}?page=${page}&per_page=${perPage}&_embed=true`)
    
    if (category) {
      // First get category ID by slug
      const categoryResponse = await fetch(getWordPressUrl(`/wp-json/wp/v2/categories?slug=${category}`))
      if (categoryResponse.ok) {
        const categories = await categoryResponse.json()
        if (categories.length > 0) {
          url += `&categories=${categories[0].id}`
        }
      }
    }
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: response.status }
      )
    }

    const posts = await response.json()
    
    return NextResponse.json({
      success: true,
      posts,
      total: response.headers.get('X-WP-Total'),
      totalPages: response.headers.get('X-WP-TotalPages')
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Test WordPress connectivity and user auth first
    try {
      const userTestResponse = await fetch(getWordPressUrl('/wp-json/wp/v2/users/me'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (userTestResponse.ok) {
        const userInfo = await userTestResponse.json()
        console.log('=== User Auth Test ===');
        console.log('User ID:', userInfo.id);
        console.log('User Name:', userInfo.name);
        console.log('User Roles:', userInfo.roles);
        console.log('User Capabilities:', userInfo.capabilities ? Object.keys(userInfo.capabilities).filter(cap => userInfo.capabilities[cap]) : 'Not available');
        console.log('======================');
      } else {
        console.warn('User auth test failed:', userTestResponse.status, userTestResponse.statusText);
      }
    } catch (userTestError) {
      console.warn('User auth test error:', userTestError);
    }
    
    const body = await request.json()
    
    const { title, content, excerpt, status = 'draft', category, tags, media } = body

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
      
      // Prepend media to content
      processedContent = mediaHtml + content
    }

    // Get category ID if provided
    const categoryIds = []
    if (category) {
      const categoryId = await getCategoryId(category)
      if (categoryId) {
        categoryIds.push(categoryId)
      }
    }

    // Add debug logging
    console.log('=== WordPress API Debug ===');
    console.log('URL:', getWordPressUrl(WORDPRESS_CONFIG.ENDPOINTS.POSTS));
    console.log('Auth Header:', `Bearer ${token.substring(0, 20)}...`);
    
    // Try to decode JWT to see user info
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('JWT User ID:', payload.data?.user?.id);
        console.log('JWT Issued:', new Date(payload.iat * 1000));
        console.log('JWT Expires:', new Date(payload.exp * 1000));
      }
    } catch (jwtError) {
      console.warn('Could not decode JWT:', jwtError);
    }
    
    console.log('Post Data:', {
      title: title,
      content: `${processedContent.substring(0, 50)}...`,
      excerpt: excerpt || 'empty',
      status: status,
      categories: categoryIds,
      tags: tags ? tags.length : 0
    });
    console.log('==========================');

    // Create post in WordPress with correct format
    const postData = {
      title: title.trim(),
      content: processedContent.trim(),
      excerpt: (excerpt || '').trim(),
      status: status === 'published' ? 'publish' : status, // Fix status mapping
      categories: categoryIds,
      tags: tags ? await getTagIds(tags) : [],
      // Ensure we have proper data types
      meta: {},
      // Add author explicitly if needed
      // author: 'auto' // WordPress should use the authenticated user
    }
    
    console.log('Final postData being sent:', JSON.stringify(postData, null, 2))

    const response = await fetch(getWordPressUrl(WORDPRESS_CONFIG.ENDPOINTS.POSTS), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WordPress API Error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      })
      
      let error
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { message: errorText }
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to create post', details: error },
        { status: response.status }
      )
    }

    const post = await response.json()
    
    // Add response debugging
    console.log('=== WordPress Response ===');
    console.log('Status:', response.status);
    console.log('Post ID:', post.id);
    console.log('Post Title:', post.title);
    console.log('Post Status:', post.status);
    console.log('Post Author:', post.author);
    console.log('Response Keys:', Object.keys(post));
    console.log('Full post object:', JSON.stringify(post, null, 2));
    console.log('==========================');
    
    // Check if the post was actually created properly
    if (!post.id) {
      console.warn('WARNING: Post created but no ID returned - this might indicate a WordPress issue');
    }
    
    if (!post.title || (typeof post.title === 'object' && !post.title.rendered)) {
      console.warn('WARNING: Post title is empty or null');
    }
    
    // Try to fetch the post again to see if it was actually created
    if (post.id) {
      try {
        const fetchResponse = await fetch(getWordPressUrl(`${WORDPRESS_CONFIG.ENDPOINTS.POSTS}/${post.id}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (fetchResponse.ok) {
          const fetchedPost = await fetchResponse.json()
          console.log('=== Fetched Post Check ===');
          console.log('Fetched Post Title:', fetchedPost.title);
          console.log('Fetched Post Content:', fetchedPost.content ? 'Present' : 'Missing');
          console.log('==========================');
          
          // Use the fetched post if it has better data
          if (fetchedPost.title && (!post.title || (typeof post.title === 'object' && !post.title.rendered))) {
            return NextResponse.json({
              success: true,
              post: fetchedPost,
              message: 'Post created successfully (using fetched data)'
            })
          }
        }
      } catch (fetchError) {
        console.warn('Could not fetch created post for verification:', fetchError)
      }
    }
    
    return NextResponse.json({
      success: true,
      post,
      message: 'Post created successfully',
      warning: !post.id ? 'Post may not have been created properly' : null
    })
  } catch (error) {
    console.error('Error creating post:', error)
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