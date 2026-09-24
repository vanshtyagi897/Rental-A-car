import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, CheckCircle2, KeyRound, Mail, RefreshCw } from 'lucide-react';

export default function UserAuthPage() {
  const { loginUser, signupUser, sendResetOtp, resetCustomerPassword } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  
  // Login & Shared State
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Forgot Password 2-Step State
  const [forgotStep, setForgotStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Set New Password
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Feedback State
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resend Countdown Timer Effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please provide your email or phone number and password.');
      return;
    }

    loginUser(identifier, password);
    navigate('/');
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      setError('Please fill out all required registration fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    signupUser({ name, phone, email, password });
    navigate('/');
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!resetEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendResetOtp(resetEmail.trim(), 'user');
      if (res.success) {
        setDemoOtp(res.otpDebug || '');
        setSuccessMessage(res.message || 'Verification code sent to your email.');
        setForgotStep(2);
        setResendCooldown(60);
      } else {
        setError(res.error || 'Failed to send verification code.');
      }
    } catch (err) {
      setError(err.message || 'Error generating OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!otpCode.trim()) {
      setError('Please enter the 6-digit verification code (OTP).');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetCustomerPassword({
        email: resetEmail.trim(),
        otp: otpCode.trim(),
        newPassword: newPassword.trim()
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Password updated successfully! Please sign in with your new password.');
        setIdentifier(resetEmail.trim());
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpCode('');
        setDemoOtp('');
        setForgotStep(1);
        setMode('login');
      } else {
        setError(res.error || 'Failed to update password.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchToForgot = () => {
    setMode('forgot');
    setForgotStep(1);
    setError('');
    setSuccessMessage('');
    if (identifier.includes('@')) {
      setResetEmail(identifier.trim());
    }
  };

  return (
    <div className="container-narrow" style={{ maxWidth: '480px', paddingTop: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem' }}>Customer Portal</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
          {mode === 'login'
            ? 'Sign in to review and manage your vehicle requests'
            : mode === 'signup'
            ? 'Create an account for quick vehicle reservation requests'
            : 'Reset your account password securely via email OTP'}
        </p>
      </div>

      <div className="card card-white">
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '1.75rem' }}>
          <button
            type="button"
            className="btn-subtle"
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: 700,
              borderBottom: mode === 'login' ? '2px solid var(--color-accent-mint)' : 'none',
              color: mode === 'login' ? 'var(--color-accent-mint)' : 'var(--color-text-muted)',
              borderRadius: 0
            }}
            onClick={() => { setMode('login'); setForgotStep(1); setError(''); setSuccessMessage(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn-subtle"
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: 700,
              borderBottom: mode === 'signup' ? '2px solid var(--color-accent-mint)' : 'none',
              color: mode === 'signup' ? 'var(--color-accent-mint)' : 'var(--color-text-muted)',
              borderRadius: 0
            }}
            onClick={() => { setMode('signup'); setForgotStep(1); setError(''); setSuccessMessage(''); }}
          >
            Register
          </button>
          <button
            type="button"
            className="btn-subtle"
            style={{
              flex: 1,
              padding: '0.75rem',
              fontWeight: 700,
              borderBottom: mode === 'forgot' ? '2px solid var(--color-accent-mint)' : 'none',
              color: mode === 'forgot' ? 'var(--color-accent-mint)' : 'var(--color-text-muted)',
              borderRadius: 0
            }}
            onClick={switchToForgot}
          >
            Forgot Password
          </button>
        </div>

        {/* Step Indicator for Forgot Password */}
        {mode === 'forgot' && (
          <div className="otp-step-indicator">
            <div className={`otp-step-bubble ${forgotStep === 1 ? 'active' : 'completed'}`}>1</div>
            <div className={`otp-step-line ${forgotStep === 2 ? 'active' : ''}`} />
            <div className={`otp-step-bubble ${forgotStep === 2 ? 'active' : ''}`}>2</div>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.75rem 0.95rem',
            background: 'rgba(159, 237, 215, 0.12)',
            border: '1px solid var(--color-accent-mint)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-accent-mint)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{successMessage}</div>
          </div>
        )}

        {/* Demo OTP Notice Badge */}
        {mode === 'forgot' && forgotStep === 2 && demoOtp && (
          <div className="otp-demo-badge">
            <div>
              <strong>Security Code (OTP):</strong> <span style={{ fontSize: '1.05rem', letterSpacing: '2px', fontWeight: 700 }}>{demoOtp}</span>
            </div>
            <button
              type="button"
              className="btn-subtle"
              onClick={() => setOtpCode(demoOtp)}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--color-accent-mint)', borderRadius: '4px' }}
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="form-error" style={{ marginBottom: '1.25rem', padding: '0.6rem 0.85rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #7f1d1d', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {/* Login Tab */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address or Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter registered email or phone"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={switchToForgot}
                  className="btn-subtle"
                  style={{ padding: 0, fontSize: '0.8rem', color: 'var(--color-accent-mint)', textDecoration: 'underline' }}
                >
                  Forgot Password?
                </button>
              </div>

              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1.5rem' }}>
              Sign In to My Account
            </button>
          </form>
        )}

        {/* Register Tab */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full legal name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 00000"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Create Password (Min 6 chars) *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a secure password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1.5rem' }}>
              Create Account
            </button>
          </form>
        )}

        {/* Forgot Password Tab */}
        {mode === 'forgot' && forgotStep === 1 && (
          /* Step 1: Request OTP */
          <form onSubmit={handleRequestOtp}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Enter your registered email address to receive a secure 6-digit One-Time Password (OTP) verification code.
            </p>

            <div className="form-group">
              <label className="form-label">Registered Email Address *</label>
              <input
                type="email"
                className="form-control"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="e.g. yourname@example.com"
                disabled={isSubmitting}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={isSubmitting}
            >
              <Mail size={16} />
              {isSubmitting ? 'Generating Verification Code...' : 'Send Verification Code (OTP)'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className="btn btn-outline btn-block"
              style={{ marginTop: '0.75rem' }}
              disabled={isSubmitting}
            >
              Cancel &amp; Return to Sign In
            </button>
          </form>
        )}

        {mode === 'forgot' && forgotStep === 2 && (
          /* Step 2: Enter OTP & New Password */
          <form onSubmit={handleVerifyAndResetPassword}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
                Code sent to: <strong>{resetEmail}</strong>
              </span>
              <button
                type="button"
                onClick={() => setForgotStep(1)}
                className="btn-subtle"
                style={{ fontSize: '0.775rem', color: 'var(--color-accent-mint)', textDecoration: 'underline', padding: 0 }}
              >
                Change
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">6-Digit Verification Code (OTP) *</label>
              <input
                type="text"
                className="form-control otp-input-field"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                maxLength={6}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password (Min 6 chars) *</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength={6}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(prev => !prev)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  minLength={6}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Didn't receive code?
              </span>
              <button
                type="button"
                onClick={() => handleRequestOtp()}
                disabled={resendCooldown > 0 || isSubmitting}
                className="btn-subtle"
                style={{
                  fontSize: '0.8rem',
                  color: resendCooldown > 0 ? 'var(--color-text-muted)' : 'var(--color-accent-mint)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: 0
                }}
              >
                <RefreshCw size={12} className={isSubmitting ? 'spin' : ''} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={isSubmitting}
            >
              <KeyRound size={16} />
              {isSubmitting ? 'Verifying Code & Updating...' : 'Verify OTP & Save New Password'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className="btn btn-outline btn-block"
              style={{ marginTop: '0.75rem' }}
              disabled={isSubmitting}
            >
              Cancel &amp; Return to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
