import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, List, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition ${
            location.pathname === '/'
              ? 'bg-[#1E88E5] text-white'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs">Home</span>
        </Link>

        <Link
          to="/submit"
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition ${
            location.pathname === '/submit'
              ? 'bg-[#1E88E5] text-white'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <FileText className="w-6 h-6" />
          <span className="text-xs">Submit</span>
        </Link>

        <Link
          to="/feed"
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition ${
            location.pathname === '/feed'
              ? 'bg-[#1E88E5] text-white'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <List className="w-6 h-6" />
          <span className="text-xs">Feed</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition ${
            location.pathname === '/profile'
              ? 'bg-[#1E88E5] text-white'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </div>
  );
}
