import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosinstance.js";

export default function GLogin() {
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const res = await axiosInstance.post("/auth/google", { token: credential });

      const data = res.data;
      sessionStorage.setItem(
        "user",
        JSON.stringify({
          _id: data.user._id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          accessToken: data.token,
        })
      );
      sessionStorage.setItem("accessToken", data.token);

      // Dispatch custom event to update sidebar immediately
      window.dispatchEvent(new Event('authChange'));

      console.log("✅ Google Login Success:", data.user);
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Google login error:", err);
      alert("Google login failed. Please try again.");
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleLoginSuccess}
      onError={() => alert("Google login failed")}
    />
  );
}
