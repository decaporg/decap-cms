import React from 'react';
import Prism from 'prismjs';

const withHighlight = WrappedComponent =>
  class Highlight extends React.Component {
    constructor(props) {
      super(props);
      this.ref = React.createRef();
    }

    highlight() {
      Prism.highlightAllUnder(this.ref.current);
    }

    componentDidMount() {
      this.highlight();
    }

    componentDidUpdate() {
      this.highlight();
    }

    render() {
      return (
        <div className="language-markup" ref={this.ref}>
          <WrappedComponent {...this.props} />
        </div>
      );
    }
  };

export default withHighlight;
