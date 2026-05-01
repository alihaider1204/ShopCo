import React, { useState } from 'react';
import api, { authStorage, getApiErrorMessage, toastOpts } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import loginIllustration from '../assets/login-illustration.png';
import AuthPasswordField from '../components/AuthPasswordField';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleEmailBlur = () => {
    setForm((f) => ({ ...f, email: f.email.trim().toLowerCase() }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    if (!email || !password) {
      toast.error('Enter your email and password.', toastOpts);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, ...user } = res.data;
      authStorage.setSession(token, user);
      toast.success('Welcome back! You’re signed in.', toastOpts);
      const isAdmin = res.data.role === 'admin' || res.data.isAdmin;
      navigate(isAdmin ? '/admin' : '/home', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Login failed.'), toastOpts);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split-bg">
      <div className="auth-split-box">
        <div className="auth-split-left dark">
          <h2>Welcome back</h2>
          <p>Manage your shop efficiently with Shop.co.</p>
          <img
            src={loginIllustration}
            alt=""
            className="auth-illustration"
            style={{ width: '80%', margin: '32px auto 0 auto', display: 'block' }}
          />
        </div>
        <div className="auth-split-right">
          <h3>Log in</h3>
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <input
              name="email"
              placeholder="Email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              value={form.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              disabled={submitting}
              required
            />
            <AuthPasswordField
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              disabled={submitting}
              required
            />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Login'}
            </button>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </form>
          <div className="auth-alt-action">
            Don&apos;t have an account? <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
