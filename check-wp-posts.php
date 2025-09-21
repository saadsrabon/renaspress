<?php
/**
 * Check WordPress Posts Database
 * Run this to see if posts are actually being created
 */

require_once('wp-config.php');
require_once('wp-load.php');

echo "=== WordPress Posts Database Check ===\n";
echo "Checking recent posts in the database...\n\n";

// Get the 10 most recent posts
$recent_posts = get_posts(array(
    'numberposts' => 10,
    'post_status' => array('publish', 'draft', 'private'),
    'orderby' => 'date',
    'order' => 'DESC'
));

echo "Found " . count($recent_posts) . " recent posts:\n";
echo "=====================================\n";

foreach ($recent_posts as $post) {
    echo "ID: " . $post->ID . "\n";
    echo "Title: " . ($post->post_title ?: '[EMPTY TITLE]') . "\n";
    echo "Content: " . (strlen($post->post_content) > 0 ? substr($post->post_content, 0, 100) . '...' : '[EMPTY CONTENT]') . "\n";
    echo "Author: " . $post->post_author . "\n";
    echo "Status: " . $post->post_status . "\n";
    echo "Date: " . $post->post_date . "\n";
    echo "Type: " . $post->post_type . "\n";
    echo "---\n";
}

echo "\n=== Checking for API Test Posts ===\n";

// Look for posts created by our API tests
$api_test_posts = get_posts(array(
    'numberposts' => 5,
    'post_status' => array('publish', 'draft', 'private'),
    'meta_query' => array(
        'relation' => 'OR',
        array(
            'key' => 'post_title',
            'value' => 'API Test',
            'compare' => 'LIKE'
        )
    ),
    's' => 'API Test',
    'orderby' => 'date',
    'order' => 'DESC'
));

if ($api_test_posts) {
    echo "Found " . count($api_test_posts) . " API test posts:\n";
    foreach ($api_test_posts as $post) {
        echo "- ID: {$post->ID}, Title: '{$post->post_title}', Status: {$post->post_status}\n";
    }
} else {
    echo "No API test posts found.\n";
}

echo "\n=== Database Direct Query ===\n";

global $wpdb;

// Direct database query for recent posts
$db_posts = $wpdb->get_results("
    SELECT ID, post_title, post_content, post_status, post_author, post_date 
    FROM {$wpdb->posts} 
    WHERE post_type = 'post' 
    ORDER BY post_date DESC 
    LIMIT 5
");

echo "Direct database query results:\n";
foreach ($db_posts as $post) {
    echo "ID: {$post->ID}\n";
    echo "Title: " . ($post->post_title ?: '[EMPTY]') . "\n";
    echo "Content Length: " . strlen($post->post_content) . "\n";
    echo "Author: {$post->post_author}\n";
    echo "Status: {$post->post_status}\n";
    echo "Date: {$post->post_date}\n";
    echo "---\n";
}

echo "\n=== Check Current User Capabilities ===\n";

// Check current user (if any)
$current_user = wp_get_current_user();
if ($current_user->exists()) {
    echo "Current User: " . $current_user->display_name . " (ID: " . $current_user->ID . ")\n";
    echo "Roles: " . implode(', ', $current_user->roles) . "\n";
    echo "Can edit posts: " . (current_user_can('edit_posts') ? 'YES' : 'NO') . "\n";
    echo "Can publish posts: " . (current_user_can('publish_posts') ? 'YES' : 'NO') . "\n";
} else {
    echo "No current user logged in.\n";
}

echo "\n=== Active Plugins Check ===\n";

$active_plugins = get_option('active_plugins');
echo "Active plugins:\n";
foreach ($active_plugins as $plugin) {
    echo "- $plugin\n";
}

echo "\n=== WordPress Configuration ===\n";
echo "WordPress Version: " . get_bloginfo('version') . "\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Database Version: " . $wpdb->db_version() . "\n";
echo "WP_DEBUG: " . (defined('WP_DEBUG') && WP_DEBUG ? 'ON' : 'OFF') . "\n";
echo "WP_DEBUG_LOG: " . (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG ? 'ON' : 'OFF') . "\n";

echo "\n=== Test Complete ===\n";
?>

