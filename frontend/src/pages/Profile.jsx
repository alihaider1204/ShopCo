import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { authStorage, getApiErrorMessage, toastOpts } from '../utils/api';
import AuthPasswordField from '../components/AuthPasswordField';

const PW_MIN = 8;

const capitalizeWords = (s) =>
  s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    newPassword: '',
    confirmPassword: '',
    newsletter: false,
    notifications: true,
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/users/profile');
        if (cancelled) return;
        setForm((f) => ({
          ...f,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: (data.email || '').toLowerCase(),
          phone: data.phone || '',
          newsletter: !!data.preferences?.newsletter,
          notifications: data.preferences?.notifications !== false,
          newPassword: '',
          confirmPassword: '',
        }));
      } catch (err) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, 'Could not load profile.'), toastOpts);
          navigate('/login');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNameBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'firstName' || name === 'lastName') {
      setForm((f) => ({ ...f, [name]: capitalizeWords(value) }));
    }
  };

  const handleEmailBlur = () => {
    setForm((f) => ({ ...f, email: f.email.trim().toLowerCase() }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving || passwordUpdating) return;
    const firstName = capitalizeWords(form.firstName);
    const lastName = capitalizeWords(form.lastName);
    const email = form.email.trim().toLowerCase();

    if (!firstName || !lastName) {
      toast.error('First and last name are required.', toastOpts);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        firstName,
        lastName,
        email,
        phone: form.phone.trim() || undefined,
        preferences: {
          newsletter: form.newsletter,
          notifications: form.notifications,
        },
      };
      const { data } = await api.put('/users/profile', payload);
      const token = localStorage.getItem('token');
      const prev = authStorage.getUser() || {};
      authStorage.setSession(token, {
        ...prev,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        isAdmin: data.isAdmin,
      });
      setForm((f) => ({
        ...f,
        firstName: data.firstName,
        lastName: data.lastName,
        email: (data.email || '').toLowerCase(),
        phone: data.phone || '',
        newsletter: !!data.preferences?.newsletter,
        notifications: data.preferences?.notifications !== false,
        newPassword: '',
        confirmPassword: '',
      }));
      toast.success('Profile saved successfully.', toastOpts);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update profile.'), toastOpts);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordUpdating || saving) return;
    const pw = form.newPassword;
    const confirm = form.confirmPassword;
    if (!pw && !confirm) {
      toast.info(`Enter a new password (at least ${PW_MIN} characters) and confirm it.`, toastOpts);
      return;
    }
    if (pw !== confirm) {
      toast.error('New passwords do not match.', toastOpts);
      return;
    }
    if (!pw || pw.length < PW_MIN) {
      toast.error(`Password must be at least ${PW_MIN} characters.`, toastOpts);
      return;
    }

    setPasswordUpdating(true);
    try {
      await api.put('/users/profile', { password: pw });
      setForm((f) => ({ ...f, newPassword: '', confirmPassword: '' }));
      toast.success('Password updated.', toastOpts);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update password.'), toastOpts);
    } finally {
      setPasswordUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-shell profile-shell--narrow">
          <p className="profile-loading">Loading your account…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <header className="profile-header">
          <h1 className="profile-title">My account</h1>
          <p className="profile-lead">
            Manage your details, password, and how we stay in touch.
          </p>
        </header>

        <form className="profile-edit-form" onSubmit={handleSave}>
          <section className="account-card" aria-labelledby="account-orders-heading">
            <h2 id="account-orders-heading" className="account-card__title">
              Orders & receipts
            </h2>
            <p className="account-card__desc">
              See payment status and download invoices anytime.
            </p>
            <Link to="/orders" className="account-card__cta">
              View order history
            </Link>
          </section>

          <section className="account-card" aria-labelledby="account-profile-heading">
            <h2 id="account-profile-heading" className="account-card__title">
              Profile
            </h2>
            <p className="account-card__desc">
              Your name and contact info — shown as you entered them when you signed up.
            </p>
            <div className="account-field-grid">
              <div className="account-field">
                <label htmlFor="profile-first">First name</label>
                <input
                  id="profile-first"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  onBlur={handleNameBlur}
                  autoComplete="given-name"
                  autoCapitalize="words"
                  required
                  disabled={saving || passwordUpdating}
                />
              </div>
              <div className="account-field">
                <label htmlFor="profile-last">Last name</label>
                <input
                  id="profile-last"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  onBlur={handleNameBlur}
                  autoComplete="family-name"
                  autoCapitalize="words"
                  required
                  disabled={saving || passwordUpdating}
                />
              </div>
              <div className="account-field account-field--full">
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  required
                  disabled={saving || passwordUpdating}
                />
              </div>
              <div className="account-field account-field--full">
                <label htmlFor="profile-phone">Phone <span className="account-optional">(optional)</span></label>
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="e.g. +92 300 1234567"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={saving || passwordUpdating}
                />
              </div>
            </div>
          </section>

          <section className="account-card" aria-labelledby="account-security-heading">
            <h2 id="account-security-heading" className="account-card__title">
              Security
            </h2>
            <p className="account-card__desc">
              Enter and confirm a new password, then click Update password. Your profile Save changes button does not apply password updates.
            </p>
            <div className="account-field-stack">
              <div className="account-field">
                <label htmlFor="profile-new-pw">New password</label>
                <AuthPasswordField
                  id="profile-new-pw"
                  name="newPassword"
                  placeholder={`At least ${PW_MIN} characters`}
                  autoComplete="new-password"
                  minLength={PW_MIN}
                  value={form.newPassword}
                  onChange={handleChange}
                  disabled={saving || passwordUpdating}
                  wrapperClassName="account-password-wrap"
                />
              </div>
              <div className="account-field">
                <label htmlFor="profile-confirm-pw">Confirm new password</label>
                <AuthPasswordField
                  id="profile-confirm-pw"
                  name="confirmPassword"
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={saving || passwordUpdating}
                  wrapperClassName="account-password-wrap"
                />
              </div>
            </div>
            <div className="account-security-actions">
              <button
                type="button"
                className="profile-password-btn"
                onClick={handleUpdatePassword}
                disabled={saving || passwordUpdating}
              >
                {passwordUpdating ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </section>

          <section className="account-card" aria-labelledby="account-prefs-heading">
            <h2 id="account-prefs-heading" className="account-card__title">
              Email preferences
            </h2>
            <p className="account-card__desc">
              Choose what we send you. You can change this anytime.
            </p>
            <div className="account-prefs">
              <label className="account-checkbox">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={form.newsletter}
                  onChange={handleChange}
                  disabled={saving || passwordUpdating}
                />
                <span>Email newsletter — sales, new arrivals, and features</span>
              </label>
              <label className="account-checkbox">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={form.notifications}
                  onChange={handleChange}
                  disabled={saving || passwordUpdating}
                />
                <span>Order & account notifications — confirmations and updates</span>
              </label>
            </div>
          </section>

          <div className="profile-actions">
            <button type="submit" className="profile-save-btn" disabled={saving || passwordUpdating}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
