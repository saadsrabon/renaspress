<?php
// Simple WordPress test
// Upload this to your WordPress root and visit: yoursite.com/simple-wp-test.php

// Include WordPress
require_once('wp-config.php');
require_once('wp-load.php');

echo "<h1>WordPress Basic Test</h1>";

// Test 1: Check if WordPress loaded
echo "<h2>1. WordPress Status</h2>";
if (function_exists('get_bloginfo')) {
    echo "✅ WordPress loaded successfully<br>";
    echo "Site URL: " . get_bloginfo('url') . "<br>";
    echo "WordPress Version: " . get_bloginfo('version') . "<br>";
} else {
    echo "❌ WordPress failed to load<br>";
    exit;
}

// Test 2: Check REST API
echo "<h2>2. REST API Test</h2>";
$rest_url = rest_url('wp/v2/posts');
echo "REST URL: " . $rest_url . "<br>";

$response = wp_remote_get($rest_url);
if (is_wp_error($response)) {
    echo "❌ REST API Error: " . $response->get_error_message() . "<br>";
} else {
    $status = wp_remote_retrieve_response_code($response);
    echo "REST API Status: " . $status . "<br>";
    if ($status === 200) {
        echo "✅ REST API is working<br>";
    } else {
        echo "❌ REST API not working<br>";
    }
}

// Test 3: Check if we can register post types
echo "<h2>3. Post Type Registration Test</h2>";
if (function_exists('register_post_type')) {
    echo "✅ register_post_type function exists<br>";
    
    // Try to register a test post type
    $test_post_type = register_post_type('test_forum', array(
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'test-forum',
        'labels' => array('name' => 'Test Forum')
    ));
    
    if ($test_post_type) {
        echo "✅ Successfully registered test post type<br>";
    } else {
        echo "❌ Failed to register test post type<br>";
    }
} else {
    echo "❌ register_post_type function not found<br>";
}

// Test 4: Check current post types
echo "<h2>4. Current Post Types</h2>";
$post_types = get_post_types(array('public' => true), 'names');
echo "Available post types: " . implode(', ', $post_types) . "<br>";

// Test 5: Check if forum_topic exists
if (in_array('forum_topic', $post_types)) {
    echo "✅ forum_topic post type exists<br>";
} else {
    echo "❌ forum_topic post type NOT found<br>";
}

// Test 6: Check REST routes
echo "<h2>5. REST Routes Test</h2>";
$routes = rest_get_server()->get_routes();
$forum_routes = array();
foreach ($routes as $route => $handlers) {
    if (strpos($route, 'forum') !== false) {
        $forum_routes[] = $route;
    }
}

if (!empty($forum_routes)) {
    echo "✅ Found forum routes:<br>";
    foreach ($forum_routes as $route) {
        echo "- " . $route . "<br>";
    }
} else {
    echo "❌ No forum routes found<br>";
}

// Test 7: Check if functions are defined
echo "<h2>6. Function Definitions</h2>";
$functions = array(
    'create_forum_topic_post_type',
    'create_forum_category_taxonomy',
    'register_forum_comment_endpoints'
);

foreach ($functions as $func) {
    if (function_exists($func)) {
        echo "✅ $func is defined<br>";
    } else {
        echo "❌ $func is NOT defined<br>";
    }
}

echo "<h2>7. Next Steps</h2>";
echo "If you see errors above, try these solutions:<br>";
echo "1. Make sure the forum code is in your active theme's functions.php<br>";
echo "2. Go to Settings → Permalinks → Save Changes<br>";
echo "3. Check WordPress error logs for PHP errors<br>";
echo "4. Try the plugin approach instead of functions.php<br>";

?>



