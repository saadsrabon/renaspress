<?php
/**
 * Plugin Name: Minimal WordPress API Test
 * Description: Minimal plugin to test WordPress REST API without interference
 * Version: 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class MinimalWordPressAPITest {
    
    public function __construct() {
        add_action('rest_api_init', array($this, 'init_rest_api'));
    }
    
    public function init_rest_api() {
        // Handle CORS only
        add_filter('rest_pre_dispatch', array($this, 'handle_rest_cors'), 10, 3);
        
        // Add debugging for post creation
        add_action('rest_insert_post', array($this, 'debug_post_creation'), 10, 3);
        
        // JWT Auth whitelist
        add_filter('jwt_auth_whitelist', array($this, 'jwt_whitelist'));
    }
    
    // Debug post creation
    public function debug_post_creation($post, $request, $creating) {
        if ($creating) {
            error_log('=== MINIMAL PLUGIN: Post Created Successfully ===');
            error_log('Post ID: ' . $post->ID);
            error_log('Post Title: ' . $post->post_title);
            error_log('Post Content Length: ' . strlen($post->post_content));
            error_log('Post Status: ' . $post->post_status);
            error_log('Post Author: ' . $post->post_author);
            error_log('===============================================');
        }
    }
    
    // Handle CORS for your Next.js frontend
    public function handle_rest_cors($response, $handler, $request) {
        $origin = get_http_origin();
        $allowed_origins = array(
            'http://localhost:3000',
            'https://renaspress.com',
            'https://your-nextjs-app.vercel.app'
        );
        
        if (in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
            header('Access-Control-Allow-Credentials: true');
        }
        
        if ($request->get_method() === 'OPTIONS') {
            return new WP_REST_Response(null, 200);
        }
        
        return $response;
    }
    
    // JWT Auth whitelist
    public function jwt_whitelist($endpoints) {
        return array(
            '/wp-json/wp/v2/posts',
            '/wp-json/wp/v2/posts/*',
            '/wp-json/wp/v2/users/me',
            '/wp-json/wp/v2/media',
            '/wp-json/wp/v2/media/*',
        );
    }
}

// Initialize the minimal plugin
new MinimalWordPressAPITest();
?>
