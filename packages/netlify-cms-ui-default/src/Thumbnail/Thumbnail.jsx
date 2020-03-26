import React from 'react';
import styled from '@emotion/styled';
import Card from '../Card';
import Icon from '../Icon';

const ThumbnailWrap = styled(Card)`
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
`;
const Content = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
`;
const ImageWrap = styled.div`
  ${({ imageAspectRatio }) =>
    imageAspectRatio
      ? typeof imageAspectRatio === 'string'
        ? `
          padding-top: ${(imageAspectRatio.split(':')[1] / imageAspectRatio.split(':')[0]) * 100}%;
        `
        : Array.isArray(imageAspectRatio)
        ? `
          padding-top: ${(imageAspectRatio.split[1] / imageAspectRatio.split[0]) * 100}%;
        `
        : ``
      : ``}
  width: 100%;
  ${({ imageAspectRatio }) => (imageAspectRatio ? `height: 0;` : ``)}
  ${({ imageSrc }) =>
    imageSrc ? `background-image: url(${imageSrc});` : ``}
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
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
  margin-top: 2px;
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
  imageSrc,
  supertitle,
  title,
  description,
  subtitle,
  featured,
  selectable,
  selected,
  onSelect,
  imageAspectRatio,
  ...props
}) => (
  <ThumbnailWrap selected={selected} {...props}>
    {imageSrc && (
      <ImageWrap imageAspectRatio={imageAspectRatio} imageSrc={imageSrc}>
        {!imageAspectRatio && <img src={imageSrc} style={{ width: '100%' }} />}
      </ImageWrap>
    )}
    <Content>
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

Thumbnail.defaultProps = {
  imageAspectRatio: '16:9',
};

export default Thumbnail;
