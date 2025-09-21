<?php
/**
 * Plugin Name: Renas Forum
 * Description: Custom forum functionality for Renas Press
 * Version: 1.0
 * Author: Renas Press
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// 1. Create Custom Post Type for Forum Topics
function renas_create_forum_topic_post_type() {
    register_post_type('forum_topic', array(
        'labels' => array(
            'name' => 'Forum Topics',
            'singular_name' => 'Forum Topic',
            'add_new' => 'Add New Topic',
            'add_new_item' => 'Add New Forum Topic',
            'edit_item' => 'Edit Forum Topic',
            'new_item' => 'New Forum Topic',
            'view_item' => 'View Forum Topic',
            'search_items' => 'Search Forum Topics',
            'not_found' => 'No forum topics found',
            'not_found_in_trash' => 'No forum topics found in trash',
        ),
        'public' => true,
        'has_archive' => true,
        'supports' => array('title', 'editor', 'author', 'comments', 'custom-fields'),
        'show_in_rest' => true,
        'rest_base' => 'forum-topics',
        'menu_icon' => 'dashicons-format-chat',
        'menu_position' => 5,
    ));
}
add_action('init', 'renas_create_forum_topic_post_type');

// 2. Create Custom Taxonomy for Forum Categories
function renas_create_forum_category_taxonomy() {
    register_taxonomy('forum_category', 'forum_topic', array(
        'labels' => array(
            'name' => 'Forum Categories',
            'singular_name' => 'Forum Category',
            'search_items' => 'Search Categories',
            'all_items' => 'All Categories',
            'parent_item' => 'Parent Category',
            'parent_item_colon' => 'Parent Category:',
            'edit_item' => 'Edit Category',
            'update_item' => 'Update Category',
            'add_new_item' => 'Add New Category',
            'new_item_name' => 'New Category Name',
            'menu_name' => 'Categories',
        ),
        'hierarchical' => true,
        'public' => true,
        'show_in_rest' => true,
        'show_admin_column' => true,
    ));
}
add_action('init', 'renas_create_forum_category_taxonomy');

// 3. Enable Comments for Forum Topics
function renas_enable_forum_comments() {
    add_post_type_support('forum_topic', 'comments');
}
add_action('init', 'renas_enable_forum_comments');

// 4. Add Reply Count to Forum Topics
function renas_add_reply_count_to_forum_topics($data, $post, $request) {
    if ($post->post_type === 'forum_topic') {
        $data['reply_count'] = get_comments_number($post->ID);
        
        // Get last reply date
        $comments = get_comments(array(
            'post_id' => $post->ID,
            'status' => 'approve',
            'number' => 1,
            'orderby' => 'comment_date',
            'order' => 'DESC'
        ));
        
        if (!empty($comments)) {
            $data['last_reply_at'] = $comments[0]->comment_date;
        }
        
        // Get topic status
        $data['status'] = get_post_meta($post->ID, '_forum_topic_status', true) ?: 'active';
    }
    
    return $data;
}
add_filter('rest_prepare_forum_topic', 'renas_add_reply_count_to_forum_topics', 10, 3);

// 5. Create Custom REST API Endpoints for Comments
function renas_register_forum_comment_endpoints() {
    // Create comment endpoint
    register_rest_route('forum/v1', '/comments', array(
        'methods' => 'POST',
        'callback' => 'renas_create_forum_comment',
        'permission_callback' => '__return_true',
        'args' => array(
            'topic_id' => array(
                'required' => true,
                'type' => 'integer',
                'sanitize_callback' => 'absint',
            ),
            'content' => array(
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
            'author_name' => array(
                'required' => false,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'is_anonymous' => array(
                'required' => false,
                'type' => 'boolean',
                'default' => false,
            ),
        ),
    ));
    
    // Get comments for a topic
    register_rest_route('forum/v1', '/topics/(?P<id>\d+)/comments', array(
        'methods' => 'GET',
        'callback' => 'renas_get_forum_topic_comments',
        'permission_callback' => '__return_true',
        'args' => array(
            'id' => array(
                'required' => true,
                'type' => 'integer',
                'sanitize_callback' => 'absint',
            ),
        ),
    ));
}
add_action('rest_api_init', 'renas_register_forum_comment_endpoints');

function renas_create_forum_comment($request) {
    $topic_id = $request->get_param('topic_id');
    $content = $request->get_param('content');
    $author_name = $request->get_param('author_name');
    $is_anonymous = $request->get_param('is_anonymous');

    // Verify topic exists
    $topic = get_post($topic_id);
    if (!$topic || $topic->post_type !== 'forum_topic') {
        return new WP_Error('invalid_topic', 'Invalid topic ID', array('status' => 400));
    }

    // Create comment
    $comment_data = array(
        'comment_post_ID' => $topic_id,
        'comment_content' => $content,
        'comment_author' => $is_anonymous ? $author_name : 'Logged-in User',
        'comment_author_email' => $is_anonymous ? '' : 'user@example.com',
        'comment_approved' => 1,
        'comment_type' => 'comment',
        'comment_meta' => array(
            'is_anonymous' => $is_anonymous ? '1' : '0',
        ),
    );

    $comment_id = wp_insert_comment($comment_data);

    if ($comment_id) {
        return array(
            'success' => true,
            'comment_id' => $comment_id,
            'comment' => array(
                'id' => $comment_id,
                'topic_id' => $topic_id,
                'content' => $content,
                'author_name' => $is_anonymous ? $author_name : 'Logged-in User',
                'is_anonymous' => $is_anonymous,
                'created_at' => current_time('mysql'),
            )
        );
    } else {
        return new WP_Error('comment_creation_failed', 'Failed to create comment', array('status' => 500));
    }
}

function renas_get_forum_topic_comments($request) {
    $topic_id = $request->get_param('id');
    
    $comments = get_comments(array(
        'post_id' => $topic_id,
        'status' => 'approve',
        'orderby' => 'comment_date',
        'order' => 'ASC'
    ));
    
    $formatted_comments = array();
    foreach ($comments as $comment) {
        $is_anonymous = get_comment_meta($comment->comment_ID, 'is_anonymous', true) === '1';
        
        $formatted_comments[] = array(
            'id' => $comment->comment_ID,
            'topic_id' => $topic_id,
            'content' => $comment->comment_content,
            'author_name' => $comment->comment_author,
            'is_anonymous' => $is_anonymous,
            'created_at' => $comment->comment_date,
        );
    }
    
    return $formatted_comments;
}

// 6. Add CORS headers
function renas_add_cors_http_header() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
}
add_action('init', 'renas_add_cors_http_header');

// 7. Create default forum categories
function renas_create_default_forum_categories() {
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
add_action('init', 'renas_create_default_forum_categories');

// 8. Flush rewrite rules on activation
function renas_forum_activate() {
    renas_create_forum_topic_post_type();
    renas_create_forum_category_taxonomy();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'renas_forum_activate');

// 9. Flush rewrite rules on deactivation
function renas_forum_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'renas_forum_deactivate');
?>



