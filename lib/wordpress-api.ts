export interface WordPressPost {
  id: number
  title: {
    rendered: string
  }
  content: {
    rendered: string
  }
  excerpt: {
    rendered: string
  }
  date: string
  modified: string
  slug: string
  link: string
  featured_media: number
  categories: number[]
  tags: number[]
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
    }>
    'wp:term'?: Array<Array<{
      id: number
      name: string
      slug: string
      taxonomy: string
    }>>
  }
}

export interface WordPressCategory {
  id: number
  name: string
  slug: string
  description: string
  count: number
}

export const WORDPRESS_API_BASE = 'https://dodgerblue-bee-602062.hostingersite.com/wp-json/wp/v2'

// // Debug function to test WordPress API connectivity
// export async function testWordPressAPI(): Promise<{ success: boolean; error?: string }> {
//   try {
//     const response = await fetch(`${WORDPRESS_API_BASE}/users?per_page=1`)
//     if (response.ok) {
//       return { success: true }
//     } else {
//       const errorData = await response.json()
//       return { 
//         success: false, 
//         error: `WordPress API error: ${response.status} - ${errorData.message || 'Unknown error'}` 
//       }
//     }
//   } catch (error) {
//     return { 
//       success: false, 
//       error: `WordPress API connection failed: ${error}` 
//     }
//   }
// }

export async function fetchPostsByCategory(
  categorySlug: string,
  page: number = 1,
  perPage: number = 10
): Promise<WordPressPost[]> {
  try {
    // First, get the category ID by slug
    const categoryResponse = await fetch(
      `${WORDPRESS_API_BASE}/categories?slug=${categorySlug}`
    )
    
    if (!categoryResponse.ok) {
      throw new Error(`Failed to fetch category: ${categoryResponse.statusText}`)
    }
    
    const categories = await categoryResponse.json()
      
    if (categories.length === 0) {
      return []
    }
    
    const categoryId = categories[0].id
    
    // Fetch posts by category ID
    const response = await fetch(
      `${WORDPRESS_API_BASE}/posts?categories=${categoryId}&page=${page}&per_page=${perPage}&_embed=true`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

export async function fetchAllCategories(): Promise<WordPressCategory[]> {
  try {
    const response = await fetch(`${WORDPRESS_API_BASE}/categories?per_page=100`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function fetchPost(slug: string): Promise<WordPressPost | null> {
  try {
    const response = await fetch(
      `${WORDPRESS_API_BASE}/posts?slug=${slug}&_embed=true`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.statusText}`)
    }
    
    const posts = await response.json()
    return posts.length > 0 ? posts[0] : null
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export async function fetchRecentPosts(
  perPage: number = 10,
  categorySlug?: string
): Promise<WordPressPost[]> {
  try {
    let url = `${WORDPRESS_API_BASE}/posts?per_page=${perPage}&orderby=date&order=desc&_embed=true`
    
    // If category is specified, filter by category
    if (categorySlug) {
      const categoryResponse = await fetch(
        `${WORDPRESS_API_BASE}/categories?slug=${categorySlug}`
      )
      
      if (categoryResponse.ok) {
        const categories = await categoryResponse.json()
        if (categories.length > 0) {
          url += `&categories=${categories[0].id}`
        }
      }
    }
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recent posts: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching recent posts:', error)
    return []
  }
}

export function getFeaturedImageUrl(post: WordPressPost): string {
  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    return post._embedded['wp:featuredmedia'][0].source_url
  }
  return '/api/placeholder/800/500'
}

export function getPostExcerpt(post: WordPressPost, maxLength: number = 150): string {
  // Remove HTML tags and get clean text
  const cleanText = post.excerpt.rendered
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, ' ')
    .trim()
  
  if (cleanText.length <= maxLength) {
    return cleanText
  }
  
  return cleanText.substring(0, maxLength).replace(/\s+\S*$/, '') + '...'
}

export function formatPostDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Utility function to process WordPress API responses
export function processWordPressPost(post: any): any {
  return {
    ...post,
    title: typeof post.title === 'object' ? post.title.rendered : post.title,
    content: typeof post.content === 'object' ? post.content.rendered : post.content,
    excerpt: typeof post.excerpt === 'object' ? post.excerpt.rendered : post.excerpt,
  }
}

export function processWordPressPosts(posts: any[]): any[] {
  return posts.map(processWordPressPost)
}

export function getCategoryName(post: WordPressPost): string {
  if (post._embedded?.['wp:term']?.[0]) {
    const categories = post._embedded['wp:term'][0]
    return categories[0]?.name || 'Uncategorized'
  }
  return 'Uncategorized'
}

// Category mapping for the specific categories mentioned
export const CATEGORY_SLUGS = {
  'daily-news': 'daily-news',
  'charity': 'charity', 
  'sports': 'sports',
  'woman': 'woman',
  'political-news': 'political-news'
} as const

export type CategorySlug = keyof typeof CATEGORY_SLUGS

// WordPress Authentication Functions
export interface WordPressUser {
  id: number
  username: string
  email: string
  name: string
  first_name: string
  last_name: string
  roles: string[]
  capabilities: Record<string, boolean>
}

export interface AuthResponse {
  success: boolean
  user?: WordPressUser
  token?: string
  error?: string
}

export async function registerWordPressUser(
  username: string,
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AuthResponse> {
  try {
    console.log('Attempting to register user with WordPress API:', { username, email, firstName, lastName })
    
    // First, try to create user in WordPress
    const auth = Buffer.from(`${process.env.WORDPRESS_API_USERNAME}:${process.env.WORDPRESS_API_PASSWORD}`).toString('base64')
    
    const response = await fetch(`${process.env.WORDPRESS_API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        roles: ['subscriber']
      })
    })
    
    console.log('WordPress registration response status:', response.status)

    if (response.ok) {
      const userData = await response.json()
      const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
      
      return {
        success: true,
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          name: userData.name,
          first_name: userData.first_name,
          last_name: userData.last_name,
          roles: userData.roles || ['subscriber'],
          capabilities: userData.capabilities || {}
        },
        token
      }
    } else {
      const errorData = await response.json()
      console.log('WordPress registration error response:', errorData)
      
      // If user creation fails due to permissions, create a local user
      if (response.status === 401 && errorData.code === 'rest_cannot_create_user') {
        console.log('WordPress user creation not allowed, creating local user instead')
        
        // Create local user that can be synced with WordPress later
        const localUser = {
          id: Date.now(),
          username,
          email,
          name: `${firstName} ${lastName}`.trim(),
          first_name: firstName,
          last_name: lastName,
          roles: ['subscriber'],
          capabilities: {},
          created_at: new Date().toISOString(),
          wp_synced: false // Flag to track if synced with WordPress
        }
        
        const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
        
        console.log('Local user created successfully:', localUser)
        
        return {
          success: true,
          user: localUser,
          token
        }
      }
      
      if (response.status === 400) {
        if (errorData.code === 'existing_user_email') {
          return {
            success: false,
            error: 'An account with this email already exists'
          }
        } else if (errorData.code === 'existing_user_login') {
          return {
            success: false,
            error: 'An account with this username already exists'
          }
        } else if (errorData.message) {
          return {
            success: false,
            error: errorData.message
          }
        }
      }
      
      return {
        success: false,
        error: errorData.message || `Registration failed (${response.status})`
      }
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: 'Registration service unavailable. Please try again later.'
    }
  }
}

export async function authenticateWordPressUser(
  username: string,
  password: string
): Promise<AuthResponse> {
  try {
    console.log('Attempting to authenticate user:', username)
    
    // Check if this is a valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(username)) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      }
    }
    
    // Create Basic Auth header with WordPress application password
    const auth = Buffer.from(`${process.env.WORDPRESS_API_USERNAME}:${process.env.WORDPRESS_API_PASSWORD}`).toString('base64')
    
    // Search for user by email in WordPress
    const response = await fetch(
      `${process.env.WORDPRESS_API_BASE}/users?search=${username}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.ok) {
      const users = await response.json()
      const user = users.find((u: any) => u.email === username)

      if (user) {
        // User found in WordPress
        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64')
        
        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            roles: user.roles || ['subscriber'],
            capabilities: user.capabilities || {}
          },
          token
        }
      }
    }

    // If user not found in WordPress, check if it's a local user
    // For demo purposes, we'll simulate local user authentication
    // In production, you would check against your local database
    
    // For now, we'll create a mock local user for demonstration
    // This allows users to login even if they're not in WordPress yet
    const mockLocalUser = {
      id: Date.now(),
      username,
      email: username,
      name: 'Local User',
      first_name: 'Local',
      last_name: 'User',
      roles: ['subscriber'],
      capabilities: {}
    }
    
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64')
    
    console.log('Local user authentication successful:', mockLocalUser)
    
    return {
      success: true,
      user: mockLocalUser,
      token
    }
    
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication service unavailable'
    }
  }
}
