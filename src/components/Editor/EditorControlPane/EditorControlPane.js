import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import EditorControl from './EditorControl';

export default class ControlPane extends React.Component {
  componentValidate = {};

  processControlRef = (fieldName, wrappedControl) => {
    if (!wrappedControl) return;
    this.componentValidate[fieldName] = wrappedControl.validate;
  };

  validate = () => {
    this.props.fields.forEach((field) => {
      if (field.get('widget') === 'hidden') return;
      this.componentValidate[field.get("name")]();
    });
  };

  render() {
    const {
      collection,
      fields,
      entry,
      fieldsMetaData,
      fieldsErrors,
      mediaPaths,
      getAsset,
      onChange,
      onOpenMediaLibrary,
      onAddAsset,
      onRemoveInsertedMedia,
      onValidate,
    } = this.props;

    if (!collection || !fields) {
      return null;
    }

    if (entry.size === 0 || entry.get('partial') === true) {
      return null;
    }

    return (
      <div className="nc-controlPane-root">
        {fields.map((field, i) => field.get('widget') === 'hidden' ? null :
          <EditorControl
            key={i}
            field={field}
            value={entry.getIn(['data', field.get('name')])}
            fieldsMetaData={fieldsMetaData}
            fieldsErrors={fieldsErrors}
            mediaPaths={mediaPaths}
            getAsset={getAsset}
            onChange={onChange}
            onOpenMediaLibrary={onOpenMediaLibrary}
            onAddAsset={onAddAsset}
            onRemoveInsertedMedia={onRemoveInsertedMedia}
            onValidate={onValidate}
            processControlRef={this.processControlRef}
          />
        )}
      </div>
    );
  }
}

ControlPane.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  entry: ImmutablePropTypes.map.isRequired,
  fields: ImmutablePropTypes.list.isRequired,
  fieldsMetaData: ImmutablePropTypes.map.isRequired,
  fieldsErrors: ImmutablePropTypes.map.isRequired,
  mediaPaths: ImmutablePropTypes.map.isRequired,
  getAsset: PropTypes.func.isRequired,
  onOpenMediaLibrary: PropTypes.func.isRequired,
  onAddAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  onRemoveInsertedMedia: PropTypes.func.isRequired,
};
