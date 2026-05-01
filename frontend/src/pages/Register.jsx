import React, { useState } from 'react';
import api, { authStorage, getApiErrorMessage, toastOpts } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import loginIllustration from '../assets/login-illustration.png';
import AuthPasswordField from '../components/AuthPasswordField';

const PW_MIN = 8;

/** One leading capital per word; rest lowercase (e.g. "JOHN doe" → "John Doe") */
const capitalizeWords = (s) =>
  s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

const Register = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleNameBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'firstName' || name === 'lastName') {
      setForm((f) => ({ ...f, [name]: capitalizeWords(value) }));
    }
  };

  const handleEmailChange = (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, email: v }));
  };

  const handleEmailBlur = (e) => {
    setForm((f) => ({ ...f, email: e.target.value.trim().toLowerCase() }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const firstName = capitalizeWords(form.firstName);
    const lastName = capitalizeWords(form.lastName);
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!firstName || !lastName) {
      toast.error('Please enter your first and last name.', toastOpts);
      return;
    }
    if (!email) {
      toast.error('Please enter your email.', toastOpts);
      return;
    }
    if (password.length < PW_MIN) {
      toast.error(`Password must be at least ${PW_MIN} characters.`, toastOpts);
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.', toastOpts);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
      });
      const { token, ...user } = res.data;
      authStorage.setSession(token, user);
      toast.success('Account created! You’re signed in and ready to shop.', toastOpts);
      const isAdmin = res.data.role === 'admin' || res.data.isAdmin;
      navigate(isAdmin ? '/admin' : '/home', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Registration failed.'), toastOpts);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split-bg">
      <div className="auth-split-box">
        <div className="auth-split-left dark">
          <h2>Join Shop.co</h2>
          <p>Create your account and start shopping with us today.</p>
          <img
            src={loginIllustration}
            alt=""
            className="auth-illustration"
            style={{ width: '80%', margin: '32px auto 0 auto', display: 'block' }}
          />
        </div>
        <div className="auth-split-right">
          <h3>Sign Up</h3>
          <form className="auth-form" onSubmit={handleRegister} noValidate>
            <input
              name="firstName"
              placeholder="First name"
              autoComplete="given-name"
              autoCapitalize="words"
              value={form.firstName}
              onChange={handleChange}
              onBlur={handleNameBlur}
              disabled={submitting}
              required
            />
            <input
              name="lastName"
              placeholder="Last name"
              autoComplete="family-name"
              autoCapitalize="words"
              value={form.lastName}
              onChange={handleChange}
              onBlur={handleNameBlur}
              disabled={submitting}
              required
            />
            <input
              name="email"
              placeholder="Email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              value={form.email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              disabled={submitting}
              required
            />
            <AuthPasswordField
              name="password"
              placeholder={`Password (min. ${PW_MIN} characters)`}
              autoComplete="new-password"
              minLength={PW_MIN}
              value={form.password}
              onChange={handleChange}
              disabled={submitting}
              required
            />
            <AuthPasswordField
              name="confirmPassword"
              placeholder="Confirm password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={submitting}
              required
            />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
          <div className="auth-alt-action">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
