import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import homeVisualFallback from '../../assets/HomePageBoyGirl.png';
import api from '../../utils/api';

const HeroSection = () => {
  const [hero, setHero] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/site-content/home_hero')
      .then((res) => {
        if (!cancelled) setHero(res.data);
      })
      .catch(() => {
        if (!cancelled) setHero(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const title = hero?.title?.trim() || 'FIND CLOTHES THAT MATCHES YOUR STYLE';
  const subtitle =
    hero?.subtitle?.trim() ||
    'Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.';
  const ctaLabel = hero?.ctaLabel?.trim() || 'Shop Now';
  const ctaHref = hero?.ctaHref?.trim() || '/products';
  const imgSrc = hero?.heroImageUrl?.trim() ? hero.heroImageUrl.trim() : homeVisualFallback;

  const s1n = hero?.stat1Num || '200+';
  const s1l = hero?.stat1Label || 'International Brands';
  const s2n = hero?.stat2Num || '2,000+';
  const s2l = hero?.stat2Label || 'High-Quality Products';
  const s3n = hero?.stat3Num || '30,000+';
  const s3l = hero?.stat3Label || 'Happy Customers';

  return (
    <section className="hero hero--boygirl">
      <div className="hero__inner">
        <div className="hero__copy">
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {ctaHref.startsWith('http') ? (
            <a href={ctaHref} className="hero__cta" target="_blank" rel="noopener noreferrer">
              {ctaLabel}
            </a>
          ) : (
            <Link to={ctaHref || '/products'} className="hero__cta">
              {ctaLabel}
            </Link>
          )}
          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-num">{s1n}</span>
              <span className="hero__stat-label">{s1l}</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-num">{s2n}</span>
              <span className="hero__stat-label">{s2l}</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-num">{s3n}</span>
              <span className="hero__stat-label">{s3l}</span>
            </div>
          </div>
        </div>
        <div className="hero__visual">
          <img src={imgSrc} alt={title} width={720} height={560} loading="eager" />
          <span className="hero__star hero__star--large" aria-hidden="true">
            ✦
          </span>
          <span className="hero__star hero__star--small" aria-hidden="true">
            ✦
          </span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
