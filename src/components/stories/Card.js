import React from 'react';
import { Card } from '../UI';
import { storiesOf } from '@kadira/storybook';

const styles = {
  footer: {
    color: '#aaa',
    backgroundColor: '#555',
    textAlign: 'center',
    marginTop: 5,
    padding: 10,
  },
};

storiesOf('Card', module)
  .add('Default View', () => (
    <Card>
      <h1>A Card</h1>
      <h2>Subtitle</h2>
      <p>
        Margins are applied to all elements inside a card. <br/>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. lobortis vel. Nulla porttitor enim at tellus eget
        malesuada eleifend. Nunc tellus turpis, tincidunt sed felis facilisis, lacinia condimentum quam. Cras quis
        tortor fermentum, aliquam tortor eu, consequat ligula. Nulla eget nulla act odio varius ullamcorper turpis.
        In consequat egestas nulla condimentum faucibus. Donec scelerisque convallis est nec fringila. Suspendisse
        non lorem non erat congue consequat.
      </p>
    </Card>
  )).add('Full width content', () => (
    <Card>
      <img src="https://i.ytimg.com/vi/tntOCGkgt98/maxresdefault.jpg" />
      <h1>Card & cat</h1>
      <p>Media Elements such as video, img (and iFrame for embeds) don't have margin</p>
    </Card>
  )).add('Footer', () => (
    <Card>
      <img src="http://www.top13.net/wp-content/uploads/2015/10/perfectly-timed-funny-cat-pictures-5.jpg" />
      <h1>Now with footer.</h1>
      <p>header and footer elements are also not subject to margin</p>
      <footer style={styles.footer}>&copy; Thousand Cats Corp</footer>
    </Card>
  ));
