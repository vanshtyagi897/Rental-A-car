import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2, Mail, RefreshCw } from 'lucide-react';

export default function AdminLoginPage() {
  const { loginAdmin, sendResetOtp, resetAdminPassword, isAdminAuthenticated } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'login' | 'forgot'
  const [mode, setMode] = useState('login');

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot / Reset Password 2-Step State
  const [forgotStep, setForgotStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Set New Password
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated) {
      const target = location.state?.from?.pathname || '/admin';
      navigate(target, { replace: true });
    }
  }, [isAdminAuthenticated, navigate, location]);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide administrative username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginAdmin(username.trim(), password);
      if (res.success) {
        const target = location.state?.from?.pathname || '/admin';
        navigate(target, { replace: true });
      } else {
        setError(res.error || 'Invalid administrative credentials.');
      }
    } catch (err) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!resetEmail.trim()) {
      setError('Please enter your registered administrative email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendResetOtp(resetEmail.trim(), 'admin');
      if (res.success) {
        setDemoOtp(res.otpDebug || '');
        setSuccessMessage(res.message || 'Verification code sent to your email.');
        setForgotStep(2);
        setResendCooldown(60);
      } else {
        setError(res.error || 'Failed to send verification code.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with verification service.');
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
      setError('New passwords do not match. Please verify and retype.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetAdminPassword({
        email: resetEmail.trim(),
        otp: otpCode.trim(),
        newPassword: newPassword.trim()
      });

      if (res.success) {
        setSuccessMessage(res.message || 'Administrative password updated successfully! Please sign in with your new password.');
        setUsername(resetEmail.trim());
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpCode('');
        setDemoOtp('');
        setForgotStep(1);
        setMode('login');
      } else {
        setError(res.error || 'Failed to update administrative password.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while resetting password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchToForgot = () => {
    setMode('forgot');
    setForgotStep(1);
    setError('');
    setSuccessMessage('');
    setResetEmail(username.includes('@') ? username : 'admin@kkrentals.com');
  };

  const switchToLogin = () => {
    setMode('login');
    setForgotStep(1);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070f11',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            color: 'var(--color-heading)',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.75rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: '0.35rem'
          }}>
            K<span style={{ color: 'var(--color-accent-mint)' }}>&amp;</span>K OPERATIONS
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Staff &amp; Fleet Dispatch Authentication Portal
          </div>
        </div>

        <div className="card" style={{
          backgroundColor: 'var(--color-bg-surface)',
          padding: '2.25rem',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--color-heading)', margin: 0 }}>
              {mode === 'login' ? 'Staff Sign In' : 'Reset Staff Password'}
            </h2>
            {mode === 'forgot' && (
              <button
                type="button"
                className="btn-subtle"
                onClick={switchToLogin}
                style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.5rem' }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
          </div>

          {/* Step Indicator for Forgot Password */}
          {mode === 'forgot' && (
            <div className="otp-step-indicator">
              <div className={`otp-step-bubble ${forgotStep === 1 ? 'active' : 'completed'}`}>1</div>
              <div className={`otp-step-line ${forgotStep === 2 ? 'active' : ''}`} />
              <div className={`otp-step-bubble ${forgotStep === 2 ? 'active' : ''}`}>2</div>
            </div>
          )}

          {/* Success Message Banner */}
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
            <div className="form-error" style={{
              marginBottom: '1.25rem',
              padding: '0.65rem 0.85rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #7f1d1d',
              borderRadius: '4px',
              color: '#fca5a5',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {/* Form Content */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Username / Dispatch ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  autoComplete="username"
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
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

              <button
                type="submit"
                className="btn btn-primary btn-block"
                style={{ marginTop: '1.75rem' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying Credentials...' : 'Sign In to Operations Console'}
              </button>
            </form>
          ) : forgotStep === 1 ? (
            /* STEP 1: Request OTP via Registered Email */
            <form onSubmit={handleRequestOtp}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                Enter your registered administrative email to receive a 6-digit One-Time Password (OTP) verification code.
              </p>

              <div className="form-group">
                <label className="form-label">Registered Admin Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="e.g. admin@kkrentals.com"
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
                onClick={switchToLogin}
                className="btn btn-outline btn-block"
                style={{ marginTop: '0.75rem' }}
                disabled={isSubmitting}
              >
                Cancel &amp; Return to Sign In
              </button>
            </form>
          ) : (
            /* STEP 2: Enter OTP & Choose New Password */
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
                onClick={switchToLogin}
                className="btn btn-outline btn-block"
                style={{ marginTop: '0.75rem' }}
                disabled={isSubmitting}
              >
                Cancel &amp; Return to Sign In
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            ← Return to Customer Website
          </Link>
        </div>
      </div>
    </div>
  );
}
