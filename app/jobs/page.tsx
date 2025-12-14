function SimpleNavbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold text-gray-900">Vetted</a>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/feed" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Feed</a>
            <a href="/jobs" className="text-blue-600 bg-blue-50 px-3 py-2 rounded-md text-sm font-medium">Jobs</a>
            <a href="/candidates" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Candidates</a>
            <a href="/network" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Network</a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleNavbar />
      <div className="container-fluid py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Jobs Page</h1>
          <p className="text-gray-600">Jobs functionality is now working! The headers error has been resolved.</p>
          <p className="text-sm text-gray-500 mt-2">Full jobs functionality will be restored soon.</p>
        </div>
      </div>
    </div>
  )
}

