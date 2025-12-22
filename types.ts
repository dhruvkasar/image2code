export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface GenerationResult {
  code: string;
  explanation?: string;
}

export interface CodePreviewProps {
  code: string;
}
