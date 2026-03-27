import { Animated } from 'react-native';

// User Types
export interface User {
    id: string;
    email: string;
    role: 'student' | 'warden';
    name: string;
    assignedHostel: string;
    roomNumber?: string;
    phoneNumber?: string;
    createdAt: string;
}

// Issue Types
export interface Issue {
    _id: string;
    userId: string;
    name: string;
    hostelNumber: string;
    roomNumber: string;
    description: string;
    photoBase64?: string;
    status: 'pending' | 'in_progress' | 'resolved';
    resolutionPhotoBase64?: string;
    resolutionRemark?: string;
    resolvedAt?: string;
    resolvedBy?: string;
    createdAt: string;
    updatedAt: string;
}

// Notification Types
export interface Notification {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    issueId: string;
}

// Theme Types
export interface ThemeColors {
    text: string;
    textSecondary: string;
    textMuted: string;
    background: string;
    card: string;
    surface: string;
    surfaceHighlight: string;
    tint: string;
    icon: string;
    tabIconDefault: string;
    tabIconSelected: string;
    border: string;
    borderMuted: string;
    primary: string;
    primaryGradient: string[];
    danger: string;
    dangerBackground: string;
    success: string;
    successBackground: string;
    warning: string;
    warningBackground: string;
    inputBackground: string;
    glassBorder: string;
}

// Component Props Types
export interface NotificationCardProps {
    notif: Notification;
    index: number;
    cardAnim: Animated.Value;
    pulseAnim: Animated.Value;
    isDark: boolean;
    colors: ThemeColors;
    onPress: () => void;
}

export interface StatCardProps {
    icon: string;
    value: number;
    label: string;
    color: string;
    index: number;
    statCardAnim: Animated.Value;
    isDark: boolean;
    colors: ThemeColors;
    shimmerAnim: Animated.Value;
}

export interface AnimatedActionCardProps {
    children: React.ReactNode;
    onPress: () => void;
    style: any;
    gradient?: boolean;
    colors?: string[];
    shimmerAnim: Animated.Value;
}

export interface ReportCardProps {
    item: Issue;
    isResolved: boolean;
    colors: ThemeColors;
    isDark: boolean;
    onPress: () => void;
}
