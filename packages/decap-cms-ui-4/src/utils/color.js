import Color from 'color';

const lighten = (colorString, strength) => {
  return Color(colorString)
    .mix(Color('white'), strength)
    .saturate(strength)
    .hex();
};

const darken = (colorString, strength) => {
  const { h } = Color(colorString)
    .hsl()
    .object();
  const hueShift =
    0 <= h && h <= 180
      ? Math.round(-15 + 0.25 * Math.abs(h - 60)) * strength
      : 180 <= h && h <= 240
      ? Math.round(-0.25 * h + 60) * strength
      : 0;

  return Color(colorString)
    .mix(Color('black'), strength)
    .saturate(strength)
    .rotate(hueShift)
    .hex();
};

const getShadeValue = (pos, steps) => {
  const medianStep = Math.floor(steps / 2);
  const lightSteps = Math.floor(steps / 2);
  const darkSteps = Math.ceil(steps / 2) - 1;
  const shadeValue =
    pos < medianStep
      ? -(1 / (lightSteps + 1)) * (lightSteps - pos)
      : pos > medianStep
      ? (1 / (darkSteps + 1)) * (pos + (steps % 2 ? 1 : 0) - darkSteps - 1)
      : 0;

  return shadeValue;
};

const getShadeColor = (colorString, pos) => {
  const shade = pos < 0 ? lighten : darken;

  return shade(colorString, Math.abs(pos));
};

const getColorShades = (colorString, steps = 16) =>
  Array.from({ length: steps })
    .fill()
    .map((val, idx) => getShadeValue(idx, steps))
    .map(pos => getShadeColor(colorString, pos))
    .reduce((acc, color, idx) => ({ ...acc, [(idx + 1) * 100]: color }), {});

let colors = {
  neutral: {
    '100': '#EEEFF2',
    '200': '#E3E4EB',
    '300': '#D3D6DF',
    '400': '#BCC0CD',
    '500': '#A6ACBA',
    '600': '#8F97A6',
    '700': '#798291',
    '800': '#616C7A',
    '900': '#495663',
    '1000': '#374653',
    '1100': '#283843',
    '1200': '#1E2E39',
    '1300': '#172730',
    '1400': '#0E1E25',
    '1500': '#0B181C',
    '1600': '#071113',
  },
  green: getColorShades('#89b74a'),
  turquoise: getColorShades('#00ad9e'),
  blue: getColorShades('#5091f4'),
  purple: getColorShades('#7a5ce5'),
  pink: getColorShades('#ca5bb0'),
  red: getColorShades('#e55a5a'),
  orange: getColorShades('#f68b45'),
  yellow: getColorShades('#f7ba34'),
};

colors = {
  ...colors,
  primary: colors.turquoise,
  danger: colors.red,
  success: colors.turquoise,
};

export default colors;
