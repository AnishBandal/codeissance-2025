import React from 'react';
import { Link } from 'react-router-dom';

interface OfflineFallbackProps {
  title?: string;
  message?: string;
  actionText?: string;
  actionLink?: string;
}

const OfflineFallback: React.FC<OfflineFallbackProps> = ({ 
  title = "You're Offline", 
  message = "This page requires an internet connection. Some features may be limited while you're offline.",
  actionText = "Go to Dashboard",
  actionLink = "/dashboard"
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
      <div className="w-20 h-20 mb-6 text-amber-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold mb-2 text-gray-800">{title}</h2>
      <p className="text-gray-600 max-w-md mb-6">{message}</p>
      <div className="flex flex-col gap-4">
        <Link
          to={actionLink}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default OfflineFallback;