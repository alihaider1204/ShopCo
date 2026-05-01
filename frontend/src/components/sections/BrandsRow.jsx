import React from 'react';

const brands = [
  'Versace',
  'Zara',
  'Gucci',
  'Prada',
  'Calvin Klein',
  'Chanel',
  'Dior',
  'Louis Vuitton',
  'Burberry',
];

const BrandsRow = () => (
  <section className="brands-row">
    <div className="brands-row__container">
      {brands.map((brand) => (
        <span className="brands-row__brand" key={brand}>{brand}</span>
      ))}
    </div>
  </section>
);

export default BrandsRow;
