import React from 'react';
import { Global, css } from '@emotion/core';
import { withTheme } from 'emotion-theming';

const getDatepickerStyles = theme => css`
  .datetime-picker {
    position: relative;
    background-color: ${theme.color.surface};
    border-radius: 8px;
    font-size: 14px;
    width: 250px;
    box-sizing: content-box;
    z-index: 100;
  }
  .datetime-picker .calendar .calendar-nav {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid ${theme.color.border};
    min-height: 32px;
    padding: 4px;
  }
  .datetime-picker .calendar .calendar-nav button {
    background: none;
    border: 0;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    outline: none;
    cursor: pointer;
  }
  .datetime-picker .calendar .calendar-nav button .fa {
    font-size: 18px;
  }
  .datetime-picker .calendar .calendar-nav button:hover {
    background-color: ${theme.color.surfaceHighlight};
  }
  .datetime-picker .calendar .calendar-nav .current-date {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    padding: 0 8px;
    cursor: pointer;
    color: ${theme.color.highEmphasis};
  }
  .datetime-picker .calendar .calendar-nav .current-date:hover {
    background-color: ${theme.color.surfaceHighlight};
  }
  .datetime-picker .calendar .calendar-nav .current-date.disabled {
    cursor: default;
  }
  .datetime-picker .calendar table {
    display: block;
    margin: 4px;
  }
  .datetime-picker .calendar table td,
  .datetime-picker .calendar table th {
    padding: 0;
  }
  .datetime-picker .calendar table thead {
    display: block;
    margin: 8px 0 3px;
  }
  .datetime-picker .calendar table thead tr {
    display: flex;
    flex-wrap: wrap;
  }
  .datetime-picker .calendar table thead th {
    color: ${theme.color.primary['900']};
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    text-align: center;
    text-transform: uppercase;
    font-size: 0.8em;
    font-weight: 400;
  }
  .datetime-picker .calendar table tbody {
    display: block;
  }
  .datetime-picker .calendar table tbody tr {
    display: flex;
    flex-wrap: wrap;
  }
  .datetime-picker .calendar table tbody tr td {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    border-radius: 4px;
    cursor: pointer;
    color: ${theme.color.highEmphasis};
  }
  .datetime-picker .calendar table tbody tr td:hover {
    background-color: ${theme.color.surfaceHighlight};
  }
  .datetime-picker .calendar table tbody tr td.disabled,
  .datetime-picker .calendar table tbody tr td.next,
  .datetime-picker .calendar table tbody tr td.prev {
    color: ${theme.color.disabled};
  }
  .datetime-picker .calendar table tbody tr td.disabled:hover,
  .datetime-picker .calendar table tbody tr td.next:hover,
  .datetime-picker .calendar table tbody tr td.prev:hover {
    color: #c5c5c5;
  }
  .datetime-picker .calendar table tbody tr td.disabled:hover {
    color: #dedede;
    background-color: transparent;
    cursor: not-allowed;
  }
  .datetime-picker .calendar table tbody tr td.now {
    color: ${theme.color.highEmphasis};
    font-weight: 400;
  }
  .datetime-picker .calendar table tbody tr td.selected {
    background-color: ${theme.color.primary['900']};
    color: #fff;
    font-weight: 400;
  }
  .datetime-picker .calendar table tbody tr td.selected:hover {
    background-color: ${theme.color.primary['800']};
    color: #fff;
  }
  .datetime-picker .calendar table tbody tr td.selected.start {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .datetime-picker .calendar table tbody tr td.selected.end {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  .datetime-picker .calendar table tbody tr td.selected.start.end {
    border-radius: 4px;
  }
  .datetime-picker .calendar table tbody tr td.between {
    background-color: #f5fbfe;
    border-radius: 0;
  }
  .datetime-picker .calendar .calendar-days table tbody tr td {
    width: 14.28571429%;
  }
  .datetime-picker .calendar .calendar-months table tbody tr td {
    width: 33.33333333%;
    height: 40px;
  }
  .datetime-picker .calendar .calendar-years table tbody tr td {
    width: 25%;
    height: 60px;
  }
  .datetime-picker .time {
    border-top: 1px solid ${theme.color.border};
    padding: 4px;
    display: flex;
    align-items: center;
    position: relative;
  }
  .datetime-picker .time .show-time {
    display: flex;
    align-items: center;
    flex: 1;
    font-size: 14px;
    text-align: center;
    margin: 0 0 0 10px;
  }
  .datetime-picker .time .show-time .text {
    line-height: 1;
    font-size: 19px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    position: relative;
    z-index: 1;
    color: ${theme.color.mediumEmphasis};
  }
  .datetime-picker .time .show-time .separater {
    margin: 0 2px 3px;
    line-height: 1;
  }
  .datetime-picker .time .sliders {
    flex: 0 1 153px;
    margin-right: 10px;
    max-width: 153px;
  }
  .datetime-picker .time .sliders .slider-text {
    display: none;
  }
  .datetime-picker .time .sliders .slider {
    display: flex;
    align-items: center;
    font-size: 11px;
    height: 17px;
    background-image: linear-gradient(90deg, #dedede, #dedede);
    background-position: 0 50%;
    background-size: 100% 1px;
    background-repeat: no-repeat;
  }
  .datetime-picker .time .sliders .slider .handle {
    width: 12px;
    height: 12px;
    background-color: #fff;
    border: 1px solid #dedede;
    border-radius: 3px;
    cursor: pointer;
  }

  .datetime-picker .shortcuts-bar {
    border-bottom: 1px solid ${theme.color.border};
    padding: 8px;
  }
  .datetime-picker .shortcuts-bar .btn {
    border: 0;
    background: none;
    cursor: pointer;
    border-radius: 2px;
    padding: 2px 4px;
    outline: none;
    color: ${theme.color.mediumEmphasis};
  }
  .datetime-picker .shortcuts-bar .btn:hover {
    background-color: ${theme.color.elevatedSurfaceHighlight};
  }
  .datetime-picker .shortcuts-bar .btn:last-child {
    float: right;
  }
  .datetime-picker .shortcuts-bar .btn:not(:first-child) {
    margin-left: 5px;
  }
  .datetime-range-picker {
    border: 1px solid #dbdbdb;
    background-color: #fff;
    border-radius: 4px;
    box-sizing: content-box;
    z-index: 100;
  }
  .datetime-trigger {
    position: relative;
  }
  .datetime-trigger .datetime-picker {
    position: absolute;
    top: 100%;
    right: 0;
  }
  .datetime-range-trigger {
    position: relative;
  }
  .datetime-range-trigger .datetime-range-picker {
    position: absolute;
    top: 100%;
  }
  .datetime-picker-popup,
  .datetime-range-picker-popup {
    margin: 0.5rem 1rem 1rem 1rem;
    box-shadow: 0 8px 24px 0 rgba(14, 30, 37, 0.15);
  }
  .datetime-picker-popup:before,
  .datetime-range-picker-popup:before {
    content: '';
    position: absolute;
    background: ${({ theme }) => theme.color.surface};
    border-top: 1px solid #dbdbdb;
    border-right: 1px solid #dbdbdb;
    width: 10px;
    height: 10px;
    z-index: -1;
    right: 10px;
    top: -6px;
    transform: rotate(315deg);
  }

  .datetime-picker .calendar .calendar-nav button i {
    position: relative;
    color: ${theme.color.mediumEmphasis};
  }
  .datetime-picker .calendar .calendar-nav button.prev-month i:after {
    content: '';
    display: block;
    position: absolute;
    top: -0.25rem;
    left: 0.75rem;
    width: 0.5rem;
    height: 0.5rem;
    border-left: 1.5px solid;
    border-bottom: 1.5px solid;
    transform: rotate(45deg);
  }
  .datetime-picker .calendar .calendar-nav button.next-month i:after {
    content: '';
    display: block;
    position: absolute;
    top: -0.25rem;
    left: 0.5rem;
    width: 0.5rem;
    height: 0.5rem;
    border-right: 1.5px solid;
    border-top: 1.5px solid;
    transform: rotate(45deg);
  }
  .datetime-picker .time .sliders .slider {
    background-image: linear-gradient(90deg, ${theme.color.disabled}, ${theme.color.disabled});
  }
  .datetime-picker .time .sliders .slider .handle {
    background-color: ${theme.color.primary['900']};
    border: none;
    border-radius: 32px;
    &:active {
      background-color: ${theme.color.primary['1400']};
    }
  }
  .datetime-picker .time .sliders .slider .handle:hover {
    border-color: #b8b8b8;
  }
  .datetime-picker .time .sliders .slider .handle:active,
  .datetime-picker .time .sliders .slider .handle:focus {
    background-color: #5cc4ef;
    border-color: #5cc4ef;
  }
`;

const DatepickerStyles = ({ theme }) => <Global styles={getDatepickerStyles(theme)} />;

export default withTheme(DatepickerStyles);
