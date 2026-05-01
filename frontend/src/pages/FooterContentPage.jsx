import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FOOTER_PAGES } from '../content/footerPages';
import '../styles/footer-content-page.css';

/**
 * @param {{ slug: keyof typeof FOOTER_PAGES }} props
 */
export default function FooterContentPage({ slug }) {
  const page = FOOTER_PAGES[slug];
  if (!page) {
    return <Navigate to="/home" replace />;
  }

  const showAccountLinks = slug.startsWith('faq');

  return (
    <main className="footer-content-page">
      <nav className="footer-content-page__breadcrumb" aria-label="Breadcrumb">
        <Link to="/home">Home</Link>
      </nav>
      <h1>{page.title}</h1>
      {page.intro ? <p className="footer-content-page__intro">{page.intro}</p> : null}
      {page.sections.map((block, i) => (
        <section key={i}>
          {block.heading ? <h2>{block.heading}</h2> : null}
          {block.paragraphs.map((text, j) => (
            <p key={j}>{text}</p>
          ))}
        </section>
      ))}
      {showAccountLinks ? (
        <div className="footer-content-page__actions">
          <Link to="/profile" className="footer-content-page__actions--primary">
            Go to profile
          </Link>
          <Link to="/orders">View orders</Link>
          <Link to="/login">Sign in</Link>
        </div>
      ) : null}
    </main>
  );
}
