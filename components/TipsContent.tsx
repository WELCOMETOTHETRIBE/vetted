"use client"

import { useState } from "react"

interface Tip {
  id: string
  title: string
  category: string
  content: string
  icon: string
  level: "Beginner" | "Intermediate" | "Advanced"
}

const tips: Tip[] = [
  {
    id: "1",
    title: "Optimize Your Profile for Discoverability",
    category: "Profile",
    content: `A complete profile is 40% more likely to be viewed. Here's how:

✅ **Use a Professional Photo**: A clear, professional headshot increases profile views by 14x

✅ **Write a Compelling Headline**: Your headline is the first thing people see. Make it specific and keyword-rich

✅ **Detail Your Experience**: Include specific achievements, metrics, and technologies used

✅ **Add Skills**: List relevant skills - profiles with 5+ skills get 17x more views

✅ **Get Recommendations**: Ask colleagues to write recommendations for your work`,
    icon: "👤",
    level: "Beginner",
  },
  {
    id: "2",
    title: "Build Meaningful Connections",
    category: "Networking",
    content: `Quality over quantity matters:

🎯 **Personalize Connection Requests**: Always add a note explaining why you want to connect

🎯 **Engage Before Connecting**: Like or comment on their posts first to establish familiarity

🎯 **Follow Up**: After connecting, send a brief message thanking them and suggesting how you can help

🎯 **Join Relevant Groups**: Participate in group discussions to meet like-minded professionals

🎯 **Share Value**: Post helpful content that showcases your expertise`,
    icon: "🤝",
    level: "Intermediate",
  },
  {
    id: "3",
    title: "Master the Job Search",
    category: "Jobs",
    content: `Stand out in your job applications:

💼 **Use AI Matching**: Let our AI match you with jobs that fit your profile

💼 **Customize Applications**: Tailor your resume and cover letter for each position

💼 **Research Companies**: Learn about the company culture and recent news before applying

💼 **Network Internally**: Connect with employees at target companies

💼 **Follow Up**: Send a polite follow-up message 1-2 weeks after applying`,
    icon: "💼",
    level: "Intermediate",
  },
  {
    id: "4",
    title: "Create Engaging Content",
    category: "Content",
    content: `Boost your visibility with great content:

📝 **Share Insights**: Post about industry trends, lessons learned, or helpful tips

📝 **Use Visuals**: Posts with images get 2.3x more engagement

📝 **Ask Questions**: Encourage discussion by asking for opinions or experiences

📝 **Be Consistent**: Post regularly to stay top-of-mind with your network

📝 **Engage with Others**: Comment thoughtfully on others' posts to build relationships`,
    icon: "📝",
    level: "Beginner",
  },
  {
    id: "5",
    title: "Leverage Groups Effectively",
    category: "Groups",
    content: `Groups are powerful networking tools:

👥 **Join Active Groups**: Look for groups with regular discussions and engagement

👥 **Be an Active Member**: Share insights, answer questions, and help others

👥 **Start Discussions**: Post thought-provoking questions or share relevant articles

👥 **Create Your Own Group**: Establish yourself as a thought leader by creating a niche group

👥 **Network Within Groups**: Connect with active members who share your interests`,
    icon: "👥",
    level: "Intermediate",
  },
  {
    id: "6",
    title: "Use AI Features Strategically",
    category: "AI Features",
    content: `Maximize AI-powered features:

🤖 **Job Recommendations**: Review AI-suggested jobs daily - they're tailored to your profile

🤖 **Profile Optimization**: Use AI suggestions to improve your profile completeness

🤖 **Interview Prep**: Generate personalized interview questions for each application

🤖 **Content Recommendations**: Discover relevant posts and connections through AI

🤖 **Career Insights**: Get AI-powered insights about your career trajectory`,
    icon: "🤖",
    level: "Advanced",
  },
  {
    id: "7",
    title: "Build Your Personal Brand",
    category: "Branding",
    content: `Establish yourself as a thought leader:

⭐ **Define Your Niche**: Focus on 1-2 areas where you have deep expertise

⭐ **Share Consistently**: Post 2-3 times per week to maintain visibility

⭐ **Create Original Content**: Write articles or posts that showcase your unique perspective

⭐ **Engage Authentically**: Be genuine in your interactions - authenticity builds trust

⭐ **Showcase Achievements**: Share milestones, certifications, and project completions`,
    icon: "⭐",
    level: "Advanced",
  },
  {
    id: "8",
    title: "Privacy Best Practices",
    category: "Privacy",
    content: `Protect your information while staying visible:

🔒 **Review Privacy Settings**: Regularly check who can see your profile and posts

🔒 **Be Selective**: Only accept connection requests from people you know or want to know

🔒 **Control Post Visibility**: Use post privacy settings to control who sees your content

🔒 **Limit Personal Info**: Don't share sensitive information like phone numbers publicly

🔒 **Report Issues**: Report any suspicious activity or harassment immediately`,
    icon: "🔒",
    level: "Beginner",
  },
]

const categories = [
  "All",
  "Profile",
  "Networking",
  "Jobs",
  "Content",
  "Groups",
  "AI Features",
  "Branding",
  "Privacy",
]

const levels = ["All", "Beginner", "Intermediate", "Advanced"]

export default function TipsContent() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedLevel, setSelectedLevel] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTips = tips.filter((tip) => {
    const matchesCategory =
      selectedCategory === "All" || tip.category === selectedCategory
    const matchesLevel = selectedLevel === "All" || tip.level === selectedLevel
    const matchesSearch =
      !searchQuery ||
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesLevel && matchesSearch
  })

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tips Grid */}
      {filteredTips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTips.map((tip) => (
            <div
              key={tip.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{tip.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tip.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        tip.level === "Beginner"
                          ? "bg-green-100 text-green-800"
                          : tip.level === "Intermediate"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {tip.level}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{tip.category}</span>
                </div>
              </div>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 text-sm">
                  {tip.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No tips found matching your filters.</p>
        </div>
      )}
    </div>
  )
}

