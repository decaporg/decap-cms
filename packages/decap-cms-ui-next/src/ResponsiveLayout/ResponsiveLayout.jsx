import { useWindowDimensions } from '../WindowDimensionsProvider';

function ResponsiveLayout({ breakPoint = 414, renderMobile, renderDesktop }) {
  const { width } = useWindowDimensions();
  return width > breakPoint ? renderDesktop() : renderMobile();
}

export default ResponsiveLayout;
