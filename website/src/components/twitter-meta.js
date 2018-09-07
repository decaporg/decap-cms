import React from 'react';
import Helmet from 'react-helmet';

const TwitterMeta = ({ title, description, image, imageAlt }) => (
  <Helmet>
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@netlifycms" />
    {title && <meta name="twitter:title" content={title} />}
    {description && <meta name="twitter:description" content={description} />}
    {image && <meta name="twitter:image" content={image} />}
    {image && imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}
  </Helmet>
);

export default TwitterMeta;
