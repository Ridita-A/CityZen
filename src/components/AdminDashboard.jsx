import { useState } from 'react';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { 
  Users, 
  FileText, 
  Shield, 
  AlertOctagon, 
  Ban,
  TrendingUp,
  BarChart3,
  PieChart
} from 'lucide-react';

export default function AdminDashboard({ onLogout, darkMode, toggleDarkMode }) {
  const [activeTab, setActiveTab] = useState('users');

  const stats = {
    totalUsers: 1247,
    totalComplaints: 856,
    spamReports: 23,
    bannedUsers: 5
  };

  const users = [
    { id: 1, name: 'Alex Johnson', email: 'alex@email.com', role: 'Citizen', complaints: 12, joinDate: 'Nov 2025', status: 'Active' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@email.com', role: 'Citizen', complaints: 8, joinDate: 'Nov 2025', status: 'Active' },
    { id: 3, name: 'Mike Brown', email: 'mike@email.com', role: 'Authority', complaints: 0, joinDate: 'Oct 2025', status: 'Active' },
    { id: 4, name: 'Lisa Davis', email: 'lisa@email.com', role: 'Citizen', complaints: 5, joinDate: 'Dec 2025', status: 'Active' }
  ];

  const spamReports = [
    { id: 1, complaintId: 'C-042', reporter: 'User #3421', reason: 'Duplicate submission', date: '1 day ago' },
    { id: 2, complaintId: 'C-087', reporter: 'User #5632', reason: 'Inappropriate content', date: '2 days ago' },
    { id: 3, complaintId: 'C-123', reporter: 'User #8765', reason: 'False information', date: '3 days ago' }
  ];

  const bannedUsers = [
    { id: 1, name: 'John Doe', email: 'john@email.com', reason: 'Spam complaints', bannedDate: 'Dec 1, 2025' },
    { id: 2, name: 'Jane Wilson', email: 'jane@email.com', reason: 'Inappropriate content', bannedDate: 'Nov 28, 2025' }
  ];

  const handleUserAction = (userId, action) => {
    alert(`${action} user ${userId}`);
  };

  const handleSpamAction = (reportId, action) => {
    alert(`${action} spam report ${reportId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl mb-2 text-gray-800 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, complaints, and platform moderation
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <Users className="w-6 h-6 text-[#1E88E5]" />
              </div>
            </div>
            <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.totalUsers}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.totalComplaints}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Complaints</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <AlertOctagon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.spamReports}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Spam Reports</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.bannedUsers}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Banned Users</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition ${
                  activeTab === 'users'
                    ? 'border-b-2 border-[#1E88E5] text-[#1E88E5]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Users className="w-5 h-5" />
                User Management
              </button>
              <button
                onClick={() => setActiveTab('complaints')}
                className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition ${
                  activeTab === 'complaints'
                    ? 'border-b-2 border-[#1E88E5] text-[#1E88E5]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <FileText className="w-5 h-5" />
                Complaint Moderation
              </button>
              <button
                onClick={() => setActiveTab('spam')}
                className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition ${
                  activeTab === 'spam'
                    ? 'border-b-2 border-[#1E88E5] text-[#1E88E5]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <AlertOctagon className="w-5 h-5" />
                Spam Reports
              </button>
              <button
                onClick={() => setActiveTab('banned')}
                className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition ${
                  activeTab === 'banned'
                    ? 'border-b-2 border-[#1E88E5] text-[#1E88E5]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Ban className="w-5 h-5" />
                Banned Users
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div>
                <h3 className="text-lg mb-4 text-gray-800 dark:text-white">All Users</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Name</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Email</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Role</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Complaints</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Joined</th>
                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{user.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.complaints}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.joinDate}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUserAction(user.id, 'View')}
                                className="text-[#1E88E5] hover:underline"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleUserAction(user.id, 'Suspend')}
                                className="text-red-600 hover:underline"
                              >
                                Suspend
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Complaint Moderation Tab */}
            {activeTab === 'complaints' && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Complaint moderation queue will be displayed here</p>
              </div>
            )}

            {/* Spam Reports Tab */}
            {activeTab === 'spam' && (
              <div>
                <h3 className="text-lg mb-4 text-gray-800 dark:text-white">Recent Spam Reports</h3>
                <div className="space-y-3">
                  {spamReports.map((report) => (
                    <div key={report.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-start justify-between">
                      <div>
                        <p className="text-gray-800 dark:text-white mb-1">
                          Complaint <strong>{report.complaintId}</strong> reported by {report.reporter}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Reason: {report.reason}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{report.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSpamAction(report.id, 'Review')}
                          className="px-3 py-1 bg-[#1E88E5] text-white rounded hover:bg-[#1565C0] transition text-sm"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleSpamAction(report.id, 'Dismiss')}
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition text-sm"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Banned Users Tab */}
            {activeTab === 'banned' && (
              <div>
                <h3 className="text-lg mb-4 text-gray-800 dark:text-white">Banned Users</h3>
                <div className="space-y-3">
                  {bannedUsers.map((user) => (
                    <div key={user.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-start justify-between">
                      <div>
                        <p className="text-gray-800 dark:text-white mb-1">
                          <strong>{user.name}</strong> ({user.email})
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Reason: {user.reason}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Banned on {user.bannedDate}</p>
                      </div>
                      <button
                        onClick={() => alert(`Unban ${user.name}`)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                      >
                        Unban
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl mb-4 text-gray-800 dark:text-white">Category Distribution</h2>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 text-center">
              <PieChart className="w-16 h-16 text-[#1E88E5] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Pie chart showing complaint categories</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl mb-4 text-gray-800 dark:text-white">Monthly Trends</h2>
            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg p-8 text-center">
              <BarChart3 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Bar chart showing monthly complaint trends</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
