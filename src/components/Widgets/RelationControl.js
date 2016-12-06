import React, { PropTypes } from 'react';
import Autocomplete from 'react-autocomplete';
import styles from './RelationControl.css';

export default class RelationControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.node,
    field: PropTypes.node,
  };

  state = {
    value: '',
    items: [],
  };

  render() {
    const { field, onChange } = this.props;

    const displayField =  field.get('displayField', 'slug');
    console.log(this.props.field);

    return (
      <Autocomplete
        inputProps={{ name: 'this-is-the-name-of-field' }}
        value={this.state.value}
        items={this.state.items}
        getItemValue={item => item[displayField]}
        onSelect={(value, item) => {
          // set the menu to only the selected item
          this.setState({ value, items: [item] });
          onChange(value);
        }}
        onChange={(event, value) => {
          this.setState({ value, loading: true });
          fakeRequest(value, (items) => {
            this.setState({ unitedStates: items, loading: false })
          })
        }}
        renderItem={(item, isHighlighted) => (
          <div
            style={isHighlighted ? styles.highlightedItem : styles.item}
            key={item.slug}
            id={item.slug}
          >
            {item[displayField]}
          </div>
        )}
      />
    );
  }
}



  //- {label: "Author", name: "author", widget: "relation", collection: "authors", seachFields: ["first_name", "last_name"], display:"title"}
