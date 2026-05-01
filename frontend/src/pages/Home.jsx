import React, { useEffect, useState } from 'react';
import HeroSection from '../components/sections/HeroSection';
import BrandsRow from '../components/sections/BrandsRow';
import NewArrivals from '../components/sections/NewArrivals';
import TopSelling from '../components/sections/TopSelling';
import DressStyle from '../components/sections/DressStyle';
import HappyCustomers from '../components/sections/HappyCustomers';
import HomePageSkeleton from '../components/ui/HomePageSkeleton';
import '../styles/loaders.css';

/** Minimum time skeleton is visible (smooth perceived load). */
const HOME_SKELETON_MS = 2600;

const Home = () => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShowContent(true), HOME_SKELETON_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (!showContent) {
    return <HomePageSkeleton />;
  }

  return (
    <main className="home-page home-page--loaded">
      <HeroSection />
      <BrandsRow />
      <NewArrivals />
      <TopSelling />
      <DressStyle />
      <HappyCustomers />
    </main>
  );
};

export default Home;
