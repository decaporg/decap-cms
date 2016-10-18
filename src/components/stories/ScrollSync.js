import React from 'react';
import ScrollSync from '../ScrollSync/ScrollSync';
import ScrollSyncPane from '../ScrollSync/ScrollSyncPane';
import { storiesOf } from '@kadira/storybook';

const paneStyle = {
  border: '1px solid green',
  overflow: 'auto',
};

storiesOf('ScrollSync', module)
  .add('Default', () => (
    <ScrollSync>
      <div style={{ display: 'flex', position: 'relative', height: 500 }}>
        <ScrollSyncPane>
          <div style={paneStyle}>
            <section style={{ height: 5000 }}>
              <h1>Left Pane Content</h1>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab aperiam doloribus
                dolorum est eum eveniet exercitationem iste labore minus, neque nobis odit officiis
                omnis possimus quasi rerum sed soluta veritatis.
              </p>
            </section>
          </div>
        </ScrollSyncPane>

        <ScrollSyncPane>
          <div style={paneStyle}>
            <section style={{ height: 10000 }}>
              <h1>Right Pane Content</h1>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab aperiam doloribus
                dolorum est eum eveniet exercitationem iste labore minus, neque nobis odit officiis
                omnis possimus quasi rerum sed soluta veritatis.
              </p>
            </section>
          </div>
        </ScrollSyncPane>

        <ScrollSyncPane>
          <div style={paneStyle}>
            <section style={{ height: 2000 }}>
              <h1>Third Pane Content</h1>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab aperiam doloribus
                dolorum est eum eveniet exercitationem iste labore minus, neque nobis odit officiis
                omnis possimus quasi rerum sed soluta veritatis.
              </p>
            </section>
          </div>
        </ScrollSyncPane>
      </div>
    </ScrollSync>
  ));
