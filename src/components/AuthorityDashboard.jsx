import { useState } from 'react';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  MapPin,
  Calendar,
  Filter
} from 'lucide-react';

export default function AuthorityDashboard({ onLogout, darkMode, toggleDarkMode }) {
  const [selectedPriority, setSelectedPriority] = useState('All');
  
  const stats = {
    assigned: 15,
    inProgress: 6,
    todayDeadlines: 3,
    resolved: 42
  };

  const complaints = [
    {
      id: 'C-001',
      title: 'Pothole on Main Street',
      category: 'Roads & Infrastructure',
      area: 'Ward 3 - South',
      priority: 24,
      status: 'Assigned',
      date: '2 days ago'
    },
    {
      id: 'C-002',
      title: 'Water Pipe Leak',
      category: 'Water Supply',
      area: 'Ward 4 - East',
      priority: 31,
      status: 'In Progress',
      date: '1 week ago'
    },
    {
      id: 'C-003',
      title: 'Garbage Collection Delay',
      category: 'Waste Management',
      area: 'Ward 1 - Central',
      priority: 18,
      status: 'Assigned',
      date: '3 days ago'
    },
    {
      id: 'C-004',
      title: 'Drainage Blockage',
      category: 'Drainage',
      area: 'Ward 5 - West',
      priority: 15,
      status: 'In Progress',
      date: '1 week ago'
    },
    {
      id: 'C-005',
      title: 'Street Light Repair',
      category: 'Street Lights',
      area: 'Ward 2 - North',
      priority: 12,
      status: 'Assigned',
      date: '4 days ago'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'In Progress':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Resolved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    if (priority >= 25) return 'text-red-600 dark:text-red-400';
    if (priority >= 15) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const handleAction = (id, action) => {
    alert(`${action} complaint ${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl mb-2 text-gray-800 dark:text-white">Authority Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and resolve citizen complaints
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-[#1E88E5]" />
              </div>
            </div>
            <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.assigned}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Assigned to You</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.inProgress}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.todayDeadlines}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Today&apos;s Deadlines</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl mb-1 text-gray-800 dark:text-white">{stats.resolved}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Resolved This Month</p>
          </div>
        </div>

        {/* Complaints Queue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl text-gray-800 dark:text-white">Complaint Queue</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                <Filter className="w-5 h-5" />
                Filter
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {complaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {complaint.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {complaint.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {complaint.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {complaint.area}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`w-4 h-4 ${getPriorityColor(complaint.priority)}`} />
                        <span className={getPriorityColor(complaint.priority)}>{complaint.priority}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select 
                        onChange={(e) => handleAction(complaint.id, e.target.value)}
                        className="px-3 py-1 bg-[#1E88E5] text-white rounded-lg hover:bg-[#1565C0] transition cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>Action</option>
                        <option value="Accept">Accept</option>
                        <option value="Start">Mark In Progress</option>
                        <option value="Resolve">Mark Resolved</option>
                        <option value="View">View Details</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-4">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{complaint.id}</p>
                    <h3 className="text-gray-800 dark:text-white mb-2">{complaint.title}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    {complaint.area}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className={`w-4 h-4 ${getPriorityColor(complaint.priority)}`} />
                    <span className={getPriorityColor(complaint.priority)}>Priority: {complaint.priority}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {complaint.date}
                  </div>
                </div>

                <select 
                  onChange={(e) => handleAction(complaint.id, e.target.value)}
                  className="w-full px-3 py-2 bg-[#1E88E5] text-white rounded-lg hover:bg-[#1565C0] transition cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Select Action</option>
                  <option value="Accept">Accept</option>
                  <option value="Start">Mark In Progress</option>
                  <option value="Resolve">Mark Resolved</option>
                  <option value="View">View Details</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Placeholder */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl mb-4 text-gray-800 dark:text-white">Performance Analytics</h2>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 text-center">
            <TrendingUp className="w-16 h-16 text-[#1E88E5] mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Heat maps and analytics charts will be displayed here
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
