import PropTypes from 'prop-types';
import React from 'react';
import c from 'classnames';
import { Link } from 'react-router-dom';
import { Icon } from 'UI';
import { VIEW_STYLE_LIST, VIEW_STYLE_GRID } from 'Constants/collectionViews';
import i18n from '../../i18n';

const CollectionTop = ({
  collectionLabel,
  collectionDescription,
  viewStyle,
  onChangeViewStyle,
  newEntryUrl,
}) => {
  return (
    <div className="nc-collectionPage-top">
      <div className="nc-collectionPage-top-row">
        <h1 className="nc-collectionPage-topHeading">{collectionLabel}</h1>
        {
          newEntryUrl
            ? <Link className="nc-collectionPage-topNewButton" to={newEntryUrl}>
                {`New ${collectionLabel}`}
              </Link>
            : null
        }
      </div>
      {
        collectionDescription
          ? <p className="nc-collectionPage-top-description">{collectionDescription}</p>
          : null
      }
      <div className={c('nc-collectionPage-top-viewControls', {
        'nc-collectionPage-top-viewControls-noDescription': !collectionDescription,
      })}>
        <span className="nc-collectionPage-top-viewControls-text">{i18n.t('View as')}:</span>
        <button
          className={c('nc-collectionPage-top-viewControls-button', {
            'nc-collectionPage-top-viewControls-buttonActive': viewStyle === VIEW_STYLE_LIST,
          })}
          onClick={() => onChangeViewStyle(VIEW_STYLE_LIST)}
        >
          <Icon type="list"/>
        </button>
        <button
          className={c('nc-collectionPage-top-viewControls-button', {
            'nc-collectionPage-top-viewControls-buttonActive': viewStyle === VIEW_STYLE_GRID,
          })}
          onClick={() => onChangeViewStyle(VIEW_STYLE_GRID)}
        >
          <Icon type="grid"/>
        </button>
      </div>
    </div>
  );
};

CollectionTop.propTypes = {
  collectionLabel: PropTypes.string.isRequired,
  collectionDescription: PropTypes.string,
  newEntryUrl: PropTypes.string
};

export default CollectionTop;
