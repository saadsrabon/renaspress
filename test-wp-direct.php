<?php
/**
 * Direct WordPress REST API Test
 * This bypasses all plugins and tests the core WordPress REST API
 */

// WordPress JWT Token - replace with your actual token
$jwt_token = 'YOUR_JWT_TOKEN_HERE'; // Get this from your browser localStorage

// Test data
$test_post = array(
    'title' => 'Direct API Test - ' . date('Y-m-d H:i:s'),
    'content' => '<p>This is a test post created directly via WordPress REST API to isolate the issue.</p>',
    'status' => 'draft'
);

echo "=== WordPress REST API Direct Test ===\n";
echo "Testing URL: https://renaspress.com/wp-json/wp/v2/posts\n";
echo "Post Data: " . json_encode($test_post, JSON_PRETTY_PRINT) . "\n";
echo "==========================================\n\n";

// Test 1: Validate JWT Token
echo "1. Testing JWT Token validation...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://renaspress.com/wp-json/jwt-auth/v1/token/validate');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer ' . $jwt_token,
    'Content-Type: application/json'
));

$token_response = curl_exec($ch);
$token_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Token validation HTTP Code: $token_http_code\n";
echo "Token validation response: $token_response\n\n";

// Test 2: Get current user info
echo "2. Testing user info retrieval...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://renaspress.com/wp-json/wp/v2/users/me');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer ' . $jwt_token,
    'Content-Type: application/json'
));

$user_response = curl_exec($ch);
$user_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "User info HTTP Code: $user_http_code\n";
echo "User info response: $user_response\n\n";

// Test 3: Create post via WordPress REST API
echo "3. Testing post creation...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://renaspress.com/wp-json/wp/v2/posts');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($test_post));
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer ' . $jwt_token,
    'Content-Type: application/json'
));

$post_response = curl_exec($ch);
$post_http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

echo "Post creation HTTP Code: $post_http_code\n";
echo "cURL Error: " . ($curl_error ?: 'None') . "\n";
echo "Post creation response: $post_response\n\n";

// Test 4: Parse the response
if ($post_response) {
    $post_data = json_decode($post_response, true);
    if ($post_data) {
        echo "4. Analyzing response structure...\n";
        echo "Post ID: " . ($post_data['id'] ?? 'NULL') . "\n";
        echo "Post Title: " . json_encode($post_data['title'] ?? 'NULL') . "\n";
        echo "Post Status: " . ($post_data['status'] ?? 'NULL') . "\n";
        echo "Post Author: " . ($post_data['author'] ?? 'NULL') . "\n";
        echo "Response keys: " . implode(', ', array_keys($post_data)) . "\n\n";
        
        // Check for specific issues
        if (isset($post_data['id']) && $post_data['id'] === null) {
            echo "⚠️  WARNING: Post ID is null - this indicates WordPress accepted the request but didn't create the post properly\n";
        }
        
        if (isset($post_data['title']) && (
            $post_data['title'] === null || 
            (is_array($post_data['title']) && empty($post_data['title']['rendered']))
        )) {
            echo "⚠️  WARNING: Post title is null or empty in response\n";
        }
        
        if (isset($post_data['author']) && $post_data['author'] === 0) {
            echo "⚠️  WARNING: Post author is 0 - this might indicate authentication issues\n";
        }
    } else {
        echo "4. Failed to parse JSON response\n";
        echo "Raw response: $post_response\n";
    }
}

echo "\n=== Test Complete ===\n";
echo "Instructions:\n";
echo "1. Replace 'YOUR_JWT_TOKEN_HERE' with your actual JWT token from localStorage\n";
echo "2. Run this script: php test-wp-direct.php\n";
echo "3. Check the output for any errors or warnings\n";
echo "4. Compare the response with what you're getting from Next.js\n";
?>

