<?php
/**
 * Plugin Name: Next.js API Integration with Media Support
 * Description: Complete CRUD API functionality with Bunny CDN integration for Next.js frontend
 * Version: 2.0.0
 * Author: Saad Srabon
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class NextJSAPIIntegration {
    
    private $bunny_api_key;
    private $bunny_storage_zone;
    private $bunny_cdn_url;
    
    public function __construct() {
        // Bunny CDN Configuration - Add these to wp-config.php or set here
        $this->bunny_api_key = defined('BUNNY_API_KEY') ? BUNNY_API_KEY : '';
        $this->bunny_storage_zone = defined('BUNNY_STORAGE_ZONE') ? BUNNY_STORAGE_ZONE : '';
        $this->bunny_cdn_url = defined('BUNNY_CDN_URL') ? BUNNY_CDN_URL : '';
        
        add_action('init', array($this, 'init'));
        add_action('rest_api_init', array($this, 'init_rest_api'));
        register_activation_hook(__FILE__, array($this, 'activate'));
    }
    
    public function init() {
        // Ensure users can create posts and upload files
        $roles = array('subscriber', 'contributor', 'author');
        foreach ($roles as $role_name) {
            $role = get_role($role_name);
            if ($role) {
                $role->add_cap('edit_posts');
                $role->add_cap('publish_posts');
                $role->add_cap('delete_posts');
                $role->add_cap('upload_files');
                $role->add_cap('edit_published_posts');
                $role->add_cap('delete_published_posts');
            }
        }
    }
    
    public function init_rest_api() {
        // Handle CORS
        add_filter('rest_pre_dispatch', array($this, 'handle_rest_cors'), 10, 3);
        
        // Register custom endpoints
        $this->register_custom_endpoints();
        
        // Add custom fields to REST API - TEMPORARILY DISABLED FOR DEBUGGING
        // $this->add_custom_fields();
        
        // Add filters
        add_filter('jwt_auth_whitelist', array($this, 'jwt_whitelist'));
        
        // IMPORTANT: Comment out the validation filter that's causing issues
        // add_filter('rest_pre_insert_post', array($this, 'validate_post_creation'), 10, 2);
        
        // Enable media upload for authenticated users
        add_filter('rest_pre_dispatch', array($this, 'enable_media_upload'), 10, 3);
        
        // Add debugging for post creation
        add_action('rest_insert_post', array($this, 'debug_post_creation'), 10, 3);
        add_filter('rest_prepare_post', array($this, 'debug_post_response'), 10, 3);
    }
    
    // Debug post creation
    public function debug_post_creation($post, $request, $creating) {
        if ($creating) {
            error_log('=== Post Created Successfully ===');
            error_log('Post ID: ' . $post->ID);
            error_log('Post Title: ' . $post->post_title);
            error_log('Post Content Length: ' . strlen($post->post_content));
            error_log('Post Status: ' . $post->post_status);
            error_log('Post Author: ' . $post->post_author);
            error_log('================================');
        }
    }
    
    // Debug post response
    public function debug_post_response($response, $post, $request) {
        if ($request->get_method() === 'POST') {
            error_log('=== Post Response Debug ===');
            error_log('Response ID: ' . ($response->data['id'] ?? 'NULL'));
            error_log('Response Title: ' . print_r($response->data['title'] ?? 'NULL', true));
            error_log('Response Status: ' . ($response->data['status'] ?? 'NULL'));
            error_log('Response Keys: ' . implode(', ', array_keys($response->data)));
            error_log('===========================');
        }
        return $response;
    }
    
    // Handle CORS for your Next.js frontend
    public function handle_rest_cors($response, $handler, $request) {
        $origin = get_http_origin();
        $allowed_origins = array(
            'http://localhost:3000',
            'https://yourdomain.com',
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
    
    // Enable media upload for authenticated users
    public function enable_media_upload($response, $handler, $request) {
        $route = $request->get_route();
        
        if (strpos($route, '/wp/v2/media') === 0 && is_user_logged_in()) {
            // Allow media uploads for authenticated users
            return $response;
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
            '/wp-json/custom/v1/user',
            '/wp-json/custom/v1/user/posts',
            '/wp-json/custom/v1/posts/*',
            '/wp-json/custom/v1/media/bunny-upload',
        );
    }
    
    // Register custom endpoints
    public function register_custom_endpoints() {
        // User info endpoint
        register_rest_route('custom/v1', '/user', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_current_user_info'),
            'permission_callback' => array($this, 'check_authentication')
        ));
        
        // User's posts endpoint
        register_rest_route('custom/v1', '/user/posts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_user_posts'),
            'permission_callback' => array($this, 'check_authentication')
        ));
        
        // Enhanced post CRUD endpoints
        register_rest_route('custom/v1', '/posts/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_post'),
            'permission_callback' => array($this, 'check_post_ownership'),
            'args' => array(
                'id' => array('validate_callback' => function($param) {
                    return is_numeric($param);
                })
            )
        ));
        
        register_rest_route('custom/v1', '/posts/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_post'),
            'permission_callback' => array($this, 'check_post_ownership'),
            'args' => array(
                'id' => array('validate_callback' => function($param) {
                    return is_numeric($param);
                })
            )
        ));
        
        // Bunny CDN upload endpoint
        register_rest_route('custom/v1', '/media/bunny-upload', array(
            'methods' => 'POST',
            'callback' => array($this, 'upload_to_bunny_cdn'),
            'permission_callback' => array($this, 'check_authentication')
        ));
        
        // Get media library
        register_rest_route('custom/v1', '/media', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_user_media'),
            'permission_callback' => array($this, 'check_authentication')
        ));
    }
    
    // Authentication check
    public function check_authentication() {
        return is_user_logged_in();
    }
    
    // Check post ownership
    public function check_post_ownership($request) {
        $post_id = $request->get_param('id');
        $post = get_post($post_id);
        $current_user_id = get_current_user_id();
        
        if (!$post) {
            return false;
        }
        
        // Allow if user owns the post or is admin
        return ($post->post_author == $current_user_id) || current_user_can('manage_options');
    }
    
    // Get current user info
    public function get_current_user_info($request) {
        $current_user = wp_get_current_user();
        
        if (!$current_user->exists()) {
            return new WP_Error('no_user', 'No user found', array('status' => 404));
        }
        
        return array(
            'id' => $current_user->ID,
            'username' => $current_user->user_login,
            'email' => $current_user->user_email,
            'display_name' => $current_user->display_name,
            'roles' => $current_user->roles,
            'capabilities' => array(
                'can_upload_files' => current_user_can('upload_files'),
                'can_edit_posts' => current_user_can('edit_posts'),
                'can_publish_posts' => current_user_can('publish_posts'),
                'can_delete_posts' => current_user_can('delete_posts'),
            )
        );
    }
    
    // Get user's posts with pagination
    public function get_user_posts($request) {
        $user_id = get_current_user_id();
        $per_page = $request->get_param('per_page') ?: 10;
        $page = $request->get_param('page') ?: 1;
        $status = $request->get_param('status') ?: array('publish', 'draft');
        
        $args = array(
            'author' => $user_id,
            'post_status' => $status,
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'date',
            'order' => 'DESC'
        );
        
        $posts_query = new WP_Query($args);
        $posts = array();
        
        foreach ($posts_query->posts as $post) {
            $featured_image = get_the_post_thumbnail_url($post->ID, 'medium');
            
            $posts[] = array(
                'id' => $post->ID,
                'title' => array('rendered' => $post->post_title),
                'content' => array('rendered' => $post->post_content),
                'excerpt' => array('rendered' => wp_trim_words($post->post_content, 30)),
                'status' => $post->post_status,
                'date' => $post->post_date,
                'modified' => $post->post_modified,
                'author' => $post->post_author,
                'featured_media' => get_post_thumbnail_id($post->ID),
                'featured_image_url' => $featured_image ?: null,
                'categories' => wp_get_post_categories($post->ID),
                'tags' => wp_get_post_tags($post->ID, array('fields' => 'names')),
            );
        }
        
        return array(
            'posts' => $posts,
            'total' => $posts_query->found_posts,
            'pages' => $posts_query->max_num_pages,
            'current_page' => $page
        );
    }
    
    // Update post
    public function update_post($request) {
        $post_id = $request->get_param('id');
        $title = $request->get_param('title');
        $content = $request->get_param('content');
        $status = $request->get_param('status') ?: 'draft';
        $featured_media = $request->get_param('featured_media');
        
        $post_data = array(
            'ID' => $post_id,
            'post_title' => $title,
            'post_content' => $content,
            'post_status' => $status,
        );
        
        $result = wp_update_post($post_data);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        // Set featured image if provided
        if ($featured_media) {
            set_post_thumbnail($post_id, $featured_media);
        }
        
        return array(
            'id' => $post_id,
            'message' => 'Post updated successfully',
            'post' => get_post($post_id)
        );
    }
    
    // Delete post
    public function delete_post($request) {
        $post_id = $request->get_param('id');
        $force_delete = $request->get_param('force') === 'true';
        
        $result = wp_delete_post($post_id, $force_delete);
        
        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete post', array('status' => 500));
        }
        
        return array(
            'deleted' => true,
            'id' => $post_id,
            'message' => 'Post deleted successfully'
        );
    }
    
    // Upload to Bunny CDN
    public function upload_to_bunny_cdn($request) {
        if (empty($this->bunny_api_key) || empty($this->bunny_storage_zone)) {
            return new WP_Error('bunny_config', 'Bunny CDN not configured', array('status' => 500));
        }
        
        $files = $request->get_file_params();
        
        if (empty($files['file'])) {
            return new WP_Error('no_file', 'No file uploaded', array('status' => 400));
        }
        
        $file = $files['file'];
        $file_name = sanitize_file_name($file['name']);
        $file_type = $file['type'];
        $file_tmp_path = $file['tmp_name'];
        
        // Validate file type
        $allowed_types = array(
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'
        );
        
        if (!in_array($file_type, $allowed_types)) {
            return new WP_Error('invalid_file_type', 'File type not allowed', array('status' => 400));
        }
        
        // Generate unique filename
        $unique_filename = time() . '_' . $file_name;
        $folder_path = date('Y/m/');
        $full_path = $folder_path . $unique_filename;
        
        // Upload to Bunny CDN
        $bunny_url = "https://storage.bunnycdn.com/{$this->bunny_storage_zone}/{$full_path}";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $bunny_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_PUT, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            "AccessKey: {$this->bunny_api_key}",
            "Content-Type: {$file_type}"
        ));
        curl_setopt($ch, CURLOPT_INFILE, fopen($file_tmp_path, 'r'));
        curl_setopt($ch, CURLOPT_INFILESIZE, filesize($file_tmp_path));
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code !== 201) {
            return new WP_Error('bunny_upload_failed', 'Failed to upload to Bunny CDN', array('status' => 500));
        }
        
        // Save to WordPress media library
        $cdn_url = "{$this->bunny_cdn_url}/{$full_path}";
        
        $attachment_data = array(
            'post_title' => pathinfo($file_name, PATHINFO_FILENAME),
            'post_content' => '',
            'post_status' => 'inherit',
            'post_mime_type' => $file_type,
            'guid' => $cdn_url
        );
        
        $attachment_id = wp_insert_attachment($attachment_data);
        
        if (!$attachment_id) {
            return new WP_Error('attachment_failed', 'Failed to create attachment', array('status' => 500));
        }
        
        // Add custom meta for Bunny CDN URL
        update_post_meta($attachment_id, '_bunny_cdn_url', $cdn_url);
        update_post_meta($attachment_id, '_bunny_file_path', $full_path);
        
        return array(
            'id' => $attachment_id,
            'url' => $cdn_url,
            'filename' => $unique_filename,
            'type' => $file_type,
            'size' => filesize($file_tmp_path),
            'message' => 'File uploaded successfully to Bunny CDN'
        );
    }
    
    // Get user's media
    public function get_user_media($request) {
        $user_id = get_current_user_id();
        $per_page = $request->get_param('per_page') ?: 20;
        $page = $request->get_param('page') ?: 1;
        $type = $request->get_param('type'); // 'image' or 'video'
        
        $args = array(
            'author' => $user_id,
            'post_type' => 'attachment',
            'post_status' => 'inherit',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'date',
            'order' => 'DESC'
        );
        
        if ($type) {
            $args['post_mime_type'] = $type . '/*';
        }
        
        $attachments = get_posts($args);
        $media_items = array();
        
        foreach ($attachments as $attachment) {
            $bunny_url = get_post_meta($attachment->ID, '_bunny_cdn_url', true);
            $file_path = get_post_meta($attachment->ID, '_bunny_file_path', true);
            
            $media_items[] = array(
                'id' => $attachment->ID,
                'title' => $attachment->post_title,
                'filename' => basename($attachment->guid),
                'mime_type' => $attachment->post_mime_type,
                'url' => $bunny_url ?: wp_get_attachment_url($attachment->ID),
                'date' => $attachment->post_date,
                'author' => $attachment->post_author,
                'is_bunny_cdn' => !empty($bunny_url),
                'file_path' => $file_path
            );
        }
        
        return array(
            'media' => $media_items,
            'total' => count($attachments)
        );
    }
    
    // Add custom fields to REST API response
    public function add_custom_fields() {
        register_rest_field('post', 'author_info', array(
            'get_callback' => function($post) {
                try {
                    $author_id = is_array($post) ? $post['author'] : $post->post_author;
                    if (!$author_id) return null;
                    
                    $author = get_user_by('id', $author_id);
                    if (!$author) return null;
                    
                    return array(
                        'display_name' => $author->display_name ?: $author->user_login,
                        'avatar' => get_avatar_url($author->ID),
                    );
                } catch (Exception $e) {
                    error_log('Author info callback error: ' . $e->getMessage());
                    return null;
                }
            }
        ));
        
        register_rest_field('post', 'featured_image_url', array(
            'get_callback' => function($post) {
                try {
                    $post_id = is_array($post) ? $post['id'] : $post->ID;
                    if (!$post_id) return false;
                    
                    $url = get_the_post_thumbnail_url($post_id, 'medium');
                    return $url ?: false;
                } catch (Exception $e) {
                    error_log('Featured image callback error: ' . $e->getMessage());
                    return false;
                }
            }
        ));
        
        register_rest_field('attachment', 'bunny_cdn_info', array(
            'get_callback' => function($attachment) {
                try {
                    $attachment_id = is_array($attachment) ? $attachment['id'] : $attachment->ID;
                    if (!$attachment_id) return null;
                    
                    return array(
                        'bunny_url' => get_post_meta($attachment_id, '_bunny_cdn_url', true),
                        'file_path' => get_post_meta($attachment_id, '_bunny_file_path', true),
                    );
                } catch (Exception $e) {
                    error_log('Bunny CDN info callback error: ' . $e->getMessage());
                    return null;
                }
            }
        ));
    }
    
    // Plugin activation
    public function activate() {
        $this->init();
        flush_rewrite_rules();
    }
}

// Initialize the plugin
new NextJSAPIIntegration();
?>
