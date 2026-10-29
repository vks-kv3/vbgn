export interface SpeechPreset {
  id: string;
  title: string;
  author: string;
  category: string;
  text: string;
}

export interface TtsVoice {
  id: string;
  name: string;
  displayName: string;
  description: string;
  gender: "nam" | "nu";
  tone: string;
}

export interface TtsStyle {
  id: string;
  name: string;
  description: string;
  colorClass: string;
}

export interface SpeechHistoryItem {
  id: string;
  title: string;
  text: string;
  voiceId: string;
  voiceName: string;
  styleId: string;
  styleName: string;
  audioUrl: string; // Base64 WAV data URI
  duration: number; // in seconds
  createdAt: string;
}
