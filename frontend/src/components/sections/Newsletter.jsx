import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage, toastOpts } from '../../utils/api';

function IconEnvelope() {
  return (
    <svg
      className="newsletter__icon-svg"
      width={28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 8.25V18a1.5 1.5 0 001.5 1.5h15A1.5 1.5 0 0021 18V8.25m-18 0A1.5 1.5 0 014.5 6.75h15a1.5 1.5 0 011.5 1.5m-18 0l8.526 5.684a1.5 1.5 0 001.948 0L21 8.25"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await api.post('/newsletter', { email: email.trim() });
      toast.success('Thanks for subscribing!', toastOpts);
      setEmail('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Subscription failed.'), toastOpts);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="newsletter newsletter--banner">
      <div className="newsletter__inner">
        <h2 className="newsletter__title">STAY UPTO DATE ABOUT OUR LATEST OFFERS</h2>
        <form className="newsletter__form" onSubmit={handleSubmit}>
          <label className="newsletter__field">
            <span className="newsletter__icon" aria-hidden="true">
              <IconEnvelope />
            </span>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="newsletter__submit" disabled={busy}>
            {busy ? '…' : 'Subscribe to Newsletter'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
