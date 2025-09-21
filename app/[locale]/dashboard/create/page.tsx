"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { RichTextEditorWrapper } from "@/components/rich-text-editor-wrapper"
import { MediaInserter } from "@/components/media-inserter"
import { PostSummary } from "@/components/post-summary"
import { WORDPRESS_CONFIG, getWordPressUrl } from "@/lib/wordpress-config.ts"
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload,
  Image as ImageIcon,
  Video,
  X,
  User,
  Calendar
} from "lucide-react"
import Link from "next/link"

interface MediaFile {
  id: string
  file: File
  preview: string
  type: 'image' | 'video'
  url?: string
}

export default function CreatePost() {
  const { user, token } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [status, setStatus] = useState<"draft" | "publish" | "pending">("draft")
  
  // Media state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)

  if (!user) {
    router.push(`/${locale}/login`)
    return null
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setUploadingMedia(true)
    try {
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          const preview = URL.createObjectURL(file)
          const mediaFile: MediaFile = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file,
            preview,
            type: 'image'
          }
          
          // Upload to server
          const formData = new FormData()
          formData.append('file', file)
          
          const response = await fetch('/api/upload/image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          })

          if (response.ok) {
            const data = await response.json()
            mediaFile.url = data.url
          }
          
          setMediaFiles(prev => [...prev, mediaFile])
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setUploadingMedia(true)
    try {
      for (const file of Array.from(files)) {
        if (file.type.startsWith('video/')) {
          const preview = URL.createObjectURL(file)
          const mediaFile: MediaFile = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file,
            preview,
            type: 'video'
          }
          
          // Upload to server/BunnyCDN
          const formData = new FormData()
          formData.append('file', file)
          
          const response = await fetch('/api/upload/video', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          })

          if (response.ok) {
            const data = await response.json()
            mediaFile.url = data.url
          }
          
          setMediaFiles(prev => [...prev, mediaFile])
        }
      }
    } catch (error) {
      console.error('Error uploading videos:', error)
    } finally {
      setUploadingMedia(false)
    }
  }

  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const insertMediaIntoContent = (mediaId: string) => {
    const mediaFile = mediaFiles.find(m => m.id === mediaId)
    if (!mediaFile) return

    const mediaUrl = mediaFile.url || mediaFile.preview
    let mediaHtml = ''

    if (mediaFile.type === 'image') {
      mediaHtml = `<figure class="wp-block-image"><img src="${mediaUrl}" alt="${mediaFile.file.name}" class="wp-image" /></figure>`
    } else if (mediaFile.type === 'video') {
      mediaHtml = `<figure class="wp-block-video"><video controls src="${mediaUrl}" class="wp-video"></video></figure>`
    }

    // Insert at current cursor position or append to content
    const newContent = content + '\n\n' + mediaHtml + '\n\n'
    setContent(newContent)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      alert("Please fill in the title and content")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${WORDPRESS_CONFIG.BASE_URL}${WORDPRESS_CONFIG.ENDPOINTS.POSTS}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          status,
          category,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          media: mediaFiles.map(m => ({
            id: m.id,
            type: m.type,
            url: m.url || m.preview,
            title: m.file.name,
            size: m.file.size,
            uploaded_by: user?.id,
            uploaded_at: new Date().toISOString()
          }))
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.post) {
          router.push(`/${locale}/dashboard/edit/${data.post.id}`)
        } else {
          alert(data.error || "Failed to create post")
        }
      } else {
        const error = await response.json()
        alert(error.error || error.message || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Failed to create post. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    setStatus("draft")
    const form = document.querySelector('form')
    if (form) {
      form.requestSubmit()
    }
  }

  const handlePublish = async () => {
    setStatus("publish")
    const form = document.querySelector('form')
    if (form) {
      form.requestSubmit()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="renas-container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/dashboard`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create New Post
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Write and publish your content as <span className="font-medium">{user.display_name || user.username}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || !title.trim() || !content.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={saving || !title.trim() || !content.trim()}
            >
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Post Title */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-lg font-medium">
                      Post Title *
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter your post title..."
                      className="mt-2 text-lg"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="excerpt" className="text-lg font-medium">
                      Excerpt
                    </Label>
                    <textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Brief description of your post..."
                      className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </Card>

              {/* Rich Text Editor */}
              <Card className="p-6">
                <Label className="text-lg font-medium mb-4 block">
                  Content *
                </Label>
                <RichTextEditorWrapper
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your post..."
                />
              </Card>

            </div>

            {/* Media Sidebar */}
            <div className="space-y-6">
              <MediaInserter
                mediaFiles={mediaFiles}
                onMediaUpload={async (event, type) => {
                  if (type === 'image') {
                    await handleImageUpload(event)
                  } else {
                    await handleVideoUpload(event)
                  }
                }}
                onMediaRemove={removeMediaFile}
                onMediaInsert={insertMediaIntoContent}
                uploadingMedia={uploadingMedia}
              />
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              {/* Publish Settings */}
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Publish Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="pending">Pending Review</option>
                      <option value="publish">Published</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Categories & Tags */}
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Categories & Tags</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Category</option>
                      <option value="daily-news">Daily News</option>
                      <option value="charity">Charity</option>
                      <option value="sports">Sports</option>
                      <option value="woman">Woman</option>
                      <option value="political-news">Political News</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="tag1, tag2, tag3..."
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate tags with commas
                    </p>
                  </div>
                </div>
              </Card>

              {/* Post Summary */}
              <PostSummary
                author={user}
                content={content}
                mediaFiles={mediaFiles}
                category={category}
                tags={tags}
                status={status}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
