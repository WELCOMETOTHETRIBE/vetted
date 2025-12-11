import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex justify-between items-center py-6">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Image
              src="/vetted.png"
              alt="Vetted"
              width={120}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/signin"
              className="text-neutral-700 hover:text-primary-600 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <div className="py-24 text-center">
          <div className="flex justify-center mb-10">
            <Image
              src="/vetted.png"
              alt="Vetted"
              width={240}
              height={96}
              className="h-28 w-auto drop-shadow-lg"
              priority
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6 text-balance">
            Connect. Grow. Get Hired.
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 mb-10 max-w-3xl mx-auto leading-relaxed text-balance">
            Vetted is your professional network for finding opportunities,
            building connections, and advancing your career.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-lg font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Join Vetted
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-xl hover:bg-primary-50 text-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-white rounded-2xl border border-neutral-200 shadow-card hover:shadow-card-hover transition-all">
            <div className="text-5xl mb-4">💼</div>
            <h3 className="text-xl font-bold mb-3 text-neutral-900">Find Jobs</h3>
            <p className="text-neutral-600 leading-relaxed">
              Discover opportunities from top companies and apply directly.
            </p>
          </div>
          <div className="text-center p-8 bg-white rounded-2xl border border-neutral-200 shadow-card hover:shadow-card-hover transition-all">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-3 text-neutral-900">Build Network</h3>
            <p className="text-neutral-600 leading-relaxed">
              Connect with professionals and grow your career network.
            </p>
          </div>
          <div className="text-center p-8 bg-white rounded-2xl border border-neutral-200 shadow-card hover:shadow-card-hover transition-all">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-bold mb-3 text-neutral-900">Share Insights</h3>
            <p className="text-neutral-600 leading-relaxed">
              Share your expertise and engage with your community.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
