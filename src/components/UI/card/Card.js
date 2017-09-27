import React from 'react';
import { prefixer } from '../../../lib/styleHelper';

const styles = prefixer('card');
const themeStyles = prefixer('theme');
const themeClasses = `${ themeStyles("base") } ${ themeStyles("container") } ${ themeStyles("rounded") }`;

export default function Card({ style, className = '', onClick, children }) {
  return <div className={`${ themeClasses } ${ styles("card") } ${ className }`} style={style} onClick={onClick}>{children}</div>;
}
