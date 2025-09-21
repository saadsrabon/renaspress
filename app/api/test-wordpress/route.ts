import { NextRequest, NextResponse } from 'next/server'

// Simple WordPress API test endpoint
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Test 1: Validate token
    console.log('=== Testing JWT Token ===')
    const tokenValidation = await fetch('https://renaspress.com/wp-json/jwt-auth/v1/token/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    const tokenResult = await tokenValidation.json()
    console.log('Token validation:', tokenResult)
    
    if (!tokenValidation.ok) {
      return NextResponse.json({
        error: 'Invalid token',
        tokenValidation: tokenResult
      }, { status: 401 })
    }
    
    // Test 2: Get user info
    console.log('=== Testing User Info ===')
    const userResponse = await fetch('https://renaspress.com/wp-json/wp/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    const userData = await userResponse.json()
    console.log('User data:', userData)
    
    if (!userResponse.ok) {
      return NextResponse.json({
        error: 'Cannot get user info',
        userData
      }, { status: 403 })
    }
    
    // Test 3: Create simple post
    console.log('=== Testing Post Creation ===')
    const simplePost = {
      title: `API Test ${new Date().toISOString()}`,
      content: '<p>This is a simple test post to debug the WordPress API issue.</p>',
      status: 'draft'
    }
    
    console.log('Sending post data:', simplePost)
    
    const postResponse = await fetch('https://renaspress.com/wp-json/wp/v2/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simplePost),
    })
    
    const postResult = await postResponse.json()
    console.log('Post response status:', postResponse.status)
    console.log('Post response headers:', Object.fromEntries(postResponse.headers.entries()))
    console.log('Post result:', postResult)
    
    return NextResponse.json({
      success: true,
      tokenValidation: {
        status: tokenValidation.status,
        valid: tokenValidation.ok,
        data: tokenResult
      },
      userInfo: {
        status: userResponse.status,
        valid: userResponse.ok,
        data: userData
      },
      postCreation: {
        status: postResponse.status,
        success: postResponse.ok,
        data: postResult
      },
      analysis: {
        tokenWorking: tokenValidation.ok,
        userInfoWorking: userResponse.ok,
        postCreationWorking: postResponse.ok,
        postHasId: postResult?.id ? true : false,
        postHasTitle: postResult?.title ? true : false,
        postAuthor: postResult?.author || 'missing'
      }
    })
    
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error },
      { status: 500 }
    )
  }
}