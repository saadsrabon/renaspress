<?php
/**
 * Test WordPress REST API without any plugins
 * This bypasses all plugins to test core WordPress functionality
 */

// Your JWT token - replace this
$jwt_token = 'YOUR_JWT_TOKEN_HERE';

echo "=== WordPress Core REST API Test (No Plugins) ===\n";
echo "This test will temporarily disable all plugins and test the core WordPress REST API.\n\n";

// Function to test the API
function test_wp_api($token) {
    $test_data = array(
        'title' => 'Core API Test - ' . date('Y-m-d H:i:s'),
        'content' => '<p>Testing WordPress core REST API without any plugins.</p>',
        'status' => 'draft'
    );
    
    echo "Testing with data: " . json_encode($test_data, JSON_PRETTY_PRINT) . "\n\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://renaspress.com/wp-json/wp/v2/posts');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($test_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json'
    ));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For testing only
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    echo "HTTP Status: $http_code\n";
    echo "cURL Error: " . ($curl_error ?: 'None') . "\n";
    echo "Response: $response\n\n";
    
    if ($response) {
        $data = json_decode($response, true);
        if ($data) {
            echo "Analysis:\n";
            echo "- Post ID: " . ($data['id'] ?? 'NULL') . "\n";
            echo "- Title: " . json_encode($data['title'] ?? 'NULL') . "\n";
            echo "- Status: " . ($data['status'] ?? 'NULL') . "\n";
            echo "- Author: " . ($data['author'] ?? 'NULL') . "\n";
            echo "- Content: " . (isset($data['content']) ? 'Present' : 'Missing') . "\n";
        }
    }
    
    return $response;
}

// Instructions
echo "INSTRUCTIONS:\n";
echo "1. Replace 'YOUR_JWT_TOKEN_HERE' with your actual JWT token\n";
echo "2. Temporarily rename your plugins folder: mv wp-content/plugins wp-content/plugins-disabled\n";
echo "3. Run this script: php test-wp-no-plugins.php\n";
echo "4. Restore plugins: mv wp-content/plugins-disabled wp-content/plugins\n";
echo "5. Compare results\n\n";

if ($jwt_token === 'YOUR_JWT_TOKEN_HERE') {
    echo "ERROR: Please replace 'YOUR_JWT_TOKEN_HERE' with your actual JWT token first!\n";
    exit;
}

echo "Running test...\n";
echo "================\n";

$result = test_wp_api($jwt_token);

echo "\n=== Test Complete ===\n";
echo "If this test shows the same null values, the issue is in WordPress core configuration.\n";
echo "If this test works properly, the issue is caused by a plugin conflict.\n";
?>

