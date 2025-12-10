import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Building2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E88E5] to-[#1565C0] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 left-0 right-0">
            {/* City Skyline Illustration */}
            <svg viewBox="0 0 1200 600" className="w-full">
              <rect x="50" y="200" width="100" height="400" fill="white" opacity="0.9" />
              <rect x="50" y="200" width="100" height="30" fill="white" opacity="0.5" />
              <rect x="170" y="150" width="120" height="450" fill="white" opacity="0.8" />
              <rect x="170" y="150" width="120" height="40" fill="white" opacity="0.5" />
              <rect x="310" y="250" width="90" height="350" fill="white" opacity="0.9" />
              <rect x="420" y="100" width="140" height="500" fill="white" opacity="0.7" />
              <rect x="420" y="100" width="140" height="50" fill="white" opacity="0.5" />
              <rect x="580" y="180" width="100" height="420" fill="white" opacity="0.85" />
              <rect x="700" y="220" width="110" height="380" fill="white" opacity="0.9" />
              <rect x="830" y="160" width="95" height="440" fill="white" opacity="0.8" />
              <rect x="945" y="200" width="105" height="400" fill="white" opacity="0.85" />
              <rect x="1070" y="140" width="130" height="460" fill="white" opacity="0.75" />
            </svg>
          </div>
        </div>
        <div className="relative z-10 text-white text-center">
          <Building2 className="w-20 h-20 mx-auto mb-6" strokeWidth={1.5} />
          <h1 className="text-5xl mb-4">CityZen</h1>
          <p className="text-xl opacity-90">Empowering Citizens to Build Better Cities</p>
          <p className="mt-6 text-lg opacity-80">Report. Track. Resolve.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 text-[#1E88E5] mb-2">
              <Building2 className="w-10 h-10" strokeWidth={1.5} />
              <span className="text-3xl">CityZen</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Welcome back!</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl mb-2 text-gray-800 dark:text-white">Login</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Access your CityZen account</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Email / Student ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Login as
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('citizen')}
                    className={`py-3 rounded-lg border-2 transition ${
                      role === 'citizen'
                        ? 'border-[#1E88E5] bg-[#1E88E5] text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#1E88E5]'
                    }`}
                  >
                    Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('authority')}
                    className={`py-3 rounded-lg border-2 transition ${
                      role === 'authority'
                        ? 'border-[#1E88E5] bg-[#1E88E5] text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#1E88E5]'
                    }`}
                  >
                    Authority
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-3 rounded-lg border-2 transition ${
                      role === 'admin'
                        ? 'border-[#1E88E5] bg-[#1E88E5] text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#1E88E5]'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <button type="button" className="text-[#1E88E5] hover:underline">
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-[#1E88E5] hover:bg-[#1565C0] text-white py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl"
              >
                <LogIn className="w-5 h-5" />
                Login
              </button>

              {/* Create Account Link */}
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">
                  Don&apos;t have an account?{' '}
                  <Link to="/signup" className="text-[#1E88E5] hover:underline">
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
