import React from "react";
import Activity from "./icons/Activity";
import AlertCircle from "./icons/AlertCircle";
import AlertTriangle from "./icons/AlertTriangle";
import ArrowDown from "./icons/ArrowDown";
import ArrowLeft from "./icons/ArrowLeft";
import ArrowRight from "./icons/ArrowRight";
import ArrowUp from "./icons/ArrowUp";
import AtSign from "./icons/AtSign";
import BarChart from "./icons/BarChart";
import Bell from "./icons/Bell";
import Bold from "./icons/Bold";
import Box from "./icons/Box";
import BulletedList from "./icons/BulletedList";
import Calendar from "./icons/Calendar";
import Check from "./icons/Check";
import ChevronDown from "./icons/ChevronDown";
import ChevronRight from "./icons/ChevronRight";
import Clock from "./icons/Clock";
import Code from "./icons/Code";
import CodeBlock from "./icons/CodeBlock";
import Compass from "./icons/Compass";
import Copy from "./icons/Copy";
import Database from "./icons/Database";
import Edit3 from "./icons/Edit3";
import Edit from "./icons/Edit";
import ExternalLink from "./icons/ExternalLink";
import EyeOff from "./icons/EyeOff";
import Eye from "./icons/Eye";
import FileText from "./icons/FileText";
import File from "./icons/File";
import Filter from "./icons/Filter";
import Flag from "./icons/Flag";
import Folder from "./icons/Folder";
import Github from "./icons/Github";
import Globe from "./icons/Globe";
import Grid from "./icons/Grid";
import HardDrive from "./icons/HardDrive";
import HeadingOne from "./icons/HeadingOne";
import HeadingTwo from "./icons/HeadingTwo";
import HeadingThree from "./icons/HeadingThree";
import HelpCircle from "./icons/HelpCircle";
import Image from "./icons/Image";
import Inbox from "./icons/Inbox";
import Info from "./icons/Info";
import Italic from "./icons/Italic";
import Layout from "./icons/Layout";
import Link from "./icons/Link";
import Lock from "./icons/Lock";
import LogOut from "./icons/LogOut";
import Mail from "./icons/Mail";
import MapPin from "./icons/MapPin";
import Maximize from "./icons/Maximize";
import Menu from "./icons/Menu";
import Minimize from "./icons/Minimize";
import Moon from "./icons/Moon";
import MoreHorizontal from "./icons/MoreHorizontal";
import MoreVertical from "./icons/MoreVertical";
import Move from "./icons/Move";
import NumberedList from "./icons/NumberedList";
import Package from "./icons/Package";
import Paperclip from "./icons/Paperclip";
import PieChart from "./icons/PieChart";
import PlusCircle from "./icons/PlusCircle";
import Plus from "./icons/Plus";
import Quote from "./icons/Quote";
import Radio from "./icons/Radio";
import Save from "./icons/Save";
import Search from "./icons/Search";
import Server from "./icons/Server";
import Settings from "./icons/Settings";
import Share2 from "./icons/Share2";
import ShoppingCart from "./icons/ShoppingCart";
import Sidebar from "./icons/Sidebar";
import Sun from "./icons/Sun";
import Trash2 from "./icons/Trash2";
import Underline from "./icons/Underline";
import UploadCloud from "./icons/UploadCloud";
import Upload from "./icons/Upload";
import User from "./icons/User";
import Users from "./icons/Users";
import X from "./icons/X";
import Zap from "./icons/Zap";

// const Icon = ({ name }) => (
//   <LazyLoadModule resolve={() => import(`./icons/${name}.svg`)} />
// );

const Icon = ({ name, ...props }) => {
  switch (name) {
    case "activity":
      return <Activity {...props} />;
    case "alert-circle":
      return <AlertCircle {...props} />;
    case "alert-triangle":
      return <AlertTriangle {...props} />;
    case "arrow-down":
      return <ArrowDown {...props} />;
    case "arrow-left":
      return <ArrowLeft {...props} />;
    case "arrow-right":
      return <ArrowRight {...props} />;
    case "arrow-up":
      return <ArrowUp {...props} />;
    case "at-sign":
      return <AtSign {...props} />;
    case "bar-chart":
      return <BarChart {...props} />;
    case "bell":
      return <Bell {...props} />;
    case "bold":
      return <Bold {...props} />;
    case "box":
      return <Box {...props} />;
    case "bulleted-list":
      return <BulletedList {...props} />;
    case "calendar":
      return <Calendar {...props} />;
    case "check":
      return <Check {...props} />;
    case "chevron-down":
      return <ChevronDown {...props} />;
    case "chevron-right":
      return <ChevronRight {...props} />;
    case "clock":
      return <Clock {...props} />;
    case "code":
      return <Code {...props} />;
    case "code-block":
      return <CodeBlock {...props} />;
    case "compass":
      return <Compass {...props} />;
    case "copy":
      return <Copy {...props} />;
    case "database":
      return <Database {...props} />;
    case "edit-3":
      return <Edit3 {...props} />;
    case "edit":
      return <Edit {...props} />;
    case "external-link":
      return <ExternalLink {...props} />;
    case "eye-off":
      return <EyeOff {...props} />;
    case "eye":
      return <Eye {...props} />;
    case "file-text":
      return <FileText {...props} />;
    case "file":
      return <File {...props} />;
    case "filter":
      return <Filter {...props} />;
    case "flag":
      return <Flag {...props} />;
    case "folder":
      return <Folder {...props} />;
    case "github":
      return <Github {...props} />;
    case "globe":
      return <Globe {...props} />;
    case "grid":
      return <Grid {...props} />;
    case "hard-drive":
      return <HardDrive {...props} />;
    case "heading-one":
      return <HeadingOne {...props} />;
    case "heading-two":
      return <HeadingTwo {...props} />;
    case "heading-three":
      return <HeadingThree {...props} />;
    case "help-circle":
      return <HelpCircle {...props} />;
    case "image":
      return <Image {...props} />;
    case "inbox":
      return <Inbox {...props} />;
    case "info":
      return <Info {...props} />;
    case "italic":
      return <Italic {...props} />;
    case "layout":
      return <Layout {...props} />;
    case "link":
      return <Link {...props} />;
    case "lock":
      return <Lock {...props} />;
    case "log-out":
      return <LogOut {...props} />;
    case "mail":
      return <Mail {...props} />;
    case "map-pin":
      return <MapPin {...props} />;
    case "maximize":
      return <Maximize {...props} />;
    case "menu":
      return <Menu {...props} />;
    case "minimize":
      return <Minimize {...props} />;
    case "moon":
      return <Moon {...props} />;
    case "more-horizontal":
      return <MoreHorizontal {...props} />;
    case "more-vertical":
      return <MoreVertical {...props} />;
    case "move":
      return <Move {...props} />;
    case "numbered-list":
      return <NumberedList {...props} />;
    case "package":
      return <Package {...props} />;
    case "paperclip":
      return <Paperclip {...props} />;
    case "pie-chart":
      return <PieChart {...props} />;
    case "plus-circle":
      return <PlusCircle {...props} />;
    case "plus":
      return <Plus {...props} />;
    case "quote":
      return <Quote {...props} />;
    case "radio":
      return <Radio {...props} />;
    case "save":
      return <Save {...props} />;
    case "search":
      return <Search {...props} />;
    case "server":
      return <Server {...props} />;
    case "settings":
      return <Settings {...props} />;
    case "share-2":
      return <Share2 {...props} />;
    case "shopping-cart":
      return <ShoppingCart {...props} />;
    case "sidebar":
      return <Sidebar {...props} />;
    case "sun":
      return <Sun {...props} />;
    case "trash-2":
      return <Trash2 {...props} />;
    case "underline":
      return <Underline {...props} />;
    case "upload-cloud":
      return <UploadCloud {...props} />;
    case "upload":
      return <Upload {...props} />;
    case "user":
      return <User {...props} />;
    case "users":
      return <Users {...props} />;
    case "x":
      return <X {...props} />;
    case "zap":
      return <Zap {...props} />;
    default:
      return <X {...props} />;
  }
};

const SizedIcon = ({ size, className, ...props }) => (
  <Icon
    {...props}
    className={className}
    size={size === "lg" ? "24" : size ? size : "18"}
  />
);

export default SizedIcon;
