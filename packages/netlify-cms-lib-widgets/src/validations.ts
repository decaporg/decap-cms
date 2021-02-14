import { isNumber } from 'lodash';
import { List } from 'immutable';

export function validateMinMax(
  t: (key: string, options: unknown) => string,
  fieldLabel: string,
  value?: List<unknown>,
  min?: number,
  max?: number,
) {
  function minMaxError(messageKey: string) {
    return {
      type: 'RANGE',
      message: t(`editor.editorControlPane.widget.${messageKey}`, {
        fieldLabel,
        minCount: min,
        maxCount: max,
        count: min,
      }),
    };
  }

  if ([min, max, value?.size].every(isNumber) && (value!.size < min! || value!.size > max!)) {
    return minMaxError(min === max ? 'rangeCountExact' : 'rangeCount');
  } else if (isNumber(min) && min > 0 && value?.size && value.size < min) {
    return minMaxError('rangeMin');
  } else if (isNumber(max) && value?.size && value.size > max) {
    return minMaxError('rangeMax');
  }
}
