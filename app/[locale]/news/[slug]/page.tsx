"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowLeft, Calendar, User, ExternalLink, Share2, Bookmark } from "lucide-react"
import { fetchPost, WordPressPost, getFeaturedImageUrl, formatPostDate, getCategoryName } from "@/lib/wordpress-api"

export default function NewsDetailPage({ params }: { params: { locale: string; slug: string } }) {
  const t = useTranslations("news")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [post, setPost] = useState<WordPressPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true)
        setError(null)
        const postData = await fetchPost(params.slug)
        if (postData) {
          setPost(postData)
        } else {
          setError("Post not found")
        }
      } catch (err) {
        setError("Failed to load post")
        console.error("Error loading post:", err)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [params.slug])

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title.rendered,
          text: post.excerpt.rendered,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleBookmark = () => {
    // TODO: Implement bookmark functionality
    console.log("Bookmark clicked")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-renas-beige-50 dark:bg-gray-900">
        <Header locale={params.locale} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-renas-gold-500" />
          <span className="ml-2 text-renas-brown-600 dark:text-gray-400">
            {t("loading")}...
          </span>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-renas-beige-50 dark:bg-gray-900">
        <Header locale={params.locale} />
        <div className="renas-container py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-renas-brown-800 dark:text-white mb-4">
              {error || "Post not found"}
            </h1>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-renas-beige-50 dark:bg-gray-900">
      <Header locale={params.locale} />
      
      <main>
        {/* Back Button */}
        <div className="renas-container py-6">
          <Button 
            onClick={() => router.back()} 
            variant="ghost" 
            className="flex items-center gap-2 text-renas-brown-600 dark:text-gray-400 hover:text-renas-gold-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("back")}
          </Button>
        </div>

        {/* Article Header */}
        <section className="renas-container pb-8">
          <div className="max-w-4xl mx-auto">
            {/* Category Badge */}
            <div className="mb-4">
              <span className="bg-renas-gold-500 dark:bg-renas-gold-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {getCategoryName(post)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-renas-brown-800 dark:text-white mb-6 leading-tight">
              {post.title.rendered}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-renas-brown-600 dark:text-gray-400 mb-8">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{t("editorOfPress")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatPostDate(post.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>{post.modified !== post.date ? `Updated ${formatPostDate(post.modified)}` : ""}</span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative overflow-hidden rounded-2xl mb-8">
              <img
                src={getFeaturedImageUrl(post)}
                alt={post.title.rendered}
                className="w-full h-64 lg:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                {tCommon("share")}
              </Button>
              <Button onClick={handleBookmark} variant="outline" className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                {tCommon("bookmark")}
              </Button>
              <Button 
                onClick={() => window.open(post.link, '_blank')} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {tCommon("viewOriginal")}
              </Button>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="renas-container pb-12">
          <div className="max-w-4xl mx-auto">
            <Card className="border-renas-brown-200 dark:border-gray-700">
              <CardContent className="p-8">
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert
                    prose-headings:text-renas-brown-800 dark:prose-headings:text-white
                    prose-p:text-renas-brown-700 dark:prose-p:text-gray-300
                    prose-a:text-renas-gold-600 dark:prose-a:text-renas-gold-400
                    prose-strong:text-renas-brown-800 dark:prose-strong:text-white
                    prose-blockquote:border-renas-gold-500 dark:prose-blockquote:border-renas-gold-400
                    prose-blockquote:bg-renas-beige-100 dark:prose-blockquote:bg-gray-800
                    prose-blockquote:text-renas-brown-700 dark:prose-blockquote:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: post.content.rendered }}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Related Articles Section */}
        <section className="bg-renas-beige-100 dark:bg-gray-800 py-12">
          <div className="renas-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-renas-brown-800 dark:text-white mb-6">
                {t("relatedArticles")}
              </h2>
              <div className="text-center py-8">
                <p className="text-renas-brown-600 dark:text-gray-400">
                  {t("relatedArticlesComingSoon")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
