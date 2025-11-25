import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('form'); // 'form' | 'pending' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('pending');
    try {
      const res = await authService.verifyOtp({ email, otp });
      setStatus('success');
      setMessage(res.data?.message || '✅ Email verified successfully! You can now log in.');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || '❌ Verification failed. Invalid or expired OTP.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md text-center">

        {status === 'form' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Verify Your Email</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Enter the 6-digit OTP sent to your email.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength="6"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold shadow-md transition"
              >
                Verify
              </button>
            </form>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="mb-6">
              <svg
                className="animate-spin h-12 w-12 mx-auto text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium mb-4 animate-pulse">
              Verifying your email...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-4">🎉 Verification Successful!</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold shadow-md transition"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">❌ Verification Failed</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
            <button
              onClick={() => setStatus('form')}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold shadow-md transition mr-2"
            >
              Try Again
            </button>
            <Link
              to="/register"
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-semibold shadow-md transition"
            >
              Go to Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
