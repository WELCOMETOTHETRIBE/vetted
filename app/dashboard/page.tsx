"use client"

import { useState, useEffect } from 'react'
import {
  ProgressRing,
  InteractiveBarChart,
  AnimatedCounter,
  SparklineChart,
  ActivityHeatmap,
  GaugeChart,
  MetricCard,
  NetworkGraph
} from '@/components/DataVisualization'
import {
  HoverMorph,
  LiquidButton,
  MagneticElement,
  ParallaxElement,
  StaggerContainer,
  MorphingFAB,
  CursorFollower
} from '@/components/AdvancedAnimations'
import { useTheme } from '@/components/Providers'

// Mock data for demonstration
const mockActivityData = Array.from({ length: 365 }, (_, i) => ({
  date: new Date(Date.now() - (364 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  value: Math.floor(Math.random() * 20)
}))

const mockBarData = [
  { label: 'Mon', value: 120 },
  { label: 'Tue', value: 150 },
  { label: 'Wed', value: 180 },
  { label: 'Thu', value: 140 },
  { label: 'Fri', value: 200 },
  { label: 'Sat', value: 90 },
  { label: 'Sun', value: 110 }
]

const mockSparklineData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 100) + 50)

const mockNetworkData = {
  nodes: [
    { id: '1', label: 'You', x: 400, y: 300, size: 30 },
    { id: '2', label: 'Alice', x: 200, y: 200, size: 20 },
    { id: '3', label: 'Bob', x: 600, y: 200, size: 20 },
    { id: '4', label: 'Charlie', x: 300, y: 100, size: 18 },
    { id: '5', label: 'Diana', x: 500, y: 100, size: 18 },
    { id: '6', label: 'Eve', x: 350, y: 450, size: 16 },
    { id: '7', label: 'Frank', x: 550, y: 450, size: 16 }
  ],
  connections: [
    { from: '1', to: '2' },
    { from: '1', to: '3' },
    { from: '1', to: '6' },
    { from: '1', to: '7' },
    { from: '2', to: '4' },
    { from: '3', to: '5' },
    { from: '4', to: '5' },
    { from: '6', to: '7' }
  ]
}

export default function Dashboard() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-content-secondary">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <CursorFollower>
      <div className="min-h-screen bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-primary">
        {/* Header */}
        <header className="glass-elevated sticky top-0 z-40 border-b border-surface-tertiary/50">
          <div className="container-fluid">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <h1 className="text-2xl font-bold text-gradient">Dashboard</h1>

                {/* Navigation Tabs */}
                <nav className="hidden md:flex items-center space-x-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: '📊' },
                    { id: 'analytics', label: 'Analytics', icon: '📈' },
                    { id: 'network', label: 'Network', icon: '👥' },
                    { id: 'activity', label: 'Activity', icon: '⚡' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
                          : 'text-content-secondary hover:bg-surface-secondary hover:text-content-primary'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-xl hover:bg-surface-secondary transition-colors">
                  <svg className="w-5 h-5 text-content-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7V4a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2m0 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="p-2 rounded-xl hover:bg-surface-secondary transition-colors">
                  <svg className="w-5 h-5 text-content-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container-fluid py-8">
          {activeTab === 'overview' && (
            <StaggerContainer className="space-y-8">
              {/* Welcome Section */}
              <div className="text-center py-12">
                <ParallaxElement speed={0.2}>
                  <h2 className="text-fluid-4xl font-bold mb-4 text-gradient">
                    Welcome back, John! 👋
                  </h2>
                  <p className="text-fluid-xl text-content-secondary max-w-2xl mx-auto">
                    Here's what's happening with your professional network today
                  </p>
                </ParallaxElement>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <HoverMorph>
                  <MetricCard
                    title="Profile Views"
                    value={2847}
                    previousValue={2650}
                    icon="👁️"
                  />
                </HoverMorph>
                <HoverMorph>
                  <MetricCard
                    title="Connections"
                    value={156}
                    previousValue={148}
                    icon="🤝"
                  />
                </HoverMorph>
                <HoverMorph>
                  <MetricCard
                    title="Messages"
                    value={23}
                    previousValue={18}
                    icon="💬"
                  />
                </HoverMorph>
                <HoverMorph>
                  <MetricCard
                    title="Opportunities"
                    value={8}
                    previousValue={12}
                    icon="🎯"
                  />
                </HoverMorph>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Activity */}
                <HoverMorph className="card-modern p-6">
                  <h3 className="text-xl font-bold mb-6 text-content-primary">Weekly Activity</h3>
                  <InteractiveBarChart data={mockBarData} height={200} />
                </HoverMorph>

                {/* Progress Rings */}
                <HoverMorph className="card-modern p-6">
                  <h3 className="text-xl font-bold mb-6 text-content-primary">Goals Progress</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <ProgressRing progress={78} label="Profile Completion" />
                    <ProgressRing progress={65} label="Network Growth" />
                    <ProgressRing progress={92} label="Response Rate" />
                    <ProgressRing progress={45} label="Skill Development" />
                  </div>
                </HoverMorph>
              </div>

              {/* Sparkline and Gauge */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <HoverMorph className="card-modern p-6 lg:col-span-2">
                  <h3 className="text-xl font-bold mb-6 text-content-primary">Engagement Trend</h3>
                  <SparklineChart data={mockSparklineData} width={600} height={120} />
                </HoverMorph>

                <HoverMorph className="card-modern p-6">
                  <h3 className="text-xl font-bold mb-6 text-content-primary">Network Health</h3>
                  <GaugeChart value={85} label="Connection Quality" />
                </HoverMorph>
              </div>
            </StaggerContainer>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="text-center py-8">
                <h2 className="text-fluid-4xl font-bold mb-4 text-gradient">
                  Advanced Analytics 📊
                </h2>
                <p className="text-fluid-lg text-content-secondary">
                  Deep insights into your professional performance
                </p>
              </div>

              {/* Activity Heatmap */}
              <HoverMorph className="card-modern p-8">
                <h3 className="text-2xl font-bold mb-6 text-content-primary">Activity Heatmap</h3>
                <ActivityHeatmap data={mockActivityData} />
              </HoverMorph>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <HoverMorph className="card-modern p-6 text-center">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    <AnimatedCounter value={12750} />
                  </div>
                  <div className="text-content-secondary">Profile Impressions</div>
                  <div className="text-sm text-success-600 mt-2">+12.5% from last month</div>
                </HoverMorph>

                <HoverMorph className="card-modern p-6 text-center">
                  <div className="text-4xl font-bold text-success-600 mb-2">
                    <AnimatedCounter value={94} />%
                  </div>
                  <div className="text-content-secondary">Connection Acceptance</div>
                  <div className="text-sm text-success-600 mt-2">Above average</div>
                </HoverMorph>

                <HoverMorph className="card-modern p-6 text-center">
                  <div className="text-4xl font-bold text-warning-600 mb-2">
                    <AnimatedCounter value={4.2} />
                  </div>
                  <div className="text-content-secondary">Avg Response Time</div>
                  <div className="text-sm text-content-tertiary mt-2">Hours</div>
                </HoverMorph>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-8">
              <div className="text-center py-8">
                <h2 className="text-fluid-4xl font-bold mb-4 text-gradient">
                  Your Network 👥
                </h2>
                <p className="text-fluid-lg text-content-secondary">
                  Visualize and manage your professional connections
                </p>
              </div>

              {/* Network Graph */}
              <HoverMorph className="card-modern p-8">
                <h3 className="text-2xl font-bold mb-6 text-content-primary">Connection Network</h3>
                <NetworkGraph nodes={mockNetworkData.nodes} connections={mockNetworkData.connections} />
              </HoverMorph>

              {/* Network Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <HoverMorph className="card-modern p-6 text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">156</div>
                  <div className="text-content-secondary">1st Connections</div>
                </HoverMorph>
                <HoverMorph className="card-modern p-6 text-center">
                  <div className="text-3xl font-bold text-secondary-600 mb-2">2,847</div>
                  <div className="text-content-secondary">2nd Connections</div>
                </HoverMorph>
                <HoverMorph className="card-modern p-6 text-center">
                  <div className="text-3xl font-bold text-success-600 mb-2">89</div>
                  <div className="text-content-secondary">Mutual Groups</div>
                </HoverMorph>
                <HoverMorph className="card-modern p-6 text-center">
                  <div className="text-3xl font-bold text-warning-600 mb-2">23</div>
                  <div className="text-content-secondary">Pending Invites</div>
                </HoverMorph>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-8">
              <div className="text-center py-8">
                <h2 className="text-fluid-4xl font-bold mb-4 text-gradient">
                  Recent Activity ⚡
                </h2>
                <p className="text-fluid-lg text-content-secondary">
                  Your latest professional interactions and updates
                </p>
              </div>

              {/* Activity Feed */}
              <div className="space-y-4">
                {[
                  { type: 'connection', message: 'You connected with Sarah Johnson', time: '2 hours ago', icon: '🤝' },
                  { type: 'view', message: 'TechCorp viewed your profile', time: '4 hours ago', icon: '👁️' },
                  { type: 'message', message: 'New message from Mike Chen', time: '6 hours ago', icon: '💬' },
                  { type: 'like', message: 'Alice Cooper liked your post', time: '8 hours ago', icon: '👍' },
                  { type: 'comment', message: 'Bob Wilson commented on your update', time: '1 day ago', icon: '💭' },
                  { type: 'share', message: 'Diana Prince shared your article', time: '1 day ago', icon: '🔗' }
                ].map((activity, index) => (
                  <HoverMorph key={index} className="card-modern p-6 animate-on-scroll">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{activity.icon}</div>
                      <div className="flex-1">
                        <p className="text-content-primary font-medium">{activity.message}</p>
                        <p className="text-sm text-content-secondary">{activity.time}</p>
                      </div>
                      <MagneticElement>
                        <button className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                          <svg className="w-4 h-4 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </MagneticElement>
                    </div>
                  </HoverMorph>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Floating Action Button */}
        <MorphingFAB
          icon={<span className="text-xl">+</span>}
          onClick={() => console.log('FAB clicked')}
        />

        {/* Theme Toggle FAB */}
        <div className="fixed bottom-6 left-6 z-50">
          <LiquidButton
            onClick={() => console.log('Theme toggle')}
            className="w-12 h-12 rounded-full bg-surface-elevated shadow-lg"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </LiquidButton>
        </div>
      </div>
    </CursorFollower>
  )
}
