import React from 'react';
import Activity from './icons/Activity';
import AlertCircle from './icons/AlertCircle';
import AlertTriangle from './icons/AlertTriangle';
import ArrowDown from './icons/ArrowDown';
import ArrowLeft from './icons/ArrowLeft';
import ArrowRight from './icons/ArrowRight';
import ArrowUp from './icons/ArrowUp';
import AtSign from './icons/AtSign';
import BarChart from './icons/BarChart';
import Bell from './icons/Bell';
import Bold from './icons/Bold';
import Box from './icons/Box';
import BulletedList from './icons/BulletedList';
import Calendar from './icons/Calendar';
import Check from './icons/Check';
import ChevronDown from './icons/ChevronDown';
import ChevronRight from './icons/ChevronRight';
import Clock from './icons/Clock';
import Code from './icons/Code';
import CodeBlock from './icons/CodeBlock';
import Compass from './icons/Compass';
import Copy from './icons/Copy';
import Database from './icons/Database';
import Edit3 from './icons/Edit3';
import Edit from './icons/Edit';
import ExternalLink from './icons/ExternalLink';
import EyeOff from './icons/EyeOff';
import Eye from './icons/Eye';
import FileText from './icons/FileText';
import File from './icons/File';
import Filter from './icons/Filter';
import Flag from './icons/Flag';
import Folder from './icons/Folder';
import Github from './icons/Github';
import Globe from './icons/Globe';
import Grid from './icons/Grid';
import HardDrive from './icons/HardDrive';
import HeadingOne from './icons/HeadingOne';
import HeadingTwo from './icons/HeadingTwo';
import HeadingThree from './icons/HeadingThree';
import HelpCircle from './icons/HelpCircle';
import Image from './icons/Image';
import Inbox from './icons/Inbox';
import Info from './icons/Info';
import Italic from './icons/Italic';
import Layout from './icons/Layout';
import Link from './icons/Link';
import Lock from './icons/Lock';
import LogOut from './icons/LogOut';
import Mail from './icons/Mail';
import MapPin from './icons/MapPin';
import Maximize from './icons/Maximize';
import Menu from './icons/Menu';
import Minimize from './icons/Minimize';
import Moon from './icons/Moon';
import MoreHorizontal from './icons/MoreHorizontal';
import MoreVertical from './icons/MoreVertical';
import Move from './icons/Move';
import NumberedList from './icons/NumberedList';
import Package from './icons/Package';
import Paperclip from './icons/Paperclip';
import PieChart from './icons/PieChart';
import PlusCircle from './icons/PlusCircle';
import Plus from './icons/Plus';
import Quote from './icons/Quote';
import Radio from './icons/Radio';
import Save from './icons/Save';
import Search from './icons/Search';
import Server from './icons/Server';
import Settings from './icons/Settings';
import Share2 from './icons/Share2';
import ShoppingCart from './icons/ShoppingCart';
import Sidebar from './icons/Sidebar';
import Sun from './icons/Sun';
import Trash2 from './icons/Trash2';
import Underline from './icons/Underline';
import UploadCloud from './icons/UploadCloud';
import Upload from './icons/Upload';
import User from './icons/User';
import Users from './icons/Users';
import X from './icons/X';
import Zap from './icons/Zap';

// prettier-ignore
export const iconComponents = {
  'activity': Activity,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'at-sign': AtSign,
  'bar-chart': BarChart,
  'bell': Bell,
  'bold': Bold,
  'box': Box,
  'bulleted-list': BulletedList,
  'calendar': Calendar,
  'check': Check,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'clock': Clock,
  'code': Code,
  'code-block': CodeBlock,
  'compass': Compass,
  'copy': Copy,
  'database': Database,
  'edit-3': Edit3,
  'edit': Edit,
  'external-link': ExternalLink,
  'eye-off': EyeOff,
  'eye': Eye,
  'file-text': FileText,
  'file': File,
  'filter': Filter,
  'flag': Flag,
  'folder': Folder,
  'github': Github,
  'globe': Globe,
  'grid': Grid,
  'hard-drive': HardDrive,
  'heading-one': HeadingOne,
  'heading-two': HeadingTwo,
  'heading-three': HeadingThree,
  'help-circle': HelpCircle,
  'image': Image,
  'inbox': Inbox,
  'info': Info,
  'italic': Italic,
  'layout': Layout,
  'link': Link,
  'lock': Lock,
  'log-out': LogOut,
  'mail': Mail,
  'map-pin': MapPin,
  'maximize': Maximize,
  'menu': Menu,
  'minimize': Minimize,
  'moon': Moon,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  'move': Move,
  'numbered-list': NumberedList,
  'package': Package,
  'paperclip': Paperclip,
  'pie-chart': PieChart,
  'plus-circle': PlusCircle,
  'plus': Plus,
  'quote': Quote,
  'radio': Radio,
  'save': Save,
  'search': Search,
  'server': Server,
  'settings': Settings,
  'share-2': Share2,
  'shopping-cart': ShoppingCart,
  'sidebar': Sidebar,
  'sun': Sun,
  'trash-2': Trash2,
  'underline': Underline,
  'upload-cloud': UploadCloud,
  'upload': Upload,
  'user': User,
  'users': Users,
  'x': X,
  'zap': Zap,
};

const Icon = ({ name, ...props }) => {
  const IconComponent = iconComponents[name] || iconComponents.x;

  return <IconComponent {...props} />;
};

const SizedIcon = ({ size, className, ...props }) => (
  <Icon {...props} className={className} size={size === 'lg' ? '24' : size ? size : '18'} />
);

export default SizedIcon;
