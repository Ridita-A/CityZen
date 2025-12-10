import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { MapPin, Calendar, Heart, MessageSquare, Upload, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ComplaintDetails({ onLogout, darkMode, toggleDarkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(24);
  const [newComment, setNewComment] = useState('');

  const complaint = {
    id: 1,
    title: 'Pothole on Main Street',
    category: 'Roads & Infrastructure',
    area: 'Ward 3 - South District',
    status: 'In Progress',
    image: 'https://images.unsplash.com/photo-1709934730506-fba12664d4e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3Rob2xlJTIwcm9hZCUyMGRhbWFnZXxlbnwxfHx8fDE3NjUwNTI3NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2 days ago',
    description: 'There is a large pothole on Main Street near the intersection with Oak Avenue. It has been causing damage to vehicles and poses a safety hazard, especially during rainy weather. The pothole is approximately 2 feet wide and 6 inches deep.',
    submittedBy: 'User #4532',
    latitude: '40.7128',
    longitude: '-74.0060'
  };

  const timeline = [
    { step: 'Submitted', completed: true, date: 'Dec 5, 2025' },
    { step: 'Accepted', completed: true, date: 'Dec 5, 2025' },
    { step: 'In Progress', completed: true, date: 'Dec 6, 2025' },
    { step: 'Resolved', completed: false, date: '-' }
  ];

  const comments = [
    { id: 1, user: 'User #2314', text: 'This is affecting my daily commute. Hope it gets fixed soon!', time: '1 day ago' },
    { id: 2, user: 'User #8765', text: 'I reported this last week too. Thanks for following up!', time: '2 days ago' }
  ];

  const handleUpvote = () => {
    if (upvoted) {
      setUpvotes(upvotes - 1);
      setUpvoted(false);
    } else {
      setUpvotes(upvotes + 1);
      setUpvoted(true);
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      alert('Comment added successfully!');
      setNewComment('');
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
        {/* Back Button */}
        <button
          onClick={() => navigate('/feed')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#1E88E5] dark:hover:text-[#1E88E5] mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Feed
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img
                src={complaint.image}
                alt={complaint.title}
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Complaint Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl mb-2 text-gray-800 dark:text-white">{complaint.title}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-[#1E88E5] rounded-full text-sm">
                      {complaint.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleUpvote}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                    upvoted
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${upvoted ? 'fill-current' : ''}`} />
                  <span>{upvotes}</span>
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-5 h-5" />
                  <span>{complaint.area}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-5 h-5" />
                  <span>Reported {complaint.date} by {complaint.submittedBy}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h2 className="text-lg mb-2 text-gray-800 dark:text-white">Description</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {complaint.description}
                </p>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Comments & Updates
              </h2>

              <div className="space-y-4 mb-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#1E88E5]">{comment.user}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{comment.time}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none mb-3"
                  rows={3}
                  placeholder="Add a comment or provide additional evidence..."
                />
                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-2 bg-[#1E88E5] hover:bg-[#1565C0] text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Add Comment
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg mb-4 text-gray-800 dark:text-white">Status Timeline</h2>
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}>
                        {item.completed && <CheckCircle className="w-5 h-5" />}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className={`w-0.5 h-12 ${
                          item.completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className={`mb-1 ${
                        item.completed 
                          ? 'text-gray-800 dark:text-white' 
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {item.step}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Map */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg mb-4 text-gray-800 dark:text-white">Location</h2>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 flex items-center justify-center mb-3">
                <MapPin className="w-12 h-12 text-[#1E88E5]" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Coordinates: {complaint.latitude}, {complaint.longitude}
              </p>
            </div>

            {/* Add Evidence */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg mb-3 text-gray-800 dark:text-white">Support This Issue</h2>
              <button className="w-full px-4 py-3 bg-[#1E88E5] hover:bg-[#1565C0] text-white rounded-lg transition flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                Add Evidence
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Upload photos or videos to support this complaint
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
