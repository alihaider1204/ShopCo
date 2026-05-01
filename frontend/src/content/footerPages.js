/**
 * Copy for footer-linked informational pages (slug → content).
 */

function sections(...items) {
  return items.map((item) =>
    typeof item === 'string'
      ? { heading: null, paragraphs: [item] }
      : { heading: item.heading, paragraphs: item.paragraphs || [item.text].filter(Boolean) }
  );
}

export const FOOTER_PAGES = {
  about: {
    title: 'About SHOP.CO',
    intro:
      'We exist to help you find clothes that suit your style—pieces you feel good wearing every day.',
    sections: sections(
      {
        heading: 'Our story',
        paragraphs: [
          'SHOP.CO started with a simple idea: great style should be easy to discover, fairly priced, and enjoyable to shop. We curate apparel for women and men with an eye on quality, fit, and lasting design—not fast trends you forget next week.',
          'Today we partner with trusted brands and makers so you can build a wardrobe you are proud of, whether you are dressing for work, weekend, or something in between.',
        ],
      },
      {
        heading: 'What we care about',
        paragraphs: [
          'Clear product information, honest pricing, and support when you need it. We are always improving the experience on our site and behind the scenes.',
        ],
      }
    ),
  },
  features: {
    title: 'Features',
    intro: 'Tools and benefits that make shopping with us straightforward.',
    sections: sections(
      {
        heading: 'Shopping',
        paragraphs: [
          'Browse by category, style, and filters that help you narrow down size, color, and price. Detailed product pages include imagery and descriptions so you know what you are getting.',
        ],
      },
      {
        heading: 'Checkout & payments',
        paragraphs: [
          'Secure checkout with major cards and trusted payment methods. Your payment details are handled by industry-standard providers—we never store full card numbers on our servers.',
        ],
      },
      {
        heading: 'Account & orders',
        paragraphs: [
          'Create an account to save your details and view order history. You will receive confirmation when your order is placed and updates as it ships.',
        ],
      }
    ),
  },
  works: {
    title: 'How it works',
    intro: 'From browsing to delivery in a few simple steps.',
    sections: sections(
      {
        heading: '1. Browse & choose',
        paragraphs: [
          'Explore our catalog, pick your size and options, and add items to your cart. Availability and price are shown before you check out.',
        ],
      },
      {
        heading: '2. Check out securely',
        paragraphs: [
          'Enter shipping information, apply a valid coupon if you have one, and pay through our secure flow. You will see an order summary before confirming.',
        ],
      },
      {
        heading: '3. We fulfill & ship',
        paragraphs: [
          'We prepare your order and hand it to our shipping partners. You will get tracking details when your package is on the way (when applicable).',
        ],
      },
      {
        heading: '4. Enjoy & get support',
        paragraphs: [
          'If anything is wrong with your order, reach out through our customer support channels—we will do our best to make it right.',
        ],
      }
    ),
  },
  careers: {
    title: 'Careers',
    intro: 'Interested in building the future of fashion retail with us?',
    sections: sections(
      {
        heading: 'Working at SHOP.CO',
        paragraphs: [
          'We are a growing team focused on product, technology, operations, and customer experience. We value curiosity, respect, and doing right by customers.',
        ],
      },
      {
        heading: 'Open roles',
        paragraphs: [
          'We post new openings on our site and professional networks as they become available. If you do not see a fit today, you can still send a short introduction and your area of interest to the contact listed on our support page—we occasionally hire ahead of public listings.',
        ],
      }
    ),
  },
  support: {
    title: 'Customer support',
    intro: 'We are here to help with orders, products, and account questions.',
    sections: sections(
      {
        heading: 'Contact us',
        paragraphs: [
          'Reply to any order or shipping email from us, or use the contact options listed at checkout. Please include your order number if your question is about a purchase—it helps us resolve things faster.',
        ],
      },
      {
        heading: 'Response times',
        paragraphs: [
          'We aim to answer within one to two business days. During busy seasons it may take a little longer; we appreciate your patience.',
        ],
      },
      {
        heading: 'Before you write',
        paragraphs: [
          'Check our FAQ pages for quick answers on accounts, deliveries, orders, and payments. Many common questions are covered there.',
        ],
      }
    ),
  },
  delivery: {
    title: 'Delivery details',
    intro: 'How shipping and delivery work when you order from SHOP.CO.',
    sections: sections(
      {
        heading: 'Processing time',
        paragraphs: [
          'Orders are typically processed within a few business days. You will receive a confirmation email after payment, and a shipping notification when your package is dispatched.',
        ],
      },
      {
        heading: 'Carriers & tracking',
        paragraphs: [
          'We ship with established carriers. When tracking is available, you will find a link or number in your shipping email or in your order details.',
        ],
      },
      {
        heading: 'Address accuracy',
        paragraphs: [
          'Please double-check your shipping address at checkout. We cannot always redirect a package once it has left our warehouse. If you made an error, contact support as soon as possible.',
        ],
      },
      {
        heading: 'International',
        paragraphs: [
          'Available regions and delivery times depend on your location and our current shipping partners. Any customs or import fees are usually the responsibility of the recipient unless we state otherwise at checkout.',
        ],
      }
    ),
  },
  terms: {
    title: 'Terms & conditions',
    intro: 'Please read these terms before using our website and services.',
    sections: sections(
      {
        heading: 'Use of the site',
        paragraphs: [
          'By accessing SHOP.CO you agree to use the site lawfully and not to interfere with its operation or other users’ experience. We may update these terms from time to time; continued use after changes means you accept the updated terms.',
        ],
      },
      {
        heading: 'Products & pricing',
        paragraphs: [
          'We strive to display accurate descriptions and prices. Rare errors may occur; we reserve the right to cancel or correct orders affected by obvious mistakes, with a full refund if payment was captured.',
        ],
      },
      {
        heading: 'Limitation',
        paragraphs: [
          'To the extent permitted by law, our liability is limited as described in our policies and applicable consumer regulations in your region. Nothing here limits rights that cannot be waived by law.',
        ],
      }
    ),
  },
  privacy: {
    title: 'Privacy policy',
    intro: 'How we handle your information when you shop with SHOP.CO.',
    sections: sections(
      {
        heading: 'What we collect',
        paragraphs: [
          'We collect information you provide (such as name, email, shipping address, and payment details through our payment processor) and technical data needed to run the site securely (such as device and usage information where appropriate).',
        ],
      },
      {
        heading: 'How we use it',
        paragraphs: [
          'We use your data to process orders, communicate about your purchases, improve our services, and comply with the law. Marketing communications, if any, follow your preferences and applicable opt-in rules.',
        ],
      },
      {
        heading: 'Retention & security',
        paragraphs: [
          'We retain data only as long as needed for these purposes or as required by law. We use industry-standard measures to protect information; no method of transmission over the internet is 100% secure.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          'Depending on where you live, you may have rights to access, correct, or delete certain personal data. Contact us through customer support to exercise those rights where applicable.',
        ],
      }
    ),
  },
  faqAccount: {
    title: 'Account',
    intro: 'Managing your SHOP.CO account.',
    sections: sections(
      {
        heading: 'Sign in & registration',
        paragraphs: [
          'Create an account with your email and a secure password. If you forget your password, use the “Forgot password” link on the sign-in page to reset it via email.',
        ],
      },
      {
        heading: 'Profile',
        paragraphs: [
          'Update your name and contact details from your profile page when logged in. Keeping your email current ensures you receive order and shipping updates.',
        ],
      },
      {
        heading: 'Security',
        paragraphs: [
          'Use a unique password and do not share your login. Sign out on shared devices. If you notice suspicious activity, reset your password and contact support.',
        ],
      }
    ),
  },
  faqDeliveries: {
    title: 'Manage deliveries',
    intro: 'Tracking and changing delivery details.',
    sections: sections(
      {
        heading: 'Tracking',
        paragraphs: [
          'Once your order ships, use the tracking link or number from your email to follow progress with the carrier.',
        ],
      },
      {
        heading: 'Address changes',
        paragraphs: [
          'If you need to change the delivery address, contact support immediately with your order number. Changes may not be possible if the order has already shipped.',
        ],
      },
      {
        heading: 'Delays',
        paragraphs: [
          'Weather, customs, or carrier volume can cause delays. If your package is overdue, reach out with your order ID and we will help investigate.',
        ],
      }
    ),
  },
  faqOrders: {
    title: 'Orders',
    intro: 'Placements, confirmations, and changes.',
    sections: sections(
      {
        heading: 'Confirmation',
        paragraphs: [
          'After successful payment you should receive an order confirmation email. If it is missing, check spam or verify your email address on your account.',
        ],
      },
      {
        heading: 'Order history',
        paragraphs: [
          'Signed-in customers can view past orders in the Orders section. Guest checkout orders are tied to the email used at purchase—keep that email for reference.',
        ],
      },
      {
        heading: 'Cancellations & issues',
        paragraphs: [
          'Whether an order can be canceled depends on fulfillment status. Contact support as soon as possible with your order number for cancellations, wrong items, or damage.',
        ],
      }
    ),
  },
  faqPayments: {
    title: 'Payments',
    intro: 'How paying for your order works.',
    sections: sections(
      {
        heading: 'Methods',
        paragraphs: [
          'We accept major payment methods shown at checkout (such as cards and digital wallets where enabled). Availability may vary by region.',
        ],
      },
      {
        heading: 'Security',
        paragraphs: [
          'Payment is processed through secure, PCI-aware providers. Your full card number is not stored on our servers.',
        ],
      },
      {
        heading: 'Receipts & invoices',
        paragraphs: [
          'Your confirmation email serves as a record of purchase. For downloadable invoices or tax documentation, use the options provided in your order details or contact support.',
        ],
      }
    ),
  },
};
