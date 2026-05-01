import React, { useState } from 'react';
import api, { getApiErrorMessage, toastOpts } from '../utils/api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import loginIllustration from '../assets/login-illustration.png';
import AuthPasswordField from '../components/AuthPasswordField';

const PW_MIN = 8;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid reset link.', toastOpts);
      return;
    }
    if (password.length < PW_MIN) {
      toast.error(`Password must be at least ${PW_MIN} characters.`, toastOpts);
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.', toastOpts);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password updated. You can sign in.', toastOpts);
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Reset failed.'), toastOpts);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split-bg">
      <div className="auth-split-box">
        <div className="auth-split-left dark">
          <h2>New password</h2>
          <p>Choose a strong password you don’t use elsewhere.</p>
          <img
            src={loginIllustration}
            alt=""
            className="auth-illustration"
            style={{ width: '80%', margin: '32px auto 0 auto', display: 'block' }}
          />
        </div>
        <div className="auth-split-right">
          <h3>Set password</h3>
          {!token ? (
            <p className="checkout-hint">
              This link is invalid. <Link to="/forgot-password">Request a new one</Link>.
            </p>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <AuthPasswordField
                name="password"
                placeholder={`New password (min ${PW_MIN} characters)`}
                autoComplete="new-password"
                minLength={PW_MIN}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
              <AuthPasswordField
                name="confirmPassword"
                placeholder="Confirm password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={submitting}
                required
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Update password'}
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

export default ResetPassword;
