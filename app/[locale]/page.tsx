"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Header } from "@/components/header"
import { NewsCard, NewsSection, CategoryTabs } from "@/components/news-card"
import { WordPressNewsCard } from "@/components/wordpress-news-card"
import { NewsSkeleton, WeeklyNewsSkeleton, LiveNewsSkeleton } from "@/components/news-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { fetchPostsByCategory, fetchRecentPosts, WordPressPost, getFeaturedImageUrl, getPostExcerpt, formatPostDate, getCategoryName } from "@/lib/wordpress-api"

export default function HomePage({ params }: { params: { locale: string } }) {
  const t = useTranslations("navigation")
  const tNews = useTranslations("news")
  const tCommon = useTranslations("common")
  const tSample = useTranslations("sampleNews")
  
  const [activeCategory, setActiveCategory] = useState("political")
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState({
    main: true,
    featured: true,
    live: true,
    weekly: true,
    popular: true
  })
  const [newsData, setNewsData] = useState({
    main: [] as WordPressPost[],
    featured: [] as WordPressPost[],
    live: [] as WordPressPost[],
    weekly: [] as WordPressPost[],
    popular: [] as WordPressPost[]
  })
console.log(newsData)
  const categories = ["political", "social", "economy", "expatriates","charity"]
  const categorySlugMap = {
    political: "political",
    social: "charity", 
    economics: "daily-news",
    expatriates: "woman",
    charity: "charity"
  }

  // Fetch news data functions
  const fetchMainNews = async () => {
    try {
      setLoading(prev => ({ ...prev, main: true }))
      // Fetch recent posts from daily-news category, ordered by most recent
      const posts = await fetchRecentPosts(5, 'daily-news')
      setNewsData(prev => ({ ...prev, main: posts }))
      setCurrentSlide(0) // Reset to first slide when new data is loaded
    } catch (error) {
      console.error('Error fetching main news:', error)
    } finally {
      setLoading(prev => ({ ...prev, main: false }))
    }
  }

  const fetchFeaturedNews = async () => {
    try {
      setLoading(prev => ({ ...prev, featured: true }))
      const posts = await fetchPostsByCategory('daily-news', 1, 2)
      setNewsData(prev => ({ ...prev, featured: posts }))
    } catch (error) {
      console.error('Error fetching featured news:', error)
    } finally {
      setLoading(prev => ({ ...prev, featured: false }))
    }
  }

  const fetchLiveNews = async () => {
    try {
      setLoading(prev => ({ ...prev, live: true }))
      const posts = await fetchPostsByCategory('daily-news', 1, 2)
      setNewsData(prev => ({ ...prev, live: posts }))
    } catch (error) {
      console.error('Error fetching live news:', error)
    } finally {
      setLoading(prev => ({ ...prev, live: false }))
    }
  }

  const fetchWeeklyNews = async (category: string) => {
    try {
      setLoading(prev => ({ ...prev, weekly: true }))
      const slug = categorySlugMap[category as keyof typeof categorySlugMap]
      const posts = await fetchPostsByCategory(slug, 1, 4)
      setNewsData(prev => ({ ...prev, weekly: posts }))
    } catch (error) {
      console.error('Error fetching weekly news:', error)
    } finally {
      setLoading(prev => ({ ...prev, weekly: false }))
    }
  }

  const fetchPopularNews = async (category: string) => {
    try {
      setLoading(prev => ({ ...prev, popular: true }))
      const slug = categorySlugMap[category as keyof typeof categorySlugMap]
      const posts = await fetchPostsByCategory(slug, 1, 6)
      setNewsData(prev => ({ ...prev, popular: posts }))
    } catch (error) {
      console.error('Error fetching popular news:', error)
    } finally {
      setLoading(prev => ({ ...prev, popular: false }))
    }
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    fetchWeeklyNews(category)
    fetchPopularNews(category)
  }

  // Slider navigation functions
  const nextSlide = () => {
    if (newsData.main.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % newsData.main.length)
    }
  }

  const prevSlide = () => {
    if (newsData.main.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + newsData.main.length) % newsData.main.length)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Load initial data
  useEffect(() => {
    fetchMainNews()
    fetchFeaturedNews()
    fetchLiveNews()
    fetchWeeklyNews(activeCategory)
    fetchPopularNews(activeCategory)
  }, [])

  // Fallback data for when API fails
  const fallbackMainNews = {
    title: tSample("title"),
    content: tSample("content"),
    date: "February 12, 2025",
    image: "/api/placeholder/800/500",
    tag: t("dailyNews")
  }

  const fallbackFeaturedNews = {
    title: tSample("title"),
    content: tSample("content"),
    date: "February 12, 2025",
    image: "/api/placeholder/400/300"
  }

  return (
    <div className="min-h-screen bg-renas-beige-50 dark:bg-gray-900">
      <Header locale={params.locale} />
      
      <main>
        {/* Main News Section */}
        <section className="py-8">
          <div className="renas-container">
            {loading.main ? (
              <NewsSkeleton variant="main" />
            ) : newsData.main.length > 0 ? (
              <WordPressNewsCard post={newsData.main[currentSlide]} isMain={true} locale={params.locale} />
            ) : (
              <NewsCard {...fallbackMainNews} isMain={true} />
            )}
            
            {/* Carousel Navigation */}
            {newsData.main.length > 1 && (
              <div className="flex items-center justify-center mt-6 gap-4">
                <div className="flex gap-2">
                  {Array.from({ length: newsData.main.length }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentSlide 
                          ? "bg-renas-gold-500 dark:bg-renas-gold-400" 
                          : "border border-renas-gold-500 dark:border-renas-gold-400 hover:bg-renas-gold-300 dark:hover:bg-renas-gold-500"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-renas-gold-100 dark:hover:bg-gray-700"
                    onClick={prevSlide}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-renas-gold-100 dark:hover:bg-gray-700"
                    onClick={nextSlide}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-renas-brown-200 dark:border-gray-800" />

        {/* Featured News Section */}
        <NewsSection 
          title={t("featuredNews")} 
          backgroundText="FEATURE"
          showNavigation={true}
        >
          {loading.featured ? (
            <NewsSkeleton variant="featured" />
          ) : newsData.featured.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WordPressNewsCard post={newsData.featured[0]} locale={params.locale} />
              <div className="flex items-center justify-center">
                <div className="flex gap-2">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === 0 
                          ? "bg-renas-gold-500 dark:bg-renas-gold-400" 
                          : "border border-renas-gold-500 dark:border-renas-gold-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NewsCard {...fallbackFeaturedNews} />
              <div className="flex items-center justify-center">
                <div className="flex gap-2">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === 0 
                          ? "bg-renas-gold-500 dark:bg-renas-gold-400" 
                          : "border border-renas-gold-500 dark:border-renas-gold-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </NewsSection>

      

        {/* Weekly News Section */}
        <NewsSection title={t("weeklyNews")} showNavigation={true}>
          <div className="mb-6">
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
          {loading.weekly ? (
            <WeeklyNewsSkeleton />
          ) : newsData.weekly.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2">
                <WordPressNewsCard post={newsData.weekly[0]} locale={params.locale} />
              </div>
              <div className="lg:col-span-2 grid grid-cols-1 gap-4">
                {newsData.weekly.slice(1).map((post) => (
                  <WordPressNewsCard key={post.id} post={post} locale={params.locale} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-renas-brown-600 dark:text-gray-400">
                {tNews("noMorePosts")}
              </p>
            </div>
          )}
        </NewsSection>

        {/* Popular News Section */}
        <NewsSection title={t("popularNews")} showNavigation={true}>
          <div className="mb-6">
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
          {loading.popular ? (
            <NewsSkeleton variant="grid" />
          ) : newsData.popular.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsData.popular.map((post) => (
                <WordPressNewsCard key={post.id} post={post} locale={params.locale} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-renas-brown-600 dark:text-gray-400">
                {tNews("noMorePosts")}
              </p>
            </div>
          )}
        </NewsSection>

        {/* Newsletter Section */}
        <NewsSection title={t("newsletter")} showNavigation={false}>
          <div className="bg-renas-beige-100 dark:bg-gray-800 rounded-2xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-bold text-renas-brown-800 dark:text-white mb-4">
                  {tCommon("subscribeToNewsletter")}
                </h3>
                <p className="text-renas-brown-600 dark:text-gray-300 mb-6">
                  {tSample("content")}
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={tCommon("yourEmailAddress")}
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-white dark:bg-gray-700 border-renas-brown-300 dark:border-gray-600"
                />
                <Button variant="renas" className="px-6">
                  {tCommon("subscribe")}
                </Button>
              </div>
            </div>
          </div>
        </NewsSection>
      </main>
    </div>
  )
}
