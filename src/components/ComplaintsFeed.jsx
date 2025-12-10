import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { Search, Filter, MapPin, Heart, Calendar } from 'lucide-react';

export default function ComplaintsFeed({ onLogout, darkMode, toggleDarkMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const complaints = [
    {
      id: 1,
      title: 'Pothole on Main Street',
      category: 'Roads & Infrastructure',
      area: 'Ward 3 - South District',
      status: 'In Progress',
      image: 'https://images.unsplash.com/photo-1709934730506-fba12664d4e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3Rob2xlJTIwcm9hZCUyMGRhbWFnZXxlbnwxfHx8fDE3NjUwNTI3NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      upvotes: 24,
      date: '2 days ago'
    },
    {
      id: 2,
      title: 'Garbage Collection Delay',
      category: 'Waste Management',
      area: 'Ward 1 - Central',
      status: 'Pending',
      image: 'https://images.unsplash.com/photo-1580767114670-c778cc443675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJiYWdlJTIwd2FzdGUlMjBzdHJlZXR8ZW58MXx8fHwxNzY1MTE0MDk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      upvotes: 18,
      date: '3 days ago'
    },
    {
      id: 3,
      title: 'Broken Street Light',
      category: 'Street Lights',
      area: 'Ward 2 - North',
      status: 'Resolved',
      image: 'https://images.unsplash.com/photo-1685992830281-2eef1f9bd3e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicm9rZW4lMjBzdHJlZXRsaWdodCUyMG5pZ2h0fGVufDF8fHx8MTc2NTExNDA5OHww&ixlib=rb-4.1.0&q=80&w=1080',
      upvotes: 12,
      date: '5 days ago'
    },
    {
      id: 4,
      title: 'Water Pipe Leak',
      category: 'Water Supply',
      area: 'Ward 4 - East',
      status: 'In Review',
      image: 'https://images.unsplash.com/photo-1720889589894-497c4f4f569e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMGxlYWslMjBwaXBlfGVufDF8fHx8MTc2NTExNDA5OHww&ixlib=rb-4.1.0&q=80&w=1080',
      upvotes: 31,
      date: '1 week ago'
    },
    {
      id: 5,
      title: 'Drainage Blockage',
      category: 'Drainage',
      area: 'Ward 5 - West',
      status: 'In Progress',
      image: 'https://images.unsplash.com/photo-1580767114670-c778cc443675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJiYWdlJTIwd2FzdGUlMjBzdHJlZXR8ZW58MXx8fHwxNzY1MTE0MDk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      upvotes: 15,
      date: '1 week ago'
    },
    {
      id: 6,
      title: 'Park Maintenance Needed',
      category: 'Parks & Recreation',
      area: 'Ward 3 - South District',
      status: 'Pending',
      image: 'https://images.unsplash.com/photo-1709934730506-fba12664d4e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3Rob2xlJTIwcm9hZCUyMGRhbWFnZXxlbnwxfHx8fDE3NjUwNTI3NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      upvotes: 8,
      date: '2 weeks ago'
    }
  ];

  const categories = ['All', 'Roads & Infrastructure', 'Waste Management', 'Street Lights', 'Water Supply', 'Drainage', 'Parks & Recreation'];
  const statuses = ['All', 'Pending', 'In Review', 'In Progress', 'Resolved'];

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

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || complaint.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || complaint.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl mb-2 text-gray-800 dark:text-white">Complaints Feed</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse all reported issues in your city
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Search by category or location..."
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>

          {/* Filter Options */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        selectedCategory === category
                          ? 'bg-[#1E88E5] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        selectedStatus === status
                          ? 'bg-[#1E88E5] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600 dark:text-gray-400">
          Showing {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? 's' : ''}
        </div>

        {/* Complaints Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.map((complaint) => (
            <Link
              key={complaint.id}
              to={`/complaint/${complaint.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition overflow-hidden border border-gray-200 dark:border-gray-700 group"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={complaint.image}
                  alt={complaint.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                  {complaint.status}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg mb-2 text-gray-800 dark:text-white group-hover:text-[#1E88E5] transition">
                  {complaint.title}
                </h3>

                <div className="space-y-2 mb-3">
                  <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-[#1E88E5] rounded-full text-sm">
                    {complaint.category}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{complaint.area}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{complaint.upvotes} upvotes</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{complaint.date}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* No Results */}
        {filteredComplaints.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No complaints found matching your criteria</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
