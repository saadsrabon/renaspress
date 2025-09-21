// Test script to verify WordPress forum integration
// Run with: node test-wordpress-forum.js

const WORDPRESS_URL = 'https://renaspress.com';

async function testWordPressForum() {
  console.log('🧪 Testing WordPress Forum Integration...\n');

  try {
    // Test 1: Check if forum-topics endpoint exists
    console.log('1. Testing forum-topics endpoint...');
    const topicsResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/forum-topics`);
    console.log(`   Status: ${topicsResponse.status}`);
    
    if (topicsResponse.ok) {
      const topics = await topicsResponse.json();
      console.log(`   ✅ Found ${topics.length} forum topics`);
      if (topics.length > 0) {
        console.log(`   Sample topic: "${topics[0].title.rendered}"`);
      }
    } else {
      console.log('   ❌ Forum topics endpoint not found');
    }

    // Test 2: Check if forum categories exist
    console.log('\n2. Testing forum categories...');
    const categoriesResponse = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/forum_category`);
    console.log(`   Status: ${categoriesResponse.status}`);
    
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      console.log(`   ✅ Found ${categories.length} forum categories`);
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug})`);
      });
    } else {
      console.log('   ❌ Forum categories not found');
    }

    // Test 3: Check custom comment endpoint
    console.log('\n3. Testing custom comment endpoint...');
    const commentsResponse = await fetch(`${WORDPRESS_URL}/wp-json/forum/v1/comments`);
    console.log(`   Status: ${commentsResponse.status}`);
    
    if (commentsResponse.ok) {
      console.log('   ✅ Custom comment endpoint is working');
    } else {
      console.log('   ❌ Custom comment endpoint not found');
    }

    // Test 4: Test creating a comment (if topics exist)
    if (topicsResponse.ok) {
      const topics = await topicsResponse.json();
      if (topics.length > 0) {
        console.log('\n4. Testing comment creation...');
        const testComment = {
          topic_id: topics[0].id,
          content: 'This is a test comment from the integration test',
          author_name: 'Test User',
          is_anonymous: true
        };

        const createCommentResponse = await fetch(`${WORDPRESS_URL}/wp-json/forum/v1/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testComment)
        });

        console.log(`   Status: ${createCommentResponse.status}`);
        if (createCommentResponse.ok) {
          const result = await createCommentResponse.json();
          console.log('   ✅ Comment created successfully');
          console.log(`   Comment ID: ${result.comment_id}`);
        } else {
          const error = await createCommentResponse.json();
          console.log(`   ❌ Failed to create comment: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 WordPress Forum Integration Test Complete!');
    console.log('\nNext steps:');
    console.log('1. Make sure you have added the functions.php code to your WordPress theme');
    console.log('2. Create some forum topics in WordPress admin');
    console.log('3. Test the frontend at http://localhost:3000/en/forums');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWordPressForum();
