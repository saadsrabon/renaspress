"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WordPressPost, getFeaturedImageUrl, getPostExcerpt, formatPostDate, getCategoryName } from "@/lib/wordpress-api"
import { ExternalLink, Calendar, User } from "lucide-react"

interface WordPressNewsCardProps {
  post: WordPressPost
  isMain?: boolean
  className?: string
  locale?: string
}

export function WordPressNewsCard({ 
  post, 
  isMain = false,
  className = "",
  locale = "en"
}: WordPressNewsCardProps) {
  const t = useTranslations("news")
  const featuredImage = getFeaturedImageUrl(post)
  const excerpt = getPostExcerpt(post, isMain ? 200 : 100)
  const formattedDate = formatPostDate(post.date)
  const categoryName = getCategoryName(post)

  return (
    <div className={`relative ${className}`}>
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={featuredImage}
          alt={post.title.rendered}
          className={`w-full object-cover ${
            isMain ? "h-96 lg:h-[500px]" : "h-48"
          }`}
        />
        
        {isMain && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}
        
        <div className="absolute top-4 left-4">
          <span className="bg-renas-gold-500 dark:bg-renas-gold-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            {categoryName}
          </span>
        </div>
        
        {isMain && (
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 text-sm text-gray-200 mb-2">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{t("editorOfPress")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate}</span>
                </div>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-4 leading-tight">
                {post.title.rendered}
              </h2>
              <p className="text-gray-200 text-sm lg:text-base leading-relaxed mb-4">
                {excerpt}
              </p>
              <Link href={`/${locale}/news/${post.slug}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  {t("readMore")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {!isMain && (
        <Card className="mt-4 border-renas-brown-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 text-xs text-renas-brown-500 dark:text-gray-400 mb-2">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{t("editorOfPress")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
            </div>
            <h3 className="font-semibold text-renas-brown-800 dark:text-white text-sm lg:text-base line-clamp-2 mb-2">
              {post.title.rendered}
            </h3>
            <p className="text-renas-brown-600 dark:text-gray-300 text-xs line-clamp-2 mb-3">
              {excerpt}
            </p>
            <Link href={`/${locale}/news/${post.slug}`}>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-renas-gold-600 hover:text-renas-gold-700 p-0 h-auto"
              >
                {t("readMore")} →
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface WordPressNewsGridProps {
  posts: WordPressPost[]
  showMainPost?: boolean
  className?: string
  locale?: string
}

export function WordPressNewsGrid({ 
  posts, 
  showMainPost = true,
  className = "",
  locale = "en"
}: WordPressNewsGridProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-renas-brown-600 dark:text-gray-400">
          No posts found in this category.
        </p>
      </div>
    )
  }

  const mainPost = showMainPost ? posts[0] : null
  const otherPosts = showMainPost ? posts.slice(1) : posts

  return (
    <div className={`space-y-8 ${className}`}>
      {mainPost && (
        <WordPressNewsCard post={mainPost} isMain={true} locale={locale} />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {otherPosts.map((post) => (
          <WordPressNewsCard key={post.id} post={post} locale={locale} />
        ))}
      </div>
    </div>
  )
}

interface WordPressNewsListProps {
  posts: WordPressPost[]
  className?: string
}

export function WordPressNewsList({ 
  posts, 
  className = ""
}: WordPressNewsListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-renas-brown-600 dark:text-gray-400">
          No posts found in this category.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {posts.map((post) => (
        <WordPressNewsCard key={post.id} post={post} />
      ))}
    </div>
  )
}

