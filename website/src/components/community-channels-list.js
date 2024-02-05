import React from 'react';

import Features from './features';
import Grid from './grid';

function CommunityChannelsList({ channels }) {
  return (
    <Grid cols={channels.length}>
      <Features
        items={channels.map(({ title, description, cta }) => ({
          feature: title,
          description,
          cta,
        }))}
      />
    </Grid>
  );
}

export default CommunityChannelsList;
