import React from 'react';
import { GoogleLogin as GoogleLoginButton } from '@react-oauth/google';

export default function GoogleLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(
        (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/auth/google-login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId: credentialResponse.credential }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Google login failed.');
        return;
      }
      sessionStorage.setItem('user', JSON.stringify({ _id: data._id, username: data.username, role: data.role, token: data.token }));
      sessionStorage.setItem('token', data.token);
      dispatch(setUser({ _id: data._id, username: data.username, role: data.role, token: data.token }));
      navigate('/dashboard');
    } catch (error) {
      alert('Google login failed due to network or server error.');
    }
  };

  return (
    <GoogleLoginButton
      onSuccess={handleLoginSuccess}
      onError={() => alert('Google login failed')}
    />
  );
}
