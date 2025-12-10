import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { User, MapPin, FileText, CheckCircle, Clock, AlertCircle, Edit, Moon, Sun, LogOut } from 'lucide-react';

export default function Profile({ onLogout, darkMode, toggleDarkMode, userRole }) {
  const userData = {
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    ward: 'Ward 3 - South District',
    anonymousId: 'User #4532',
    joinedDate: 'November 2025',
    stats: {
      total: 12,
      resolved: 8,
      pending: 3,
      inProgress: 1
    }
  };

  const recentComplaints = [
    { id: 1, title: 'Pothole on Main Street', status: 'In Progress', date: '2 days ago' },
    { id: 2, title: 'Garbage Collection Delay', status: 'Pending', date: '3 days ago' },
    { id: 3, title: 'Broken Street Light', status: 'Resolved', date: '5 days ago' },
    { id: 4, title: 'Water Pipe Leak', status: 'In Review', date: '1 week ago' }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'In Progress':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'Pending':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'In Review':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'In Progress':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Resolved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl mb-2 text-gray-800 dark:text-white">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account and view your activity
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-[#1E88E5] to-[#1565C0] rounded-full flex items-center justify-center text-white text-3xl">
                  {userData.name.charAt(0)}
                </div>
              </div>

              {/* User Info */}
              <div className="text-center mb-6">
                <h2 className="text-2xl mb-1 text-gray-800 dark:text-white">{userData.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{userData.email}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-[#1E88E5] rounded-full text-sm mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>{userData.ward}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Public ID: <strong>{userData.anonymousId}</strong>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Member since {userData.joinedDate}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Role</p>
                <div className="inline-block px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-sm capitalize">
                  {userRole}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1E88E5] hover:bg-[#1565C0] text-white rounded-lg transition">
                  <Edit className="w-5 h-5" />
                  Edit Profile
                </button>

                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl mb-4 text-gray-800 dark:text-white">Activity Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="w-8 h-8 text-[#1E88E5] mx-auto mb-2" />
                  <p className="text-2xl text-gray-800 dark:text-white mb-1">{userData.stats.total}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Filed</p>
                </div>

                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl text-gray-800 dark:text-white mb-1">{userData.stats.resolved}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                </div>

                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl text-gray-800 dark:text-white mb-1">{userData.stats.inProgress}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                </div>

                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl text-gray-800 dark:text-white mb-1">{userData.stats.pending}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                </div>
              </div>
            </div>

            {/* Recent Complaints */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl mb-4 text-gray-800 dark:text-white">My Recent Complaints</h2>
              <div className="space-y-3">
                {recentComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(complaint.status)}
                      <div>
                        <p className="text-gray-800 dark:text-white mb-1">{complaint.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{complaint.date}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg mb-2 text-gray-800 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-[#1E88E5]" />
                Privacy & Anonymity
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your real identity is protected. Only your anonymous user ID ({userData.anonymousId}) is 
                visible to other users when you file complaints or comment. Authorities may access your 
                contact information only for official follow-up purposes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
