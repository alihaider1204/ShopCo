import React from 'react';
import { Link } from 'react-router-dom';
import imgCasual from '../../assets/Casual.png';
import imgFormal from '../../assets/Formal.png';
import imgParty from '../../assets/Party.png';
import imgGym from '../../assets/Gym.png';

const tileBgStyle = (src) => ({
  backgroundColor: '#fff',
  backgroundImage: `url(${src})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right center',
  backgroundSize: 'contain',
});

const tiles = [
  { name: 'Casual', image: imgCasual, to: '/products?dressStyle=Casual', area: 'casual' },
  { name: 'Formal', image: imgFormal, to: '/products?dressStyle=Formal', area: 'formal' },
  { name: 'Party', image: imgParty, to: '/products?dressStyle=Party', area: 'party' },
  { name: 'Gym', image: imgGym, to: '/products?dressStyle=Gym', area: 'gym' },
];

const DressStyle = () => (
  <section className="dress-style dress-style--mosaic">
    <h2 className="dress-style__title">BROWSE BY DRESS STYLE</h2>
    <div className="dress-style__mosaic">
      {tiles.map((t) => (
        <Link
          key={t.area}
          to={t.to}
          className={`dress-style__tile dress-style__tile--${t.area}`}
          style={tileBgStyle(t.image)}
        >
          <span className="dress-style__label">{t.name}</span>
        </Link>
      ))}
    </div>
  </section>
);

export default DressStyle;
