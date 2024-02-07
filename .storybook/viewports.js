import { lightTheme, darkTheme } from 'decap-cms-ui-next';

export default {
  sm: {
    name: 'Mobile (sm)',
    styles: {
      width: `${lightTheme.responsive.breakpoints.sm}px`,
      height: '100%',
    },
    type: 'mobile',
  },
  md: {
    name: 'Tablet (md)',
    styles: {
      width: `${lightTheme.responsive.breakpoints.md}px`,
      height: '100%',
    },
    type: 'tablet',
  },
  lg: {
    name: 'Laptop (lg)',
    styles: {
      width: `${lightTheme.responsive.breakpoints.lg}px`,
      height: '100%',
    },
    type: 'desktop',
  },
  xl: {
    name: 'Desktop (xl)',
    styles: {
      width: `${lightTheme.responsive.breakpoints.xl}px`,
      height: '100%',
    },
    type: 'desktop',
  },
};
