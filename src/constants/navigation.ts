import {
  LayoutDashboard,
  BookOpen,
  Clock3,
  FileText,
  User,
  Trophy,
  Users,
  TrendingUp,
  CreditCard,
  DollarSign,
  LibraryBig,
  Bell,
  Megaphone,
  Image,
  MessageSquare,
  ClipboardCheck,
  ClipboardList,
  Map,
  BookMarked,
  FolderOpen,
} from 'lucide-react';

export const studentMenuItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: FileText, label: 'Mock Test', href: '/dashboard/exams' },
  { icon: BookMarked, label: 'Practice', href: '/dashboard/practice' },
  { icon: Map, label: 'Pathways', href: '/dashboard/pathways' },
  { icon: BookOpen, label: 'Flash Cards', href: '/dashboard/flashcards' },
  { icon: MessageSquare, label: 'Forum', href: '/dashboard/forum' },
  { icon: CreditCard, label: 'Billing', href: '/dashboard/billing' },
  { icon: User, label: 'Account', href: '/dashboard/settings' },
];

export const parentMenuItems = [
  { icon: LayoutDashboard, label: 'Parent Home', href: '/dashboard' },
  { icon: TrendingUp, label: 'Exam Results', href: '/dashboard/results' },
  { icon: MessageSquare, label: 'Forum', href: '/dashboard/forum' },
  { icon: CreditCard, label: 'Billing', href: '/dashboard/billing' },
  { icon: Megaphone, label: 'Announcements', href: '/dashboard/announcements' },
];

export const adminMenuGroups = [
  {
    group: null,
    items: [
      { icon: LayoutDashboard, label: 'Admin Panel', href: '/dashboard' },
    ],
  },
  {
    group: 'User Management',
    items: [
      { icon: Users, label: 'Users', href: '/dashboard/users' },
    ],
  },
  {
    group: 'Content',
    items: [
      { icon: ClipboardCheck, label: 'Rubrics', href: '/dashboard/rubrics' },
      { icon: LibraryBig, label: 'Passages', href: '/dashboard/passages' },
      { icon: BookOpen, label: 'Subjects', href: '/dashboard/subjects' },
      { icon: Trophy, label: 'Question Bank', href: '/dashboard/questions' },
      { icon: FolderOpen, label: 'Resources', href: '/dashboard/resources' },
    ],
  },
  {
    group: 'Exam & Assessment',
    items: [
      { icon: FileText, label: 'Exams', href: '/dashboard/exams' },
      { icon: Map, label: 'Pathways', href: '/dashboard/pathways' },
      { icon: ClipboardList, label: 'Practice', href: '/dashboard/practice/assignments' },
      { icon: TrendingUp, label: 'Analytics', href: '/dashboard/performance' },
    ],
  },
  {
    group: 'Community',
    items: [
      { icon: MessageSquare, label: 'Forum', href: '/dashboard/forum' },
    ],
  },
  {
    group: 'Communication',
    items: [
      { icon: Clock3, label: 'Countdown', href: '/dashboard/countdowns' },
      { icon: Image, label: 'Banners', href: '/dashboard/banners' },
      { icon: Megaphone, label: 'Broadcasts', href: '/dashboard/broadcasts' },
      { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
    ],
  },
  {
    group: 'Finance',
    items: [
      { icon: DollarSign, label: 'Revenue', href: '/dashboard/billing' },
    ],
  },
];

export const adminMenuItems = adminMenuGroups.flatMap((g) => g.items);

export const tutorMenuGroups = [
  {
    group: null,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    group: 'User Management',
    items: [
      { icon: Users, label: 'Students', href: '/dashboard/users' },
    ],
  },
  {
    group: 'Content',
    items: [
      { icon: ClipboardCheck, label: 'Rubrics', href: '/dashboard/rubrics' },
      { icon: LibraryBig, label: 'Passages', href: '/dashboard/passages' },
      { icon: BookOpen, label: 'Subjects', href: '/dashboard/subjects' },
      { icon: Trophy, label: 'Question Bank', href: '/dashboard/questions' },
      { icon: FolderOpen, label: 'Resources', href: '/dashboard/resources' },
    ],
  },
  {
    group: 'Exam & Assessment',
    items: [
      { icon: FileText, label: 'Exams', href: '/dashboard/exams' },
      { icon: Map, label: 'Pathways', href: '/dashboard/pathways' },
      { icon: ClipboardList, label: 'Practice', href: '/dashboard/practice/assignments' },
      { icon: TrendingUp, label: 'Analytics', href: '/dashboard/performance' },
    ],
  },
];

export const tutorMenuItems = tutorMenuGroups.flatMap((g) => g.items);
