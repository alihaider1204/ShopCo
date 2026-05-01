import React, { useState } from 'react';

const iconEye = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const iconEyeOff = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function AuthPasswordField({
  name,
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
  minLength,
  required,
  wrapperClassName = '',
  id,
}) {
  const [show, setShow] = useState(false);

  return (
    <div className={['auth-input-with-toggle', wrapperClassName].filter(Boolean).join(' ')}>
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setShow((s) => !s)}
        disabled={disabled}
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={0}
      >
        {show ? iconEyeOff : iconEye}
      </button>
    </div>
  );
}
