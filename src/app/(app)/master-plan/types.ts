export interface PhaseItem {
  id: string;
  title: string;
  is_completed: boolean;
  notes: string | null;
  item_order: number;
  assignee_user_id: string | null;
  assignee_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
}

export interface ProjectMember {
  user_id: string;
  display_name: string;
}

export interface PhaseSection {
  id: string;
  title: string;
  section_order: number;
  items: PhaseItem[];
}

export interface Phase {
  id: string;
  title: string;
  phase_order: number;
  sections: PhaseSection[];
}

export interface MasterPlanData {
  project: { id: string; name: string; target_open_date: string | null };
  phases: Phase[];
  totalItems: number;
  completedItems: number;
  projectMembers: ProjectMember[];
}
