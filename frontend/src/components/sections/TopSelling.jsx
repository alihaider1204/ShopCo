import React from 'react';
import { Link } from 'react-router-dom';
import imgVertical from '../../assets/VERTICAL STRIPED SHIRT.png';
import imgCourage from '../../assets/COURAGE GRAPHIC T-SHIRT.png';
import imgBermuda from '../../assets/LOOSE FIT BERMUDA SHORTS.png';
import imgFaded from '../../assets/FADED SKINNY JEANS.png';

const products = [
  {
    name: 'Vertical Striped Shirt',
    price: 212,
    oldPrice: 232,
    discountPct: 20,
    rating: 5.0,
    image: imgVertical,
    href: '/products?keyword=Vertical',
  },
  {
    name: 'Courage Graphic T-shirt',
    price: 145,
    rating: 4.0,
    image: imgCourage,
    href: '/products?keyword=Courage',
  },
  {
    name: 'Loose Fit Bermuda Shorts',
    price: 80,
    rating: 3.0,
    image: imgBermuda,
    href: '/products?keyword=Bermuda',
  },
  {
    name: 'Faded Skinny Jeans',
    price: 210,
    rating: 4.5,
    image: imgFaded,
    href: '/products?keyword=Faded',
  },
];

const TopSelling = () => (
  <section className="products-section products-section--home">
    <h2 className="products-section__title">TOP SELLING</h2>
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
              <span>{Number(p.rating).toFixed(1)}/5</span>
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
    <Link to="/products?sort=popular" className="products-section__viewall">
      View All
    </Link>
  </section>
);

export default TopSelling;
