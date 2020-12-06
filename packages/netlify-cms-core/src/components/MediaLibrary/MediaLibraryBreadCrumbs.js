import React from 'react';
import PropTypes from 'prop-types';
import { trim } from 'lodash';
import styled from '@emotion/styled';
import { Icon } from 'netlify-cms-ui-default';

const BreadCrumbsContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  margin: 20px 0;
`;
const BreadCrumbsItem = styled.div`
  display: flex;
`;

const BreadCrumbsItemLabel = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 6px 8px;
  background: #eff0f4;
  border-radius: 5px;
`;

const BreadCrumbsItemDivider = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

class MediaLibraryBreadcrumbs extends React.Component {
  render() {
    const { handleBreadcrumbClick, currentMediaFolder, defaultMediaFolder } = this.props;
    var hiddenPath = defaultMediaFolder
      .split('/')
      .slice(0, -1)
      .join('/');
    var currentMediaFolderParts = trim(currentMediaFolder.replace(hiddenPath, ''), '/').split('/');
    var breadcrumbsArray = currentMediaFolderParts.map((part, index) => {
      return {
        isDefaultMediaDirectory: index === 0,
        path: `${hiddenPath}/${currentMediaFolderParts.slice(0, index + 1).join('/')}`,
        label: part,
      };
    });

    this.BreadCrumbsContent = breadcrumbsArray.map((item, index) => {
      return (
        <BreadCrumbsItem key={index}>
          <BreadCrumbsItemLabel onClick={() => handleBreadcrumbClick(item.path)}>
            {item.isDefaultMediaDirectory ? <Icon type="home" /> : item.label}
          </BreadCrumbsItemLabel>
          <BreadCrumbsItemDivider>/</BreadCrumbsItemDivider>
        </BreadCrumbsItem>
      );
    });
    return <BreadCrumbsContainer>{this.BreadCrumbsContent}</BreadCrumbsContainer>;
  }
}

MediaLibraryBreadcrumbs.propTypes = {
  handleBreadcrumbClick: PropTypes.func.isRequired,
  currentMediaFolder: PropTypes.string,
};

export default MediaLibraryBreadcrumbs;
