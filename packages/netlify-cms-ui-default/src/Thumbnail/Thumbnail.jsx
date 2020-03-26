import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { withTheme } from 'emotion-theming';

import Card from '../Card';
import Icon from '../Icon';

const ThumbnailWrap = styled(Card)`
  overflow: hidden;
  position: relative;
  display: flex;
  ${({horizontal}) => horizontal ? `` : `flex-direction: column;`}
  ${({ selected, selectable, theme }) =>
    selectable
      ? `
    &:before {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-color: ${theme.color.success['500']};
      opacity: ${selected ? 0.1 : 0};
      border-radius: 6px;
      pointer-events: none;
      transition: 200ms;
    }
    &:after {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      box-shadow: inset 0 0 0 ${selected ? 2 : 0}px ${theme.color.success['500']};
      border-radius: 6px;
      pointer-events: none;
      transition: 200ms;
    }
  `
      : ``}
`;
const Content = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  ${({selectable, hasPreview, horizontal}) => `margin-${horizontal ? 'left' : 'top'}: ${!hasPreview && selectable ? `2.5rem` : 0};`}
  transition: 200ms;
`;
const PreviewWrap = styled.div`
  position: relative;
  ${({ previewBgColor }) => (previewBgColor ? `background-color: ${previewBgColor};` : ``)}
  overflow: hidden;
  display: flex;
  width: ${({ horizontal }) => horizontal ? `33.333%;` : `100%`};
`;
const Preview = styled.div`
  ${({ horizontal, previewAspectRatio }) => horizontal ? `
    display: flex;
    width: 100%;
  ` : `
    ${previewAspectRatio
      ? typeof previewAspectRatio === 'string'
        ? `
          padding-top: ${(previewAspectRatio.split(':')[1] / previewAspectRatio.split(':')[0]) *
          100}%;
        `
        : Array.isArray(previewAspectRatio)
          ? `
            padding-top: ${(previewAspectRatio.split[1] / previewAspectRatio.split[0]) * 100}%;
          `
        : ``
      : ``}
    width: 100%;
    ${previewAspectRatio ? `height: 0;` : ``}
  `}

  ${({ previewImgSrc }) => (previewImgSrc ? `background-image: url(${previewImgSrc});` : ``)}
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  ${({ previewImgSrc, previewImgLoaded, previewImgOpacity }) =>
    previewImgSrc
      ? `opacity: ${
          previewImgLoaded
            ? previewImgOpacity !== null &&
              previewImgOpacity !== undefined &&
              previewImgOpacity !== ''
              ? previewImgOpacity
              : 1
            : 0
        };`
      : ``}
  ${({ selected, selectable }) => selectable ? `transform: scale(${(selected ? 1.1 : 1.01)});` : ``}
  transition: 200ms;
`;
const PreviewText = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.color.highEmphasis};
  font-size: 2rem;
  font-weight: bold;
`;
const Supertitle = styled.div`
  color: ${({ theme }) => theme.color.lowEmphasis};
  font-size: 0.625rem;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 6px;
`;
const Title = styled.div`
  font-size: 0.875rem;
  font-weight: bold;
  color: ${({ theme }) => theme.color.highEmphasis};
  margin-bottom: 6px;
`;
const Description = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.color.mediumEmphasis};
  margin-bottom: 6px;
`;
const Subtitle = styled.div`
  font-size: 0.625rem;
  color: ${({ theme }) => theme.color.lowEmphasis};
  flex: 1;
  display: flex;
  align-items: flex-end;
  margin-top: 6px;
`;
const FeaturedIcon = styled(Icon)`
  stroke: none;
  fill: #ffc762;
  position: absolute;
  bottom: 0.875rem;
  right: 0.875rem;
`;
FeaturedIcon.defaultProps = {
  size: 'sm',
  name: 'star',
};
const SelectToggle = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  position: absolute;
  top: 1rem;
  left: 1rem;
  box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, ${({ selected }) => (selected ? 1 : 0.75)});
  border-radius: 0.75rem;
  background-color: ${({ selected, theme }) =>
    selected ? theme.color.success['500'] : `rgba(0, 0, 0, 0.1)`};
  transition: 200ms;
  cursor: pointer;
  color: white;
  &:hover {
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 1);
  }
  & > svg {
    position: absolute;
    top: 50%;
    left: 50%;
    transition: 200ms;
    transform: translate(-50%, -50%) scale(${({ selected }) => (selected ? 1 : 0)});
    stroke-width: 3px;
  }
`;
const SelectIcon = styled(Icon)``;
SelectIcon.defaultProps = {
  name: 'check',
  size: 'sm',
};

const Thumbnail = ({
  previewImgSrc,
  previewImgOpacity,
  previewAspectRatio,
  previewBgColor,
  previewText,
  supertitle,
  title,
  description,
  subtitle,
  featured,
  horizontal,
  selectable,
  selected,
  onSelect,
  theme,
  ...props
}) => {
  const isCached = src => {
    const img = new Image();
    img.src = src;

    return img.complete;
  };
  const [previewImgLoaded, setPreviewImageLoaded] = useState(
    previewImgSrc && isCached(previewImgSrc),
  );

  useEffect(() => {
    if (previewImgSrc) {
      const img = new Image();
      img.onload = () => setPreviewImageLoaded(true);
      img.src = previewImgSrc;
    }
  }, []);

  return (
    <ThumbnailWrap selected={selected} selectable={selectable} horizontal={horizontal} {...props}>
      {(previewImgSrc || previewText) && (
        <PreviewWrap previewBgColor={previewBgColor || theme.color.disabled} horizontal={horizontal}>
          <Preview
            previewAspectRatio={previewAspectRatio}
            previewImgSrc={previewImgSrc}
            previewImgLoaded={previewImgLoaded}
            previewImgOpacity={previewImgOpacity}
            selected={selected}
            selectable={selectable}
            horizontal={horizontal}
          >
            {!previewAspectRatio && <img src={previewImgSrc} style={{ width: '100%' }} />}
          </Preview>
          {previewText && <PreviewText>{previewText}</PreviewText>}
        </PreviewWrap>
      )}
      <Content selectable={selectable} hasPreview={previewImgSrc || previewText} horizontal={horizontal}>
        {supertitle && <Supertitle>{supertitle}</Supertitle>}
        {title && <Title>{title}</Title>}
        {description && <Description>{description}</Description>}
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </Content>
      {featured && <FeaturedIcon />}
      {selectable && (
        <SelectToggle selected={selected} onClick={onSelect}>
          <SelectIcon />
        </SelectToggle>
      )}
    </ThumbnailWrap>
  );
};

Thumbnail.defaultProps = {
  previewAspectRatio: '16:9',
};

export default withTheme(Thumbnail);
