import { Link } from 'react-router-dom';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { FileText, List, CheckCircle, Clock, AlertCircle, TrendingUp, PlusCircle } from 'lucide-react';

export default function Home({ onLogout, darkMode, toggleDarkMode }) {
  const userName = 'Alex';
  const stats = {
    total: 12,
    resolved: 8,
    pending: 3,
    inProgress: 1
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2 text-gray-800 dark:text-white">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let&apos;s make our city better together
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/submit"
            className="bg-gradient-to-br from-[#1E88E5] to-[#1565C0] text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <PlusCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl mb-1">Submit Complaint</h3>
                <p className="text-blue-100 text-sm">Report a new issue</p>
              </div>
            </div>
          </Link>

          <Link
            to="/feed"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <List className="w-8 h-8 text-[#1E88E5]" />
              </div>
              <div>
                <h3 className="text-xl mb-1 text-gray-800 dark:text-white">View Complaints</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Browse all reports</p>
              </div>
            </div>
          </Link>

          <Link
            to="/feed"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl mb-1 text-gray-800 dark:text-white">My Complaints</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Track your reports</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <h2 className="text-xl mb-4 text-gray-800 dark:text-white">Your Activity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-[#1E88E5]" />
                </div>
              </div>
              <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Filed</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.resolved}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.inProgress}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.pending}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl mb-4 text-gray-800 dark:text-white">Recent Updates</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 dark:text-white mb-1">
                  Your complaint about <strong>Broken Street Light</strong> has been resolved
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 dark:text-white mb-1">
                  Your complaint about <strong>Pothole on Main St</strong> is now in progress
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">1 day ago</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                <AlertCircle className="w-6 h-6 text-[#1E88E5]" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 dark:text-white mb-1">
                  Your complaint about <strong>Garbage Collection Delay</strong> has been accepted
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">3 days ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* City Illustration */}
        <div className="mt-8 flex justify-center opacity-30">
          <svg viewBox="0 0 600 200" className="w-full max-w-2xl">
            <rect x="50" y="100" width="50" height="100" fill="#1E88E5" opacity="0.3" />
            <rect x="120" y="80" width="60" height="120" fill="#1E88E5" opacity="0.4" />
            <rect x="200" y="110" width="45" height="90" fill="#1E88E5" opacity="0.3" />
            <rect x="265" y="60" width="70" height="140" fill="#1E88E5" opacity="0.5" />
            <rect x="355" y="90" width="50" height="110" fill="#1E88E5" opacity="0.4" />
            <rect x="425" y="100" width="55" height="100" fill="#1E88E5" opacity="0.3" />
            <rect x="500" y="70" width="65" height="130" fill="#1E88E5" opacity="0.4" />
          </svg>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
