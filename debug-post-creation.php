<?php
/**
 * WordPress Post Creation Debug Script
 * Run this directly on your WordPress server to test post creation
 */

// Include WordPress
require_once('wp-config.php');
require_once('wp-load.php');

// Test post creation with different methods
function test_post_creation() {
    echo "=== WordPress Post Creation Debug ===\n";
    
    // Test 1: Direct wp_insert_post
    echo "\n1. Testing direct wp_insert_post...\n";
    
    $post_data = array(
        'post_title' => 'Test Post - Direct Insert ' . date('Y-m-d H:i:s'),
        'post_content' => 'This is test content created via wp_insert_post.',
        'post_status' => 'draft',
        'post_author' => 1, // Admin user
        'post_type' => 'post'
    );
    
    $post_id = wp_insert_post($post_data, true);
    
    if (is_wp_error($post_id)) {
        echo "ERROR: " . $post_id->get_error_message() . "\n";
    } else {
        echo "SUCCESS: Post created with ID: $post_id\n";
        
        // Fetch the created post
        $created_post = get_post($post_id);
        echo "Title: " . $created_post->post_title . "\n";
        echo "Content: " . substr($created_post->post_content, 0, 50) . "...\n";
        echo "Status: " . $created_post->post_status . "\n";
        echo "Author: " . $created_post->post_author . "\n";
    }
    
    // Test 2: REST API simulation
    echo "\n2. Testing REST API data structure...\n";
    
    // Simulate what the REST API receives
    $rest_data = array(
        'title' => 'Test Post - REST API Simulation ' . date('Y-m-d H:i:s'),
        'content' => 'This is test content via REST API simulation.',
        'status' => 'draft'
    );
    
    // Convert REST API format to wp_insert_post format
    $converted_data = array(
        'post_title' => $rest_data['title'],
        'post_content' => $rest_data['content'],
        'post_status' => $rest_data['status'],
        'post_author' => 1,
        'post_type' => 'post'
    );
    
    $rest_post_id = wp_insert_post($converted_data, true);
    
    if (is_wp_error($rest_post_id)) {
        echo "ERROR: " . $rest_post_id->get_error_message() . "\n";
    } else {
        echo "SUCCESS: REST simulation post created with ID: $rest_post_id\n";
    }
    
    // Test 3: Check user capabilities
    echo "\n3. Checking user capabilities...\n";
    
    $user = get_user_by('id', 1);
    if ($user) {
        echo "User: " . $user->display_name . " (ID: " . $user->ID . ")\n";
        echo "Roles: " . implode(', ', $user->roles) . "\n";
        echo "Can edit posts: " . (user_can($user, 'edit_posts') ? 'YES' : 'NO') . "\n";
        echo "Can publish posts: " . (user_can($user, 'publish_posts') ? 'YES' : 'NO') . "\n";
        echo "Can upload files: " . (user_can($user, 'upload_files') ? 'YES' : 'NO') . "\n";
    }
    
    // Test 4: Check active plugins
    echo "\n4. Checking active plugins...\n";
    
    $active_plugins = get_option('active_plugins');
    foreach ($active_plugins as $plugin) {
        if (strpos($plugin, 'next-js') !== false || strpos($plugin, 'renas') !== false) {
            echo "Found relevant plugin: $plugin\n";
        }
    }
    
    // Test 5: WordPress REST API endpoint test
    echo "\n5. Testing WordPress REST API endpoint...\n";
    
    $api_url = get_rest_url(null, 'wp/v2/posts');
    echo "REST API URL: $api_url\n";
    
    // Test if REST API is accessible
    $response = wp_remote_get($api_url);
    if (is_wp_error($response)) {
        echo "REST API ERROR: " . $response->get_error_message() . "\n";
    } else {
        $code = wp_remote_retrieve_response_code($response);
        echo "REST API Response Code: $code\n";
    }
    
    echo "\n=== Debug Complete ===\n";
}

// Run the test
test_post_creation();
?>

