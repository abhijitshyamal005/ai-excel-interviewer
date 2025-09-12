import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                AI Excel Interviewer
              </h1>
            </div>
            <nav className="flex space-x-4">
              <Link 
                href="/interview" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Start Assessment
              </Link>
              <Link 
                href="/admin" 
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md transition duration-200"
              >
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Excel
            <span className="text-blue-600 block">Skills Assessment</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience the future of technical interviews with our intelligent AI system that evaluates 
            Excel proficiency through natural conversation and provides comprehensive feedback.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/interview"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-200 shadow-lg"
            >
              Take Assessment Now
            </Link>
            <Link 
              href="#features"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our AI Assessment?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our advanced AI system provides consistent, fair, and comprehensive evaluation 
              of Excel skills across all proficiency levels.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Intelligent Evaluation
              </h3>
              <p className="text-gray-600">
                Advanced AI analyzes responses for technical accuracy, syntax correctness, 
                and practical understanding with partial credit for alternative approaches.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Natural Conversation
              </h3>
              <p className="text-gray-600">
                Experience a real interview feel with our conversational AI that adapts 
                questions based on your responses and maintains engaging dialogue.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Comprehensive Reports
              </h3>
              <p className="text-gray-600">
                Receive detailed performance analysis with skill breakdowns, strengths, 
                improvement areas, and hiring recommendations.
              </p>
            </div>
          </div>
        </section>

        {/* Skills Covered */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Excel Skills We Assess
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive evaluation across all Excel proficiency levels
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Basic Formulas", items: ["SUM, AVERAGE, COUNT", "IF statements", "Cell references", "Basic formatting"] },
              { title: "Data Manipulation", items: ["Sorting & filtering", "Data validation", "Text functions", "Date calculations"] },
              { title: "Pivot Tables", items: ["Creating pivot tables", "Grouping data", "Calculated fields", "Pivot charts"] },
              { title: "Advanced Functions", items: ["VLOOKUP/XLOOKUP", "INDEX/MATCH", "Array formulas", "Conditional formatting"] },
            ].map((skill, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {skill.title}
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {skill.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-20 bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Showcase Your Excel Skills?
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Join thousands of professionals who have used our AI assessment to demonstrate their Excel expertise.
          </p>
          <Link 
            href="/interview"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition duration-200 inline-block"
          >
            Start Your Assessment
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 AI Excel Interviewer. Revolutionizing technical assessments with artificial intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}