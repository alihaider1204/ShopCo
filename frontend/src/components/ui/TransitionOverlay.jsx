import React from 'react';
import '../../styles/loaders.css';

/**
 * Full-screen loader for multi-step flows (e.g. add to cart → cart, cart → checkout).
 */
const TransitionOverlay = ({ show, title, subtitle }) => {
  if (!show) return null;

  return (
    <div className="transition-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="transition-overlay__panel">
        <div className="transition-overlay__rings" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {title ? <p className="transition-overlay__title">{title}</p> : null}
        {subtitle ? <p className="transition-overlay__sub">{subtitle}</p> : null}
      </div>
    </div>
  );
};

export default TransitionOverlay;
