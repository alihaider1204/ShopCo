import React from 'react';
import { Link } from 'react-router-dom';
import imgTape from '../../assets/T-SHIRT WITH TAPE DETAILS.png';
import imgJeans from '../../assets/SKINNY FIT JEANS.png';
import imgCheckered from '../../assets/CHECKERED SHIRT.png';
import imgSleeve from '../../assets/SLEEVE STRIPED T-SHIRT.png';

const products = [
  { name: 'T-shirt with Tape Details', price: 120, rating: 4.5, image: imgTape, href: '/products?keyword=T-shirt' },
  {
    name: 'Skinny Fit Jeans',
    price: 240,
    oldPrice: 260,
    discountPct: 20,
    rating: 3.5,
    image: imgJeans,
    href: '/products?keyword=Jeans',
  },
  { name: 'Checkered Shirt', price: 180, rating: 4.5, image: imgCheckered, href: '/products?keyword=Checkered' },
  {
    name: 'Sleeve Striped T-shirt',
    price: 130,
    oldPrice: 160,
    discountPct: 30,
    rating: 4.5,
    image: imgSleeve,
    href: '/products?keyword=Striped',
  },
];

const NewArrivals = () => (
  <section className="products-section products-section--home">
    <h2 className="products-section__title">NEW ARRIVALS</h2>
    <div className="products-grid products-grid--home">
      {products.map((p) => (
        <Link key={p.name} to={p.href} className="product-card product-card--home">
          <div className="product-card__thumb">
            <img src={p.image} alt={p.name} />
          </div>
          <div className="product-card__info">
            <div className="product-card__name">{p.name}</div>
            <div className="product-card__rating">
              {'★'.repeat(Math.round(p.rating))}
              <span>
                {Number(p.rating).toFixed(1)}/5
              </span>
            </div>
            <div className="product-card__price-row">
              <span className="product-card__price">${p.price}</span>
              {p.oldPrice != null && (
                <>
                  <span className="product-card__oldprice">${p.oldPrice}</span>
                  {p.discountPct != null && (
                    <span className="product-card__discount">-{p.discountPct}%</span>
                  )}
                </>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
    <Link to="/products?sort=newest" className="products-section__viewall">
      View All
    </Link>
  </section>
);

export default NewArrivals;
