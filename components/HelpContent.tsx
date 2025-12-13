"use client"

import { useState } from "react"
import Link from "next/link"

interface HelpArticle {
  id: string
  title: string
  category: string
  content: string
  tags: string[]
  quickStart?: boolean
}

const helpArticles: HelpArticle[] = [
  {
    id: "getting-started",
    title: "Getting Started with Vetted",
    category: "Getting Started",
    content: `# Welcome to Vetted! 🎉

Vetted is a professional networking platform that combines social networking with powerful career tools. Here's how to get started:

## Step 1: Complete Your Profile
1. Click on your profile picture in the top right
2. Go to **Profile** → **Edit Profile**
3. Add your:
   - Work experience and current role
   - Education background
   - Skills and certifications
   - Professional summary
   - Location and contact information

**Pro Tip**: A complete profile gets 3x more views and connection requests!

## Step 2: Build Your Network
1. Go to **Network** from the sidebar
2. Browse recommended connections
3. Send connection requests to professionals in your industry
4. Accept incoming requests from people you know

**Why it matters**: Your network unlocks job opportunities, referrals, and industry insights.

## Step 3: Explore Your Feed
1. Visit the **Feed** page
2. See posts from your connections
3. Like, comment, and share content
4. Create your own posts to share insights

## Step 4: Discover Opportunities
- **Jobs**: Browse job listings tailored to your skills
- **Companies**: Follow companies you're interested in
- **Groups**: Join industry groups and communities

## Next Steps
- Set up AI-powered features (see "AI Features" section)
- Optimize your profile for better visibility
- Start engaging with your network

Ready to dive deeper? Check out the other guides below!`,
    tags: ["getting-started", "profile", "basics"],
    quickStart: true,
  },
  {
    id: "profile-optimization",
    title: "Optimize Your Profile for Maximum Visibility",
    category: "Profile & Networking",
    content: `# Profile Optimization Guide

A well-optimized profile helps you get discovered by recruiters, connect with industry peers, and land opportunities.

## Essential Profile Sections

### 1. Professional Headline
- Write a clear, keyword-rich headline
- Include your current role and key skills
- Example: "Senior Software Engineer | React, TypeScript, Node.js"

### 2. Experience Section
- List all relevant work experience
- Include specific achievements and metrics
- Add start and end dates for each role
- Describe your responsibilities and impact

### 3. Education
- Add all degrees and certifications
- Include graduation years
- Mention relevant coursework or honors

### 4. Skills
- Add technical and soft skills
- Include industry-specific keywords
- Keep skills current and relevant

## AI-Powered Profile Optimization

Vetted offers AI tools to improve your profile:

1. **Profile Optimization Tool**
   - Go to your profile → Click "Optimize Profile"
   - Get AI suggestions for improvements
   - See what recruiters are looking for

2. **Skills Gap Analysis**
   - Discover skills you're missing
   - See what's in demand for your target roles
   - Get recommendations for skill development

3. **Career Insights**
   - Understand your career trajectory
   - See market trends for your role
   - Get personalized career advice

## Profile Best Practices

✅ **Do:**
- Use professional photos
- Keep information up-to-date
- Use keywords relevant to your industry
- Add a compelling professional summary
- Include measurable achievements

❌ **Don't:**
- Leave sections blank
- Use unprofessional language
- Include outdated information
- Overuse buzzwords without context

## Privacy Settings

Control who sees your profile:
- **Public**: Anyone can view your profile
- **Connections Only**: Only your network can see full details
- **Private**: Profile hidden from search

Access these settings from Profile → Settings → Privacy`,
    tags: ["profile", "optimization", "visibility"],
  },
  {
    id: "job-search",
    title: "Finding and Applying to Jobs",
    category: "Jobs & Applications",
    content: `# Complete Job Search Guide

Vetted makes finding and applying to jobs easy with AI-powered matching and streamlined applications.

## Finding Jobs

### Browse Job Listings
1. Go to **Jobs** from the sidebar
2. Browse all available positions
3. Use filters to narrow down:
   - Location
   - Industry
   - Job type (Full-time, Part-time, Contract)
   - Experience level
   - Salary range

### AI-Powered Job Matching
1. Vetted automatically matches you with relevant jobs
2. See your **match score** for each position
3. Jobs are ranked by relevance to your profile
4. Get personalized recommendations

### Search Jobs
- Use the search bar to find specific roles
- Search by job title, company, or keywords
- AI-enhanced search understands context

## Understanding Job Match Scores

Each job shows a match score (0-100%) indicating:
- **Skills Match**: How well your skills align
- **Experience Match**: Your experience level fit
- **Location Match**: Geographic compatibility
- **Overall Fit**: Combined assessment

**90-100%**: Excellent match - Strong candidate
**70-89%**: Good match - Competitive candidate
**50-69%**: Moderate match - Some gaps
**Below 50%**: Poor match - Significant gaps

## Applying to Jobs

### Standard Application Process
1. Click on a job listing to view details
2. Review the full job description
3. Click **"Apply"** button
4. Upload your resume (PDF recommended)
5. Optionally add a cover letter
6. Submit your application

### AI-Powered Application Tools

**1. Resume Optimization**
- Get AI suggestions to tailor your resume
- Highlight relevant experience
- Optimize keywords for ATS systems

**2. Cover Letter Generation**
- Generate personalized cover letters
- Tailored to each job description
- Saves time while maintaining quality

**3. Interview Preparation**
- Get AI-generated interview questions
- Practice answers based on job requirements
- Receive personalized preparation tips

### Tracking Applications
- View all your applications in your profile
- See application status updates
- Track which jobs you've applied to

## Job Alerts

Set up job alerts to never miss opportunities:
1. Save your search criteria
2. Get notified when new matching jobs are posted
3. Stay ahead of the competition

## Tips for Success

✅ **Do:**
- Apply to jobs within 48 hours of posting
- Customize your resume for each application
- Use AI tools to improve your application
- Follow up appropriately
- Keep your profile updated

❌ **Don't:**
- Apply to jobs you're not qualified for
- Use generic cover letters
- Ignore application instructions
- Forget to proofread`,
    tags: ["jobs", "applications", "matching"],
  },
  {
    id: "ai-features",
    title: "AI-Powered Features Guide",
    category: "AI Features",
    content: `# AI Features - Complete Guide

Vetted uses advanced AI to help you succeed in your career. Here's everything you can do:

## 🤖 AI Features for Job Seekers

### 1. Job Matching & Analysis
**What it does**: Analyzes your profile and matches you with relevant jobs

**How to use**:
1. Go to any job listing
2. Click **"Match Analysis"** to see:
   - Your match score (0-100%)
   - Skills alignment breakdown
   - Experience fit assessment
   - What you're missing
   - How to improve your match

**Benefits**: Understand why you're a good fit and what to highlight

### 2. Interview Preparation
**What it does**: Generates personalized interview questions and prep tips

**How to use**:
1. Find a job you're interested in
2. Click **"Interview Prep"**
3. Get:
   - Role-specific interview questions
   - Suggested answers based on your experience
   - Tips for success
   - Questions to ask the interviewer

**Benefits**: Feel confident and prepared for interviews

### 3. Cover Letter Generation
**What it does**: Creates personalized cover letters for each job

**How to use**:
1. When applying to a job, click **"Generate Cover Letter"**
2. AI creates a tailored cover letter
3. Review and edit as needed
4. Use it in your application

**Benefits**: Save time while maintaining quality

### 4. Resume Optimization
**What it does**: Suggests improvements to your resume

**How to use**:
1. Go to Profile → Edit Profile
2. Click **"Optimize Resume"**
3. Get AI suggestions for:
   - Better keywords
   - Stronger action verbs
   - Format improvements
   - Content enhancements

**Benefits**: Make your resume stand out to recruiters

### 5. Skills Gap Analysis
**What it does**: Identifies skills you need to develop

**How to use**:
1. Go to Profile → Skills Gap Analysis
2. Select your target role or industry
3. See:
   - Skills you have
   - Skills you're missing
   - In-demand skills for your field
   - Learning recommendations

**Benefits**: Know what to learn next

### 6. Career Insights
**What it does**: Provides personalized career guidance

**How to use**:
1. Go to Profile → Career Insights
2. View:
   - Your career trajectory analysis
   - Market trends for your role
   - Salary insights
   - Growth opportunities
   - Industry trends

**Benefits**: Make informed career decisions

### 7. Profile Optimization
**What it does**: Suggests profile improvements

**How to use**:
1. Go to Profile → Optimize Profile
2. Get AI recommendations for:
   - Better headline
   - Improved summary
   - Keyword optimization
   - Missing information

**Benefits**: Get more profile views and opportunities

### 8. Personalized Feed
**What it does**: Shows you relevant content

**How to use**:
- Go to Feed → Click **"For You"** tab
- See posts tailored to your interests
- Discover relevant connections
- Find content you'll engage with

**Benefits**: Stay informed about what matters to you

## 🎯 AI Features for Recruiters (Admin)

### 1. Predictive Candidate Scoring
**What it does**: Predicts candidate success probability

**How to use**:
1. Go to Candidates page
2. Select a candidate
3. View their **Predictive Score**:
   - Success probability (0-100%)
   - Confidence level
   - Risk factors
   - Strengths and concerns

**Benefits**: Make data-driven hiring decisions

### 2. Candidate Matching
**What it does**: Matches candidates to job openings

**How to use**:
1. Go to a job listing
2. Click **"Top Candidates"**
3. See ranked list of best matches
4. View match scores and reasons

**Benefits**: Find the best candidates faster

### 3. Engagement Workflows
**What it does**: Automates candidate outreach

**How to use**:
1. Go to Candidates → Select a candidate
2. Click **"Engagement Workflow"**
3. Set up automated:
   - Email sequences
   - Follow-up messages
   - Personalized outreach
4. Track engagement metrics

**Benefits**: Scale your outreach efficiently

### 4. Interview Prep for Candidates
**What it does**: Prepares candidates for interviews

**How to use**:
1. Select a candidate
2. Click **"Interview Prep"**
3. Generate personalized prep materials
4. Share with candidates

**Benefits**: Better-prepared candidates = better interviews

### 5. Market Intelligence
**What it does**: Provides market insights

**How to use**:
1. Go to Market Intelligence page
2. View:
   - Salary trends
   - Skill demand
   - Market competition
   - Hiring trends

**Benefits**: Stay competitive in the market

## 💡 Tips for Using AI Features

- **Be specific**: More details = better AI results
- **Review suggestions**: AI helps, but you make final decisions
- **Update regularly**: Keep your profile current for best matches
- **Combine features**: Use multiple AI tools together for best results`,
    tags: ["ai", "features", "automation"],
  },
  {
    id: "candidate-management",
    title: "Candidate Management (Admin Guide)",
    category: "Admin Tools",
    content: `# Candidate Management - Admin Guide

As an admin, you have powerful tools to manage candidates efficiently.

## Adding Candidates

### Method 1: LinkedIn Extension (Recommended)
1. Install the Vetted Chrome extension
2. Visit a LinkedIn profile
3. Click the extension icon
4. Candidate data is automatically imported
5. Review and verify the imported information

**Benefits**: One-click import, no manual data entry

### Method 2: Resume Upload
1. Go to Candidates page
2. Click **"Upload Resume"**
3. Upload PDF, DOCX, or paste text
4. AI automatically extracts:
   - Name, contact info
   - Work experience
   - Education
   - Skills
   - Certifications
5. Review and save

**Benefits**: Fast bulk importing from resumes

### Method 3: Manual Entry
1. Go to Candidates page
2. Click **"Add Candidate"**
3. Fill in candidate information
4. Save

## Managing Candidates

### Candidate List View
- **Search**: Find candidates by name, skills, company
- **Filter**: By status, location, experience level
- **Sort**: By date added, match score, name
- **Bulk Actions**: Update multiple candidates at once

### Candidate Details
View comprehensive candidate information:
- Full profile and experience
- Education and certifications
- Skills and competencies
- AI-generated summary
- Predictive score
- Engagement timeline

### Candidate Status
Track candidates through the pipeline:
- **ACTIVE**: Newly added, ready for review
- **CONTACTED**: Initial outreach sent
- **ARCHIVED**: Not currently pursuing
- **HIRED**: Successfully placed
- **REJECTED**: Not moving forward

## AI-Powered Candidate Tools

### 1. Predictive Scoring
**What**: Predicts candidate success probability

**How to use**:
1. Select a candidate
2. View their predictive score
3. See:
   - Success probability (0-100%)
   - Confidence intervals
   - Risk factors
   - Strengths

**Use cases**:
- Prioritize candidates
- Identify top talent
- Understand concerns early

### 2. Job Matching
**What**: Matches candidates to open positions

**How to use**:
1. Select a candidate
2. Click **"Match Jobs"**
3. See ranked list of matching jobs
4. View match scores and reasons

**Use cases**:
- Find best-fit roles for candidates
- Identify candidates for specific jobs
- Improve placement success

### 3. Engagement Workflows
**What**: Automated candidate outreach

**How to use**:
1. Select a candidate
2. Click **"Engagement Workflow"**
3. Choose a workflow template
4. Customize messages
5. Set timing and triggers
6. Monitor engagement

**Workflow Types**:
- Initial outreach
- Follow-up sequences
- Re-engagement campaigns
- Interview preparation

**Benefits**:
- Save time on manual outreach
- Consistent messaging
- Track engagement metrics
- Scale your efforts

### 4. Interview Preparation
**What**: Generates interview prep materials

**How to use**:
1. Select a candidate
2. Click **"Interview Prep"**
3. Select the job they're interviewing for
4. Generate:
   - Interview questions
   - Candidate prep materials
   - Discussion points

**Benefits**: Better-prepared candidates

### 5. Candidate Timeline
**What**: Tracks all candidate interactions

**How to use**:
1. Select a candidate
2. View **Timeline** tab
3. See:
   - All interactions
   - Status changes
   - Notes and comments
   - Engagement history

**Benefits**: Complete candidate history

## Best Practices

✅ **Do**:
- Keep candidate data updated
- Use AI tools to save time
- Track engagement consistently
- Add notes after interactions
- Use predictive scores to prioritize

❌ **Don't**:
- Ignore candidate updates
- Skip engagement tracking
- Forget to follow up
- Rely solely on AI (use your judgment)

## Bulk Operations

### Bulk Import
- Upload multiple resumes at once
- CSV import for candidate data
- LinkedIn extension for bulk profiles

### Bulk Actions
- Update status for multiple candidates
- Add tags or notes in bulk
- Export candidate lists
- Delete multiple candidates`,
    tags: ["admin", "candidates", "recruiting"],
  },
  {
    id: "social-features",
    title: "Social Networking Features",
    category: "Social & Networking",
    content: `# Social Networking on Vetted

Build meaningful professional connections and engage with your network.

## Building Your Network

### Making Connections
1. Go to **Network** page
2. Browse recommended connections
3. View profiles and send connection requests
4. Accept incoming requests
5. Build relationships over time

### Connection Recommendations
- AI-powered suggestions based on:
  - Industry and role
  - Mutual connections
  - Shared interests
  - Location
  - Skills

### Managing Connections
- View all connections in Network page
- Search and filter your network
- See mutual connections
- Remove connections if needed

## Creating and Sharing Content

### Making Posts
1. Go to **Feed** page
2. Click in the "What's on your mind?" box
3. Write your post (text, links, images)
4. Choose visibility (Public, Connections, Groups)
5. Post!

### Post Types
- **Text Posts**: Share thoughts and updates
- **Link Posts**: Share articles and resources
- **Image Posts**: Visual content
- **Job Posts**: Share opportunities

### Engaging with Content
- **Like**: Show appreciation
- **Comment**: Join conversations
- **Repost**: Share with your network
- **Save**: Bookmark for later

### Post Suggestions
- Get AI-powered post suggestions
- See what's trending
- Find content to share
- Discover discussion topics

## Groups

### Joining Groups
1. Go to **Groups** page
2. Browse available groups
3. Search by industry or topic
4. Click **"Join"** on groups you're interested in

### Creating Groups
1. Go to Groups page
2. Click **"Create Group"**
3. Fill in:
   - Group name
   - Description
   - Privacy settings
4. Invite members
5. Start posting

### Group Features
- **Private Groups**: Invite-only communities
- **Public Groups**: Open to everyone
- **Group Posts**: Share within groups
- **Group Discussions**: Engage with members

## Messaging

### Sending Messages
1. Go to **Messages** page
2. Click **"New Message"**
3. Select a connection
4. Write your message
5. Send

### Message Features
- **Threads**: Organized conversations
- **Message Suggestions**: AI-powered reply suggestions
- **Notifications**: Get notified of new messages
- **Search**: Find past conversations

### Best Practices
- Be professional and respectful
- Respond in a timely manner
- Use messages for meaningful conversations
- Don't spam or send unsolicited messages

## Companies

### Following Companies
1. Browse **Companies** page
2. Search for companies you're interested in
3. Click **"Follow"** on company profiles
4. See company updates in your feed

### Company Profiles
- View company information
- See job openings
- Follow company updates
- Connect with employees

## Notifications

Stay updated with:
- New connection requests
- Messages from your network
- Job recommendations
- Post engagements
- Group updates
- Company announcements

Manage notifications in Settings → Notifications`,
    tags: ["social", "networking", "connections"],
  },
  {
    id: "referral-system",
    title: "Referral System",
    category: "Features",
    content: `# Referral System Guide

Help your network find opportunities and earn recognition through referrals.

## How Referrals Work

### For Employees/Network Members
1. Go to **Referrals** page
2. Browse open positions
3. Find someone in your network who's a good fit
4. Click **"Refer Candidate"**
5. Fill in candidate information
6. Add notes about why they're a good fit
7. Submit referral

### For Recruiters/Admins
1. View all referrals in Referrals page
2. See referral status:
   - **PENDING**: Awaiting review
   - **CONTACTED**: Candidate contacted
   - **INTERVIEWED**: Interview scheduled
   - **HIRED**: Successfully placed
   - **REJECTED**: Not moving forward
3. Track referral success rates
4. Reward top referrers

## Referral Benefits

### For Referrers
- Help your network succeed
- Build stronger relationships
- Earn recognition
- See your referral success rate
- Contribute to company growth

### For Companies
- Higher quality candidates
- Faster time-to-hire
- Better cultural fit
- Reduced hiring costs
- Engaged employees

## Referral Best Practices

✅ **Do**:
- Only refer qualified candidates
- Provide context about the candidate
- Follow up on referrals
- Build relationships with candidates
- Be honest about fit

❌ **Don't**:
- Refer unqualified candidates
- Spam referrals
- Ignore referral status
- Make false claims

## Tracking Referrals

- View all your referrals
- See status updates
- Track success rates
- Monitor referral leaderboard`,
    tags: ["referrals", "network", "hiring"],
  },
  {
    id: "market-intelligence",
    title: "Market Intelligence & Insights",
    category: "Features",
    content: `# Market Intelligence Guide

Stay informed about industry trends, salaries, and market conditions.

## Market Intelligence Dashboard

Access from **Market Intelligence** page to see:

### Salary Insights
- Average salaries by role
- Salary ranges by location
- Experience level impact
- Industry comparisons
- Market trends over time

### Skill Demand Trends
- Most in-demand skills
- Emerging skills
- Skill demand by industry
- Skill growth trends
- Skill combinations that matter

### Market Competition
- Candidate supply vs. demand
- Competition levels by role
- Geographic market conditions
- Industry growth rates

### Hiring Trends
- Job posting trends
- Hiring velocity
- Time-to-fill metrics
- Application volume trends

## Using Market Intelligence

### For Job Seekers
- **Salary Negotiation**: Know your market value
- **Skill Development**: Focus on in-demand skills
- **Career Planning**: Understand market trends
- **Location Decisions**: Compare markets

### For Recruiters
- **Competitive Positioning**: Stay competitive
- **Hiring Strategy**: Understand market conditions
- **Salary Benchmarking**: Set appropriate ranges
- **Skill Sourcing**: Know what's available

## Tech Trends & Startups

### Tech Trends Tab
- Latest technology trends
- Industry news and insights
- Innovation updates
- Category filters (AI, Engineering, Startups)

### Startups to Watch Tab
- Companies that went public (IPO)
- Cutting-edge startups
- Investment opportunities
- Industry insights

Access from Feed page sidebar`,
    tags: ["market", "intelligence", "trends"],
  },
  {
    id: "search-features",
    title: "Advanced Search & Discovery",
    category: "Features",
    content: `# Search & Discovery Guide

Find people, jobs, companies, and content quickly with Vetted's powerful search.

## Universal Search

### Using the Search Bar
1. Click the search bar at the top
2. Type your query
3. See results across:
   - People
   - Jobs
   - Companies
   - Groups
   - Posts

### AI-Enhanced Search
- Understands context and intent
- Finds relevant results even with typos
- Suggests related searches
- Learns from your behavior

## Search Filters

### People Search
Filter by:
- Location
- Industry
- Current company
- Skills
- Experience level
- Education

### Job Search
Filter by:
- Location
- Job type
- Industry
- Salary range
- Experience level
- Company

### Company Search
Filter by:
- Industry
- Size
- Location
- Type

## Search Tips

✅ **Effective Searches**:
- Use specific keywords
- Combine multiple filters
- Try different search terms
- Use quotes for exact phrases
- Search by skills or technologies

❌ **Avoid**:
- Overly broad searches
- Too many filters at once
- Misspelled keywords
- Ignoring search suggestions`,
    tags: ["search", "discovery", "find"],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting Common Issues",
    category: "Troubleshooting",
    content: `# Troubleshooting Guide

Solutions to common issues on Vetted.

## Connection Issues

### Can't Send Connection Requests
- **Check**: Are you logged in?
- **Try**: Refresh the page
- **Check**: Have you reached connection limit?
- **Solution**: Wait 24 hours or contact support

### Connection Requests Not Appearing
- **Check**: Check your notifications
- **Try**: Refresh the page
- **Check**: Check spam/junk folder
- **Solution**: Clear browser cache

## Profile Issues

### Profile Not Updating
- **Try**: Clear browser cache
- **Try**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- **Check**: Are you saving changes?
- **Wait**: Changes may take a few minutes

### Profile Picture Not Uploading
- **Check**: File size (max 5MB)
- **Check**: File format (JPG, PNG)
- **Try**: Different browser
- **Try**: Compress image

## Application Issues

### Can't Apply to Jobs
- **Check**: Are you logged in?
- **Check**: Is your profile complete?
- **Try**: Upload resume in PDF format
- **Check**: Job still open?

### Application Not Submitting
- **Check**: Internet connection
- **Try**: Refresh and try again
- **Check**: All required fields filled
- **Try**: Different browser

## AI Features Not Working

### AI Suggestions Not Loading
- **Check**: Internet connection
- **Try**: Refresh the page
- **Wait**: AI processing may take time
- **Check**: Is your profile complete?

### Match Scores Not Showing
- **Check**: Profile completeness
- **Try**: Update your profile
- **Wait**: Scores update periodically
- **Contact**: Support if persistent

## General Issues

### Page Not Loading
- **Try**: Refresh the page
- **Try**: Clear browser cache
- **Try**: Different browser
- **Check**: Internet connection
- **Try**: Disable browser extensions

### Slow Performance
- **Check**: Internet speed
- **Try**: Close other tabs
- **Try**: Clear browser cache
- **Check**: Browser updates

## Getting Help

If issues persist:
1. Check this help center
2. Contact support via email
3. Report bugs through feedback
4. Check status page for outages

## Browser Compatibility

Vetted works best with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Update your browser for best experience.`,
    tags: ["troubleshooting", "support", "help"],
  },
]

const categories = [
  "All",
  "Getting Started",
  "Profile & Networking",
  "Jobs & Applications",
  "AI Features",
  "Admin Tools",
  "Social & Networking",
  "Features",
  "Troubleshooting",
]

export default function HelpContent() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(
    helpArticles.find((a) => a.quickStart) || null
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

  const renderContent = (content: string) => {
    // Simple markdown-like rendering
    const lines = content.split("\n")
    const elements: JSX.Element[] = []
    let currentList: string[] = []
    let inCodeBlock = false

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith("# ")) {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {currentList.map((item, i) => (
                <li key={i} className="text-gray-700">{item}</li>
              ))}
            </ul>
          )
          currentList = []
        }
        elements.push(
          <h2 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-4">
            {line.replace("# ", "")}
          </h2>
        )
      } else if (line.startsWith("## ")) {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {currentList.map((item, i) => (
                <li key={i} className="text-gray-700">{item}</li>
              ))}
            </ul>
          )
          currentList = []
        }
        elements.push(
          <h3 key={index} className="text-xl font-semibold text-gray-900 mt-5 mb-3">
            {line.replace("## ", "")}
          </h3>
        )
      } else if (line.startsWith("### ")) {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {currentList.map((item, i) => (
                <li key={i} className="text-gray-700">{item}</li>
              ))}
            </ul>
          )
          currentList = []
        }
        elements.push(
          <h4 key={index} className="text-lg font-medium text-gray-900 mt-4 mb-2">
            {line.replace("### ", "")}
          </h4>
        )
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        currentList.push(line.replace(/^[-*] /, ""))
      } else if (line.startsWith("**") && line.endsWith("**")) {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {currentList.map((item, i) => (
                <li key={i} className="text-gray-700">{item}</li>
              ))}
            </ul>
          )
          currentList = []
        }
        const text = line.replace(/\*\*/g, "")
        elements.push(
          <p key={index} className="font-semibold text-gray-900 mb-2">
            {text}
          </p>
        )
      } else if (line.trim() === "") {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {currentList.map((item, i) => (
                <li key={i} className="text-gray-700">{item}</li>
              ))}
            </ul>
          )
          currentList = []
        }
      } else if (line.startsWith("✅") || line.startsWith("❌")) {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {currentList.map((item, i) => (
                <li key={i} className="text-gray-700">{item}</li>
              ))}
            </ul>
          )
          currentList = []
        }
        elements.push(
          <p key={index} className="text-gray-700 mb-2">
            {line}
          </p>
        )
      } else if (line.trim() !== "") {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {currentList.map((item, i) => (
                <li key={i} className="text-gray-700">{item}</li>
              ))}
            </ul>
          )
          currentList = []
        }
        elements.push(
          <p key={index} className="text-gray-700 mb-4 leading-relaxed">
            {line}
          </p>
        )
      }
    })

    if (currentList.length > 0) {
      elements.push(
        <ul key="final-list" className="list-disc list-inside mb-4 space-y-1">
          {currentList.map((item, i) => (
            <li key={i} className="text-gray-700">{item}</li>
          ))}
        </ul>
      )
    }

    return <div>{elements}</div>
  }

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
                onClick={() => {
                  setSelectedCategory(category)
                  setSelectedArticle(null)
                }}
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
            <div className="max-h-96 overflow-y-auto">
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
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
              {renderContent(selectedArticle.content)}
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
              Welcome to Vetted Help Center
            </h2>
            <p className="text-gray-600 mb-4">
              Select an article from the sidebar to get started, or use the search bar to find what you're looking for.
            </p>
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Quick Start Guides
              </h3>
              <div className="space-y-2">
                {helpArticles
                  .filter((a) => a.quickStart)
                  .map((article) => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {article.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {article.category}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
