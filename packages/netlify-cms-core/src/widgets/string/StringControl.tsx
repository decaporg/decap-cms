import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { CmsWidgetControlProps } from '../../interface';

const StringControl = forwardRef<any, CmsWidgetControlProps<string>>(
  ({
    onChange,
    forID,
    value = '',
    classNameWrapper,
    setActiveStyle,
    setInactiveStyle,
  }: CmsWidgetControlProps<string>, _ref) => {
    const [element, setElement] = useState<HTMLInputElement | null>(null);
    const [selection, setSelection] = useState<number | null>(null);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSelection(e.target.selectionStart);
      onChange(e.target.value);
    }, []);

    const handleSetElement = useCallback((el: HTMLInputElement) => {
      setElement(el);
    }, []);

    useEffect(() => {
      if (!element) {
        return;
      }

      if (element.selectionStart !== selection) {
        element.setSelectionRange(selection, selection);
      }
    }, [element, element?.selectionStart, selection]);

    return (
      <input
        ref={handleSetElement}
        type="text"
        id={forID}
        className={classNameWrapper}
        value={value || ''}
        onChange={handleChange}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
      />
    );
  },
);

StringControl.displayName = 'StringControl';

export default StringControl;
