import React, { PropTypes } from 'react';
import { Card } from '../UI';
import ScaledLine from './ScaledLine';
import styles from './AlltypeCard.css';

export default class AlltypeCard extends React.Component {

  // Based on the Slabtype Algorithm by Erik Loyer
  // http://erikloyer.com/index.php/blog/the_slabtype_algorithm_part_1_background/
  renderInscription(inscription) {

    const idealCharPerLine = 22;

    // segment the text into lines
    const words = inscription.split(' ');
    let preText, postText, finalText;
    let preDiff, postDiff;
    let wordIndex = 0;
    const lineText = [];

    // while we still have words left, build the next line
    while (wordIndex < words.length) {
      postText = '';

      // build two strings (preText and postText) word by word, with one
      // string always one word behind the other, until
      // the length of one string is less than the ideal number of characters
      // per line, while the length of the other is greater than that ideal
      while (postText.length < idealCharPerLine) {
        preText = postText;
        postText += words[wordIndex] + ' ';
        wordIndex++;
        if (wordIndex >= words.length) {
          break;
        }
      }

      // calculate the character difference between the two strings and the
      // ideal number of characters per line
      preDiff = idealCharPerLine - preText.length;
      postDiff = postText.length - idealCharPerLine;

      // if the smaller string is closer to the length of the ideal than
      // the longer string, and doesn’t contain just a single space, then
      // use that one for the line
      if ((preDiff < postDiff) && (preText.length > 2)) {
        finalText = preText;
        wordIndex--;

        // otherwise, use the longer string for the line
      } else {
        finalText = postText;
      }

      lineText.push(finalText.substr(0, finalText.length - 1));
    }
    return lineText.map(text => (
      <ScaledLine key={text.trim().replace(/[^a-z0-9]+/gi, '-')} toWidth={216}>
        {text}
      </ScaledLine>
    ));
  }

  render() {
    const { onClick, text } = this.props;
    return (
      <Card onClick={onClick}>
        <div className={styles.cardContent}>{this.renderInscription(text)}</div>
      </Card>
    );
  }
}

AlltypeCard.propTypes = {
  onClick: PropTypes.func,
  text: PropTypes.string.isRequired
};

AlltypeCard.defaultProps = {
  onClick: function() {},
};
