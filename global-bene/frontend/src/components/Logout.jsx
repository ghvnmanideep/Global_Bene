import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear access token from sessionStorage on logout
    sessionStorage.removeItem('accessToken');
    // Redirect to login page after logout
    navigate('/home');
  }, [navigate]);

  return null; // No UI needed
}
