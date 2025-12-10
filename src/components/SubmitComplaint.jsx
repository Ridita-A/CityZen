import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import BottomNav from './BottomNav';
import { Camera, MapPin, Loader, Sparkles, Upload, X } from 'lucide-react';

export default function SubmitComplaint({ onLogout, darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [location, setLocation] = useState({
    area: 'Ward 3 - South District',
    timestamp: new Date().toLocaleString()
  });

  const categories = [
    'Roads & Infrastructure',
    'Electricity',
    'Water Supply',
    'Waste Management',
    'Public Safety',
    'Drainage',
    'Street Lights',
    'Parks & Recreation',
    'Other'
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  const detectLocation = () => {
    setIsDetectingLocation(true);
    setTimeout(() => {
      setIsDetectingLocation(false);
      setLocation({
        area: 'Ward 3 - South District',
        timestamp: new Date().toLocaleString()
      });
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!imagePreview) {
      alert('Please upload an image of the issue');
      return;
    }
    // Success message and redirect
    alert('Complaint submitted successfully!');
    navigate('/feed');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-3xl mb-2 text-gray-800 dark:text-white">Submit Complaint</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Report an issue to help improve our city
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Complaint Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Broken street light on Main Street"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={4}
                placeholder="Provide additional details about the issue..."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Upload Image <span className="text-red-500">*</span>
              </label>
              
              {!imagePreview ? (
                <label className="block w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-[#1E88E5] transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    required
                  />
                  <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-700 dark:text-gray-300 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PNG, JPG up to 10MB
                  </p>
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* GPS Detection */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-6 h-6 text-[#1E88E5] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg mb-1 text-gray-800 dark:text-white">Location Detection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We&apos;ll automatically detect your location to help authorities respond faster
                  </p>
                </div>
              </div>

              {isDetectingLocation ? (
                <div className="flex items-center gap-3 text-[#1E88E5]">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Pinpointing your location...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-gray-700 dark:text-gray-300">
                      <strong>Area:</strong> {location.area}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Detected at:</strong> {location.timestamp}
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="text-[#1E88E5] hover:underline text-sm"
                  >
                    Refresh Location
                  </button>
                </div>
              )}

              {/* Simple Map Placeholder */}
              <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-lg h-40 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-[#1E88E5]" />
              </div>
            </div>

            {/* AI Suggestion Box - Future Feature */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 opacity-60">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg mb-1 text-gray-800 dark:text-white">
                    AI-Powered Assistance (Coming Soon)
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our AI will analyze your photo to automatically identify the issue type 
                    and suggest the best category
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#1E88E5] hover:bg-[#1565C0] text-white py-4 rounded-lg flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl"
            >
              <Upload className="w-5 h-5" />
              Submit Complaint
            </button>
          </form>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
