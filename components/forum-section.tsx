"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, Users, Clock, ThumbsUp, Reply } from "lucide-react"

interface ForumPost {
  id: string
  title: string
  author: string
  content: string
  timestamp: string
  likes: number
  replies: number
  category: string
}

export function ForumSection() {
  const t = useTranslations("navigation")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Sample forum data
  const forumPosts: ForumPost[] = [
    {
      id: "1",
      title: "Latest developments in Sudan",
      author: "Ahmed Hassan",
      content: "Discussion about recent political developments...",
      timestamp: "2 hours ago",
      likes: 15,
      replies: 8,
      category: "political"
    },
    {
      id: "2",
      title: "Economic situation update",
      author: "Fatima Ali",
      content: "Analysis of current economic conditions...",
      timestamp: "4 hours ago",
      likes: 23,
      replies: 12,
      category: "economics"
    },
    {
      id: "3",
      title: "Sports news and updates",
      author: "Omar Khalil",
      content: "Latest sports news and match results...",
      timestamp: "6 hours ago",
      likes: 7,
      replies: 3,
      category: "sports"
    }
  ]

  const categories = [
    { key: "all", label: "All Topics" },
    { key: "political", label: "Political" },
    { key: "economics", label: "Economics" },
    { key: "sports", label: "Sports" },
    { key: "social", label: "Social" }
  ]

  const filteredPosts = forumPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <section className="py-8 bg-renas-beige-50 dark:bg-gray-900">
      <div className="renas-container">
        <div className="flex items-center gap-2 mb-8">
          <MessageCircle className="h-8 w-8 text-renas-gold-600" />
          <h2 className="text-3xl font-bold text-renas-brown-800 dark:text-white">
            {t("forums")}
          </h2>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search forum topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-gray-800 border-renas-brown-300 dark:border-gray-600"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category.key}
                  variant={selectedCategory === category.key ? "renas" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.key)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Forum Posts */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="border-renas-brown-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-renas-brown-800 dark:text-white mb-2">
                      {post.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-renas-brown-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.timestamp}
                      </span>
                    </div>
                  </div>
                  <span className="bg-renas-gold-100 dark:bg-renas-gold-900 text-renas-gold-800 dark:text-renas-gold-200 px-2 py-1 rounded-full text-xs font-medium">
                    {post.category}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-renas-brown-700 dark:text-gray-300 mb-4">
                  {post.content}
                </p>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Reply className="h-4 w-4" />
                    {post.replies} replies
                  </Button>
                  <Button variant="renas" size="sm">
                    Join Discussion
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create New Post */}
        <div className="mt-8">
          <Card className="border-renas-gold-300 dark:border-renas-gold-600">
            <CardHeader>
              <CardTitle className="text-renas-brown-800 dark:text-white">
                Start a New Discussion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Topic title..."
                  className="bg-white dark:bg-gray-800"
                />
                <textarea
                  placeholder="Share your thoughts..."
                  className="w-full h-32 p-3 border border-renas-brown-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-renas-brown-800 dark:text-white placeholder:text-renas-brown-400 dark:placeholder:text-gray-400"
                />
                <div className="flex justify-between items-center">
                  <select className="px-3 py-2 border border-renas-brown-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-renas-brown-800 dark:text-white">
                    <option value="political">Political</option>
                    <option value="economics">Economics</option>
                    <option value="sports">Sports</option>
                    <option value="social">Social</option>
                  </select>
                  <Button variant="renas">
                    Post Discussion
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
