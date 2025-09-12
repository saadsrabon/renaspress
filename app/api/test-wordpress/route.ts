import { NextRequest, NextResponse } from 'next/server'
import { testWordPressAPI } from '@/lib/wordpress-api'

export async function GET(request: NextRequest) {
  try {
    const result = await testWordPressAPI()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'WordPress API is accessible'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('WordPress API test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test WordPress API'
    }, { status: 500 })
  }
}
