import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('pending'); // 'pending' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        const res = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(res.data?.message || '✅ Email verified successfully! You can now log in.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || '❌ Verification failed. Invalid or expired link.');
      }
    }

    if (token) verify();
    else {
      setStatus('error');
      setMessage('❌ Invalid or missing verification link.');
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md text-center">
        
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
