"use client"

import { useState } from "react"

interface HelpArticle {
  id: string
  title: string
  category: string
  content: string
  tags: string[]
}

const helpArticles: HelpArticle[] = [
  {
    id: "1",
    title: "Getting Started with Vetted",
    category: "Getting Started",
    content: `Welcome to Vetted! Here's how to get started:

1. **Complete Your Profile**: Add your work experience, education, and skills to help others find you.

2. **Build Your Network**: Connect with professionals in your industry by sending connection requests.

3. **Join Groups**: Discover and join groups related to your interests and industry.

4. **Explore Jobs**: Browse job listings and apply to positions that match your skills.

5. **Engage with Content**: Like, comment, and share posts from your network.`,
    tags: ["profile", "getting-started", "basics"],
  },
  {
    id: "2",
    title: "How to Create a Group",
    category: "Groups",
    content: `Creating a group is easy:

1. Navigate to the Groups page from the sidebar
2. Click "Create Group" button
3. Fill in the group details:
   - Name: Choose a clear, descriptive name
   - Description: Explain what your group is about
   - Privacy: Choose public or private
4. Click "Create" to launch your group

Once created, you'll automatically become the group admin and can start posting content.`,
    tags: ["groups", "create", "community"],
  },
  {
    id: "3",
    title: "Applying for Jobs",
    category: "Jobs",
    content: `To apply for a job on Vetted:

1. Browse jobs on the Jobs page or search for specific positions
2. Click on a job listing to view details
3. Review the job requirements and description
4. Click "Apply" button
5. Upload your resume (PDF format recommended)
6. Optionally add a cover letter
7. Submit your application

You can track your applications in your profile. Recruiters will be notified and can review your application.`,
    tags: ["jobs", "application", "resume"],
  },
  {
    id: "4",
    title: "Privacy Settings",
    category: "Account",
    content: `Manage your privacy settings:

**Profile Visibility**:
- Public: Anyone can view your profile
- Connections Only: Only your connections can see full profile
- Private: Profile is hidden from search

**Post Visibility**:
- Public: Visible to everyone
- Connections: Only visible to your connections
- Groups: Only visible within specific groups

**Data & Privacy**:
- You can download your data anytime
- Delete your account from account settings
- Control who can send you connection requests`,
    tags: ["privacy", "settings", "security"],
  },
  {
    id: "5",
    title: "Using AI Features",
    category: "Features",
    content: `Vetted includes AI-powered features:

**Job Matching**:
- AI analyzes your profile and matches you with relevant jobs
- Get personalized job recommendations

**Content Recommendations**:
- See posts tailored to your interests
- Discover relevant connections

**Profile Optimization**:
- Get AI suggestions to improve your profile
- Optimize your profile for better visibility

**Interview Prep**:
- Generate interview questions based on job descriptions
- Get personalized preparation tips`,
    tags: ["ai", "features", "recommendations"],
  },
  {
    id: "6",
    title: "Troubleshooting Connection Issues",
    category: "Troubleshooting",
    content: `Having trouble connecting with others?

**Connection Requests Not Sending**:
- Check your internet connection
- Refresh the page
- Clear browser cache

**Can't Accept Requests**:
- Ensure you're logged in
- Check if you've reached connection limit
- Try logging out and back in

**Messages Not Loading**:
- Refresh the page
- Check your browser console for errors
- Contact support if issue persists

**Profile Not Updating**:
- Clear browser cache
- Try a different browser
- Wait a few minutes and refresh`,
    tags: ["troubleshooting", "connections", "support"],
  },
]

const categories = [
  "All",
  "Getting Started",
  "Groups",
  "Jobs",
  "Account",
  "Features",
  "Troubleshooting",
]

export default function HelpContent() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(
    null
  )

  const filteredArticles = helpArticles.filter((article) => {
    const matchesCategory =
      selectedCategory === "All" || article.category === selectedCategory
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    return matchesCategory && matchesSearch
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Categories */}
          <div className="space-y-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Categories
            </h3>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Articles List */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Articles ({filteredArticles.length})
            </h3>
            {filteredArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedArticle?.id === article.id
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {article.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="lg:col-span-2">
        {selectedArticle ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-2">
                {selectedArticle.category}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {selectedArticle.title}
              </h2>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">
                {selectedArticle.content}
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to articles
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select an article to get started
            </h2>
            <p className="text-gray-600">
              Choose an article from the sidebar to view detailed help content.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

