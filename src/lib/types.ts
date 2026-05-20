export type Status = "planned" | "done" | "missed";
export type RepeatMode = "none" | "once" | "after" | "repeat";

export interface RepeatConfig {
  mode: RepeatMode;
  intervalDays: number;
  repeatDate: string;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  cultureIds: string[];
}

export interface Culture {
  id: string;
  name: string;
  icon: string;
  groupIds: string[];
}

export interface WorkType {
  id: string;
  name: string;
  icon: string;
}

export interface Preparation {
  id: string;
  name: string;
  purposeShort: string;
  dosage: string;
  waitingPeriod: string;
  image?: string;
  shortName?: string;
}

export interface Task {
  id: string;
  batchId: string;
  status: Status;
  date: string;
  groupIds: string[];
  cultureIds: string[];
  workTypeIds: string[];
  preparationIds: string[];
  repeat: RepeatConfig;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  version: number;
  groups: Group[];
  cultures: Culture[];
  workTypes: WorkType[];
  preparations: Preparation[];
  tasks: Task[];
}
