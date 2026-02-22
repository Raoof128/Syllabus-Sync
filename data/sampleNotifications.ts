// data/sampleNotifications.ts
import { Notification } from "@/lib/types";

// Helper to get dates relative to today
const getDate = (hoursAgo: number): Date => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date;
};

export const sampleNotifications: Notification[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010",
    title: "Welcome to Syllabus Sync!",
    message:
      "Get started by adding your units and deadlines to stay organized this semester.",
    type: "system",
    read: false,
    createdAt: getDate(0),
    link: "/home",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011",
    title: "Career Fair Tomorrow",
    message:
      "Don't miss the Career Fair 2026 at Campus Hub. Meet top employers!",
    type: "event",
    read: false,
    createdAt: getDate(2),
    link: "/feed",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012",
    title: "Free Pizza Today!",
    message: "Free Pizza Friday is happening now at the Library Courtyard.",
    type: "event",
    read: false,
    createdAt: getDate(1),
    link: "/feed",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440013",
    title: "Upcoming Class Reminder",
    message: "Your next class starts in 30 minutes at C5C Room 204.",
    type: "class",
    read: false,
    createdAt: getDate(0.5),
    link: "/home",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440014",
    title: "Assignment Due Soon",
    message:
      "Reminder: Your assignment is due in 2 days. Don't forget to submit!",
    type: "deadline",
    read: false,
    createdAt: getDate(3),
    link: "/calendar",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440015",
    title: "Study Skills Workshop",
    message: "Reminder: Study Skills Workshop starts tomorrow at 2:00 PM.",
    type: "event",
    read: true,
    createdAt: getDate(12),
    link: "/feed",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440016",
    title: "Tech Networking Night",
    message:
      "Join us for Tech Networking Night this Friday at 6:00 PM. Great opportunity to meet industry professionals!",
    type: "event",
    read: false,
    createdAt: getDate(4),
    link: "/feed",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440017",
    title: "Class Cancelled",
    message:
      "Your COMP2310 lecture today has been cancelled. Check your email for details.",
    type: "class",
    read: true,
    createdAt: getDate(6),
    link: "/home",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440018",
    title: "Exam Schedule Released",
    message:
      "Your exam schedule is now available. Check the calendar to view all exam dates.",
    type: "deadline",
    read: true,
    createdAt: getDate(18),
    link: "/calendar",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440019",
    title: "International Food Festival",
    message:
      "Don't miss the International Food Festival tomorrow! Free samples from around the world.",
    type: "event",
    read: false,
    createdAt: getDate(5),
    link: "/feed",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440020",
    title: "New Feature: Campus Map",
    message: "Navigate campus easily with our new interactive map feature.",
    type: "system",
    read: true,
    createdAt: getDate(24),
    link: "/map",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440021",
    title: "Library Hours Extended",
    message:
      "Good news! The library will be open until midnight during exam period.",
    type: "system",
    read: true,
    createdAt: getDate(36),
    link: "/home",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440022",
    title: "Research Seminar: AI in Healthcare",
    message:
      "Join us for an exciting research seminar on AI applications in medicine this Thursday.",
    type: "event",
    read: true,
    createdAt: getDate(48),
    link: "/feed",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440023",
    title: "Deadline Extension",
    message:
      "Great news! Your assignment deadline has been extended by 3 days.",
    type: "deadline",
    read: true,
    createdAt: getDate(72),
    link: "/calendar",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440024",
    title: "Student Club Welcome Day",
    message:
      "Discover new clubs and societies on campus. Free snacks provided!",
    type: "event",
    read: true,
    createdAt: getDate(96),
    link: "/feed",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440025",
    title: "Profile Update Reminder",
    message:
      "Please review your profile details (name, email, and units) to keep notifications accurate.",
    type: "system",
    read: false,
    createdAt: getDate(0.25),
    link: "/settings",
  },
];
