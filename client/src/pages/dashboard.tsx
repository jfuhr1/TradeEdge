import { Link } from "wouter";

// Temporary dashboard that doesn't require auth to display
export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Stock Picks Dashboard</h1>
        <p className="text-center text-gray-600 mb-8">
          Welcome to the Stock Picks platform! We're currently working on setting up the authentication system.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-xl font-semibold mb-3">Latest Stock Alerts</h2>
            <p className="text-gray-600">
              Our premium stock alerts will be visible here once authentication is set up.
            </p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h2 className="text-xl font-semibold mb-3">Portfolio Performance</h2>
            <p className="text-gray-600">
              Track your simulated portfolio performance with our tools.
            </p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h2 className="text-xl font-semibold mb-3">Educational Resources</h2>
            <p className="text-gray-600">
              Access our educational content to improve your trading skills.
            </p>
          </div>
          
          <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
            <h2 className="text-xl font-semibold mb-3">Coaching Sessions</h2>
            <p className="text-gray-600">
              Book one-on-one coaching sessions with our expert traders.
            </p>
          </div>
        </div>
        
        <div className="flex justify-center mt-4">
          <Link href="/auth">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
              Go to Login Page
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
