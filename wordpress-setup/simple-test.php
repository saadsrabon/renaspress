<?php
// Simple test version - add this to your functions.php FIRST
// This is a minimal version to test if the basic setup works

// 1. Create Custom Post Type for Forum Topics (Simplified)
function create_forum_topic_post_type_simple() {
    register_post_type('forum_topic', array(
        'labels' => array(
            'name' => 'Forum Topics',
            'singular_name' => 'Forum Topic',
        ),
        'public' => true,
        'has_archive' => true,
        'supports' => array('title', 'editor', 'author', 'comments'),
        'show_in_rest' => true, // This is crucial for REST API
        'rest_base' => 'forum-topics',
        'menu_icon' => 'dashicons-format-chat',
        'menu_position' => 5,
    ));
}
add_action('init', 'create_forum_topic_post_type_simple');

// 2. Create Custom Taxonomy for Forum Categories (Simplified)
function create_forum_category_taxonomy_simple() {
    register_taxonomy('forum_category', 'forum_topic', array(
        'labels' => array(
            'name' => 'Forum Categories',
            'singular_name' => 'Forum Category',
        ),
        'hierarchical' => true,
        'public' => true,
        'show_in_rest' => true, // This is crucial for REST API
        'show_admin_column' => true,
    ));
}
add_action('init', 'create_forum_category_taxonomy_simple');

// 3. Enable Comments for Forum Topics
function enable_forum_comments_simple() {
    add_post_type_support('forum_topic', 'comments');
}
add_action('init', 'enable_forum_comments_simple');

// 4. Create default forum categories
function create_default_forum_categories_simple() {
    $categories = array(
        'general' => 'General Discussion',
        'political' => 'Political',
        'economics' => 'Economics',
        'sports' => 'Sports',
        'social' => 'Social',
        'technology' => 'Technology'
    );
    
    foreach ($categories as $slug => $name) {
        if (!term_exists($slug, 'forum_category')) {
            wp_insert_term($name, 'forum_category', array('slug' => $slug));
        }
    }
}
add_action('init', 'create_default_forum_categories_simple');

// 5. Add CORS headers
function add_cors_http_header_simple() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
}
add_action('init', 'add_cors_http_header_simple');

// 6. Simple comment endpoint
function register_simple_comment_endpoint() {
    register_rest_route('forum/v1', '/comments', array(
        'methods' => 'POST',
        'callback' => 'create_simple_comment',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'register_simple_comment_endpoint');

function create_simple_comment($request) {
    return array(
        'success' => true,
        'message' => 'Comment endpoint is working!'
    );
}
?>



