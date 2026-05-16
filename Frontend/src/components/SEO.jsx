import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, name, type, image, url }) => {
  const siteTitle = 'Prechi Clothing';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = 'Shop premium tracksuits, coordinated sets, and exclusive streetwear from Prechi Clothing. Bold designs and unmatched comfort for everyday excellence. Shipping & easy returns.';
  const defaultImage = 'https://prechi-ecommerce-frontend.onrender.com/PreachilogoWHITE.png';
  const siteUrl = 'https://prechi-ecommerce-frontend.onrender.com';

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />

      {/* Facebook tags */}
      <meta property="og:type" content={type || 'website'} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:url" content={url ? `${siteUrl}${url}` : siteUrl} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter tags */}
      <meta name="twitter:creator" content={name || siteTitle} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
};

export default SEO;
