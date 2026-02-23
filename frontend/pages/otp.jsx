import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Grainient from "../src/components/Grainient";
import "./Auth.css";

export default function OtpForm() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Get user email from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setEmail(user.email);
    } else {
      // If no user in local storage, redirect back to login
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch('http://127.0.0.1:4000/api/auth/verify-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Need to send the token for userAuth middleware
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ otp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Update user in localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.isAccountVerified = true;
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Redirect to freelancer home
      navigate('/freelancer/home');
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleResendOtp = async () => {
    setError("");
    try {
      const response = await fetch('http://127.0.0.1:4000/api/auth/send-verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      alert('OTP resent successfully!');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-dither">
        <Grainient
          color1="#FF9FFC"
          color2="#5227FF"
          color3="#B19EEF"
          timeSpeed={0.25}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verify Account</h1>
          <p className="auth-subtitle">
            Enter the 6-digit code sent to<br />
            <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <input 
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="000000"
              className="auth-input"
              style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem' }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-button-primary"
            disabled={isSubmitting || otp.length !== 6}
          >
            {isSubmitting ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Didn't receive the code?{' '}
            <button 
              onClick={handleResendOtp}
              className="auth-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Resend OTP
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
