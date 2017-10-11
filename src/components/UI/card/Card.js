import React from 'react';
import { prefixer } from '../../../lib/styleHelper';

const styles = prefixer('card');
const themeStyles = prefixer('theme');
const themeClasses = `nc-theme-base nc-theme-container nc-theme-rounded`;

export default function Card({ style, className = '', onClick, children }) {
  return <div className={`${ themeClasses } nc-card-card ${ className }`} style={style} onClick={onClick}>{children}</div>;
}
