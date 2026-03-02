export interface UserProfile {
  firstName: string;
  prayerLife: 'new' | 'inconsistent' | 'growing';
  reminderTime: string;
  onboardingComplete: boolean;
}

export interface DayProgress {
  day: number;
  completed: boolean;
  completedAt: string | null;
  duration: number;
}

export type Soundscape = 'piano' | 'rain' | 'nature' | 'silence';
export type FontSize = 'normal' | 'large';

export interface AppState {
  user: UserProfile | null;
  currentDay: number;
  progress: DayProgress[];
  streakCount: number;
  lastCompletedDate: string | null;
  journeyComplete: boolean;
  ambientMuted: boolean;
  soundscape: Soundscape;
  darkMode: boolean;
  fontSize: FontSize;
}

export interface TriadItem {
  label: string | null;
  text: string;
}

export interface SilenceSection {
  durationSeconds: number;
  prompt: string;
}

export type SessionPhase = 'settle' | 'teach' | 'triad' | 'silence' | 'act';

export interface DayContent {
  day: number;
  title: string;
  phase: string;
  settle: string;
  teach: string;
  triad: TriadItem[];
  silence: SilenceSection;
  act: string;
}

export type PrayerLifeOption = {
  value: UserProfile['prayerLife'];
  label: string;
  description: string;
};
