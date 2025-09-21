<?php
/**
 * Check WordPress Debug Logs
 */

echo "=== WordPress Debug Log Check ===\n";

// Common log file locations
$log_files = array(
    'wp-content/debug.log',
    'wp-content/uploads/debug.log', 
    '/tmp/wordpress-debug.log',
    'error_log',
    'wp-content/error_log'
);

foreach ($log_files as $log_file) {
    if (file_exists($log_file)) {
        echo "\nFound log file: $log_file\n";
        echo "File size: " . filesize($log_file) . " bytes\n";
        echo "Last modified: " . date('Y-m-d H:i:s', filemtime($log_file)) . "\n";
        
        // Get last 50 lines
        $lines = file($log_file);
        if ($lines) {
            $recent_lines = array_slice($lines, -50);
            echo "\nLast 50 lines:\n";
            echo "================\n";
            foreach ($recent_lines as $line) {
                echo $line;
            }
        }
        echo "\n" . str_repeat('=', 50) . "\n";
    }
}

// Check if any log files exist
$found_logs = false;
foreach ($log_files as $log_file) {
    if (file_exists($log_file)) {
        $found_logs = true;
        break;
    }
}

if (!$found_logs) {
    echo "\nNo debug log files found in common locations.\n";
    echo "Debug logging might be disabled.\n";
    echo "\nTo enable debug logging, add this to wp-config.php:\n";
    echo "define('WP_DEBUG', true);\n";
    echo "define('WP_DEBUG_LOG', true);\n";
    echo "define('WP_DEBUG_DISPLAY', false);\n";
}

echo "\n=== Log Check Complete ===\n";
?>

