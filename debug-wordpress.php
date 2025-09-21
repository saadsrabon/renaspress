<?php
// Debug script to check WordPress forum setup
// Upload this to your WordPress root directory and visit: yoursite.com/debug-wordpress.php

// Include WordPress
require_once('wp-config.php');
require_once('wp-load.php');

echo "<h1>WordPress Forum Debug</h1>";

// Check if custom post type exists
$post_types = get_post_types(array('public' => true), 'names');
echo "<h2>1. Custom Post Types</h2>";
if (in_array('forum_topic', $post_types)) {
    echo "✅ forum_topic post type exists<br>";
} else {
    echo "❌ forum_topic post type NOT found<br>";
    echo "Available post types: " . implode(', ', $post_types) . "<br>";
}

// Check if taxonomy exists
$taxonomies = get_taxonomies(array('public' => true), 'names');
echo "<h2>2. Custom Taxonomies</h2>";
if (in_array('forum_category', $taxonomies)) {
    echo "✅ forum_category taxonomy exists<br>";
} else {
    echo "❌ forum_category taxonomy NOT found<br>";
    echo "Available taxonomies: " . implode(', ', $taxonomies) . "<br>";
}

// Check REST API routes
echo "<h2>3. REST API Routes</h2>";
$routes = rest_get_server()->get_routes();
$forum_routes = array();
foreach ($routes as $route => $handlers) {
    if (strpos($route, 'forum') !== false || strpos($route, 'forum-topics') !== false) {
        $forum_routes[] = $route;
    }
}

if (!empty($forum_routes)) {
    echo "✅ Found forum-related routes:<br>";
    foreach ($forum_routes as $route) {
        echo "- " . $route . "<br>";
    }
} else {
    echo "❌ No forum-related routes found<br>";
}

// Test specific endpoints
echo "<h2>4. Testing Specific Endpoints</h2>";

// Test forum-topics endpoint
$test_url = home_url('/wp-json/wp/v2/forum-topics');
echo "Testing: " . $test_url . "<br>";
$response = wp_remote_get($test_url);
if (is_wp_error($response)) {
    echo "❌ Error: " . $response->get_error_message() . "<br>";
} else {
    $status = wp_remote_retrieve_response_code($response);
    echo "Status: " . $status . "<br>";
    if ($status === 200) {
        echo "✅ forum-topics endpoint working<br>";
    } else {
        echo "❌ forum-topics endpoint not working<br>";
    }
}

// Test custom comment endpoint
$test_url = home_url('/wp-json/forum/v1/comments');
echo "Testing: " . $test_url . "<br>";
$response = wp_remote_get($test_url);
if (is_wp_error($response)) {
    echo "❌ Error: " . $response->get_error_message() . "<br>";
} else {
    $status = wp_remote_retrieve_response_code($response);
    echo "Status: " . $status . "<br>";
    if ($status === 200 || $status === 405) { // 405 is OK for GET on POST-only endpoint
        echo "✅ Custom comment endpoint exists<br>";
    } else {
        echo "❌ Custom comment endpoint not working<br>";
    }
}

// Check if functions are defined
echo "<h2>5. Function Definitions</h2>";
$functions_to_check = array(
    'create_forum_topic_post_type',
    'create_forum_category_taxonomy',
    'register_forum_comment_endpoints',
    'create_forum_comment',
    'get_forum_topic_comments'
);

foreach ($functions_to_check as $func) {
    if (function_exists($func)) {
        echo "✅ $func is defined<br>";
    } else {
        echo "❌ $func is NOT defined<br>";
    }
}

// Check if actions are hooked
echo "<h2>6. Action Hooks</h2>";
global $wp_filter;
$actions_to_check = array('init', 'rest_api_init', 'add_meta_boxes', 'save_post');

foreach ($actions_to_check as $action) {
    if (isset($wp_filter[$action])) {
        $count = count($wp_filter[$action]->callbacks);
        echo "✅ $action has $count callbacks<br>";
    } else {
        echo "❌ $action has no callbacks<br>";
    }
}

echo "<h2>7. WordPress Version</h2>";
echo "WordPress Version: " . get_bloginfo('version') . "<br>";

echo "<h2>8. Permalink Structure</h2>";
echo "Permalink Structure: " . get_option('permalink_structure') . "<br>";
echo "REST API Base: " . rest_url() . "<br>";

?>
