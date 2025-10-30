1. After login: server sends refreshToken as HttpOnly cookie and responds with accessToken in JSON.
2. Store accessToken in memory or localStorage (short-lived). Do NOT store refresh in localStorage.
3. When accessToken expires, call /auth/refresh (axios instance uses withCredentials:true). Server validates refresh cookie, rotates refresh token and sets a new cookie, returns a new accessToken.
4. For logout: call /auth/logout, server clears cookie and invalidates stored refresh hash.
