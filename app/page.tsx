import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex justify-between items-center py-6">
          <Link href="/" className="flex items-center space-x-3">
            <img
              src="/vetted.png"
              alt="Vetted"
              className="h-12 w-auto"
            />
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/signin"
              className="text-gray-700 hover:text-blue-600"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <div className="py-20 text-center">
          <div className="flex justify-center mb-8">
            <img
              src="/vetted.png"
              alt="Vetted"
              className="h-24 w-auto"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Connect. Grow. Get Hired.
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Vetted is your professional network for finding opportunities,
            building connections, and advancing your career.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold"
            >
              Join Vetted
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 text-lg font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-xl font-semibold mb-2">Find Jobs</h3>
            <p className="text-gray-600">
              Discover opportunities from top companies and apply directly.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Build Network</h3>
            <p className="text-gray-600">
              Connect with professionals and grow your career network.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">Share Insights</h3>
            <p className="text-gray-600">
              Share your expertise and engage with your community.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
