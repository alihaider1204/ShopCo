import React, { useState } from 'react';
import api, { getApiErrorMessage, toastOpts } from '../utils/api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import loginIllustration from '../assets/login-illustration.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Enter your email address.', toastOpts);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: trimmed });
      setSent(true);
      toast.success('Check your inbox for next steps.', toastOpts);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Request failed.'), toastOpts);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split-bg">
      <div className="auth-split-box">
        <div className="auth-split-left dark">
          <h2>Reset password</h2>
          <p>We’ll email you a secure link to choose a new password.</p>
          <img
            src={loginIllustration}
            alt=""
            className="auth-illustration"
            style={{ width: '80%', margin: '32px auto 0 auto', display: 'block' }}
          />
        </div>
        <div className="auth-split-right">
          <h3>Forgot password</h3>
          {sent ? (
            <p className="checkout-hint">
              If an account exists for that email, we sent instructions. You can close this page or{' '}
              <Link to="/login">return to sign in</Link>.
            </p>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <input
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
          <div className="auth-alt-action">
            <Link to="/login">Back to log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
