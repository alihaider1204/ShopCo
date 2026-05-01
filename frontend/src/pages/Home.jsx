import React from 'react';
import HeroSection from '../components/sections/HeroSection';
import BrandsRow from '../components/sections/BrandsRow';
import NewArrivals from '../components/sections/NewArrivals';
import TopSelling from '../components/sections/TopSelling';
import DressStyle from '../components/sections/DressStyle';
import HappyCustomers from '../components/sections/HappyCustomers';

const Home = () => (
  <main className="home-page home-page--loaded">
    <HeroSection />
    <BrandsRow />
    <NewArrivals />
    <TopSelling />
    <DressStyle />
    <HappyCustomers />
  </main>
);

export default Home;
