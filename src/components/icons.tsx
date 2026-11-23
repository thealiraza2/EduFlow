/**
 * EduFlow icon set — Tabler Icons (https://tabler.io/icons), one style everywhere.
 * Exposes the names the codebase already uses so every screen switches to Tabler
 * without touching page logic. Props: className, size, strokeWidth (→ Tabler stroke).
 */
import { forwardRef, type SVGProps } from "react";
import {
  IconUpload,
  IconPrinter,
  IconArrowsShuffle,
  IconBooks,
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconAward,
  IconBabyCarriage,
  IconCash,
  IconChartBar,
  IconBell,
  IconBook,
  IconNotebook,
  IconBrain,
  IconBuilding,
  IconCalendar,
  IconCalendarWeek,
  IconCheck,
  IconCircleCheck,
  IconChevronDown,
  IconChevronRight,
  IconClipboardCheck,
  IconClock,
  IconCode,
  IconCompass,
  IconCookie,
  IconCopy,
  IconCreditCard,
  IconCurrencyDollar,
  IconDownload,
  IconEdit,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconFileCheck,
  IconFileUnknown,
  IconFileSpreadsheet,
  IconFileText,
  IconFilter,
  IconSchool,
  IconHeart,
  IconHeartHandshake,
  IconHelpCircle,
  IconInbox,
  IconInfoCircle,
  IconKey,
  IconStack2,
  IconLayoutDashboard,
  IconLoader2,
  IconLock,
  IconLogin,
  IconLogout,
  IconMail,
  IconMapPin,
  IconSpeakerphone,
  IconMenu2,
  IconMessage,
  IconMessageDots,
  IconMinus,
  IconDeviceDesktopCheck,
  IconPhone,
  IconPhoneCall,
  IconPlus,
  IconCirclePlus,
  IconPower,
  IconQrcode,
  IconReceipt,
  IconRefresh,
  IconDeviceFloppy,
  IconScale,
  IconBuildingCommunity,
  IconSearch,
  IconSend,
  IconSettings,
  IconAdjustmentsHorizontal,
  IconShieldExclamation,
  IconShieldCheck,
  IconSparkles,
  IconTrash,
  IconTrendingDown,
  IconTrendingUp,
  IconTrophy,
  IconLockOpen,
  IconUser,
  IconUserCheck,
  IconUserPlus,
  IconUsers,
  IconUsersGroup,
  IconUserX,
  IconWallet,
  IconX,
  IconCircleX,
  IconBolt,
  IconHome,
  IconCommand,
  IconChevronLeft,
  IconDots,
  IconBellRinging,
  IconCalendarEvent,
  IconPencil,
  IconCircleDot,
  IconChartDonut3,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref" | "stroke"> {
  size?: number | string;
  strokeWidth?: number | string;
  /** Tabler-native alias for strokeWidth */
  stroke?: number | string;
}

export type LucideIcon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;
export type AppIcon = LucideIcon;

function wrap(Base: TablerIcon, name: string): LucideIcon {
  // Tabler's component typing is narrower than the SVG props we accept; cast once here.
  const B = Base as unknown as React.ComponentType<Record<string, unknown>>;
  const C = forwardRef<SVGSVGElement, IconProps>(({ strokeWidth, stroke, size, ...props }, ref) => (
    <B ref={ref} size={size ?? 24} stroke={stroke ?? strokeWidth ?? 1.75} aria-hidden={props["aria-label"] ? undefined : true} {...(props as object)} />
  ));
  C.displayName = name;
  return C;
}

export const AlertCircle = wrap(IconAlertCircle, "AlertCircle");
export const AlertTriangle = wrap(IconAlertTriangle, "AlertTriangle");
export const ArrowLeft = wrap(IconArrowLeft, "ArrowLeft");
export const ArrowRight = wrap(IconArrowRight, "ArrowRight");
export const ArrowUpRight = wrap(IconArrowUpRight, "ArrowUpRight");
export const Award = wrap(IconAward, "Award");
export const Baby = wrap(IconBabyCarriage, "Baby");
export const Banknote = wrap(IconCash, "Banknote");
export const BarChart3 = wrap(IconChartBar, "BarChart3");
export const Bell = wrap(IconBell, "Bell");
export const BellRinging = wrap(IconBellRinging, "BellRinging");
export const BookOpen = wrap(IconBook, "BookOpen");
export const BookOpenCheck = wrap(IconNotebook, "BookOpenCheck");
export const Brain = wrap(IconBrain, "Brain");
export const Building2 = wrap(IconBuilding, "Building2");
export const Calendar = wrap(IconCalendar, "Calendar");
export const CalendarDays = wrap(IconCalendarWeek, "CalendarDays");
export const CalendarEvent = wrap(IconCalendarEvent, "CalendarEvent");
export const Check = wrap(IconCheck, "Check");
export const CheckCircle = wrap(IconCircleCheck, "CheckCircle");
export const CheckCircle2 = wrap(IconCircleCheck, "CheckCircle2");
export const ChevronDown = wrap(IconChevronDown, "ChevronDown");
export const ChevronLeft = wrap(IconChevronLeft, "ChevronLeft");
export const ChevronRight = wrap(IconChevronRight, "ChevronRight");
export const CircleAlert = wrap(IconAlertCircle, "CircleAlert");
export const CircleCheck = wrap(IconCircleCheck, "CircleCheck");
export const CircleDot = wrap(IconCircleDot, "CircleDot");
export const ClipboardCheck = wrap(IconClipboardCheck, "ClipboardCheck");
export const Clock = wrap(IconClock, "Clock");
export const Code2 = wrap(IconCode, "Code2");
export const Command = wrap(IconCommand, "Command");
export const Compass = wrap(IconCompass, "Compass");
export const Cookie = wrap(IconCookie, "Cookie");
export const Copy = wrap(IconCopy, "Copy");
export const CreditCard = wrap(IconCreditCard, "CreditCard");
export const DollarSign = wrap(IconCurrencyDollar, "DollarSign");
export const Donut = wrap(IconChartDonut3, "Donut");
export const Dots = wrap(IconDots, "Dots");
export const Download = wrap(IconDownload, "Download");
export const Upload = wrap(IconUpload, "Upload");
export const Printer = wrap(IconPrinter, "Printer");
export const Shuffle = wrap(IconArrowsShuffle, "Shuffle");
export const Library = wrap(IconBooks, "Library");
export const Edit3 = wrap(IconEdit, "Edit3");
export const ExternalLink = wrap(IconExternalLink, "ExternalLink");
export const Eye = wrap(IconEye, "Eye");
export const EyeOff = wrap(IconEyeOff, "EyeOff");
export const FileCheck = wrap(IconFileCheck, "FileCheck");
export const FileCheck2 = wrap(IconFileCheck, "FileCheck2");
export const FileQuestion = wrap(IconFileUnknown, "FileQuestion");
export const FileSpreadsheet = wrap(IconFileSpreadsheet, "FileSpreadsheet");
export const FileText = wrap(IconFileText, "FileText");
export const Filter = wrap(IconFilter, "Filter");
export const GraduationCap = wrap(IconSchool, "GraduationCap");
export const Heart = wrap(IconHeart, "Heart");
export const HeartHandshake = wrap(IconHeartHandshake, "HeartHandshake");
export const HelpCircle = wrap(IconHelpCircle, "HelpCircle");
export const Home = wrap(IconHome, "Home");
export const Inbox = wrap(IconInbox, "Inbox");
export const Info = wrap(IconInfoCircle, "Info");
export const KeyRound = wrap(IconKey, "KeyRound");
export const Layers = wrap(IconStack2, "Layers");
export const LayoutDashboard = wrap(IconLayoutDashboard, "LayoutDashboard");
export const Loader2 = wrap(IconLoader2, "Loader2");
export const Lock = wrap(IconLock, "Lock");
export const LogIn = wrap(IconLogin, "LogIn");
export const LogOut = wrap(IconLogout, "LogOut");
export const Mail = wrap(IconMail, "Mail");
export const MapPin = wrap(IconMapPin, "MapPin");
export const Megaphone = wrap(IconSpeakerphone, "Megaphone");
export const Menu = wrap(IconMenu2, "Menu");
export const MessageSquare = wrap(IconMessage, "MessageSquare");
export const MessageSquareText = wrap(IconMessageDots, "MessageSquareText");
export const Minus = wrap(IconMinus, "Minus");
export const MonitorCheck = wrap(IconDeviceDesktopCheck, "MonitorCheck");
export const Pencil = wrap(IconPencil, "Pencil");
export const Phone = wrap(IconPhone, "Phone");
export const PhoneCall = wrap(IconPhoneCall, "PhoneCall");
export const Plus = wrap(IconPlus, "Plus");
export const PlusCircle = wrap(IconCirclePlus, "PlusCircle");
export const Power = wrap(IconPower, "Power");
export const QrCode = wrap(IconQrcode, "QrCode");
export const Receipt = wrap(IconReceipt, "Receipt");
export const RefreshCw = wrap(IconRefresh, "RefreshCw");
export const Save = wrap(IconDeviceFloppy, "Save");
export const Scale = wrap(IconScale, "Scale");
export const School = wrap(IconBuildingCommunity, "School");
export const Search = wrap(IconSearch, "Search");
export const Send = wrap(IconSend, "Send");
export const Settings = wrap(IconSettings, "Settings");
export const Settings2 = wrap(IconAdjustmentsHorizontal, "Settings2");
export const ShieldAlert = wrap(IconShieldExclamation, "ShieldAlert");
export const ShieldCheck = wrap(IconShieldCheck, "ShieldCheck");
export const Sparkles = wrap(IconSparkles, "Sparkles");
export const Trash2 = wrap(IconTrash, "Trash2");
export const TrendingDown = wrap(IconTrendingDown, "TrendingDown");
export const TrendingUp = wrap(IconTrendingUp, "TrendingUp");
export const Trophy = wrap(IconTrophy, "Trophy");
export const Unlock = wrap(IconLockOpen, "Unlock");
export const User = wrap(IconUser, "User");
export const UserCheck = wrap(IconUserCheck, "UserCheck");
export const UserPlus = wrap(IconUserPlus, "UserPlus");
export const Users = wrap(IconUsers, "Users");
export const Users2 = wrap(IconUsersGroup, "Users2");
export const UserX = wrap(IconUserX, "UserX");
export const Wallet = wrap(IconWallet, "Wallet");
export const X = wrap(IconX, "X");
export const XCircle = wrap(IconCircleX, "XCircle");
export const Zap = wrap(IconBolt, "Zap");
