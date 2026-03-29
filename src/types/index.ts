// ========================================
// Next Dictionary - Type Definitions
// ========================================

// --- Database Types ---

export type ProjectMode = 'dictionary' | 'tree' | 'flow';
export type Visibility = 'private' | 'public';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type EdgeType = 'tree' | 'flow' | 'dependency';
export type GenerationStatus = 'success' | 'failed';
export type Provider = 'openrouter';

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  mode: ProjectMode;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export interface Node {
  id: string;
  project_id: string;
  title: string;
  summary: string | null;
  content: string | null;
  level: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Edge {
  id: string;
  project_id: string;
  from_node_id: string;
  to_node_id: string;
  type: EdgeType;
  label: string | null;
  order_index: number;
  created_at: string;
}

export interface UserProviderKey {
  id: string;
  user_id: string;
  provider: Provider;
  encrypted_key: string;
  created_at: string;
  updated_at: string;
}

export interface GenerationLog {
  id: string;
  user_id: string | null;
  project_id: string | null;
  mode: ProjectMode | null;
  topic: string | null;
  provider: string | null;
  used_user_key: boolean;
  status: GenerationStatus | null;
  error_message: string | null;
  created_at: string;
}

// --- API Request Types ---

export interface GenerateDictionaryRequest {
  topic: string;
  count?: number;
  difficulty?: Difficulty;
}

export interface GenerateTreeRequest {
  topic: string;
  depth?: number;
  difficulty?: Difficulty;
}

export interface GenerateFlowRequest {
  topic: string;
  difficulty?: Difficulty;
}

export interface UpdateProjectRequest {
  title?: string;
  visibility?: Visibility;
}

export interface UpdateNodeRequest {
  title?: string;
  summary?: string;
  content?: string;
  order_index?: number;
}

export interface SaveProviderKeyRequest {
  provider: Provider;
  api_key: string;
}

// --- API Response Types ---

export interface GeneratedNode {
  title: string;
  summary: string;
  content: string;
}

export interface GenerateDictionaryResponse {
  project: {
    id: string;
    title: string;
    topic: string;
    mode: 'dictionary';
  };
  nodes: GeneratedNode[];
}

export interface GenerateTreeResponse {
  project: {
    id: string;
    title: string;
    topic: string;
    mode: 'tree';
  };
  nodes: GeneratedNode[];
  edges: Array<{
    from_title: string;
    to_title: string;
    type: 'tree';
  }>;
}

export interface GenerateFlowResponse {
  project: {
    id: string;
    title: string;
    topic: string;
    mode: 'flow';
  };
  nodes: GeneratedNode[];
  edges: Array<{
    from_title: string;
    to_title: string;
    type: 'flow';
    label: string;
  }>;
}

export interface ProjectListItem {
  id: string;
  title: string;
  topic: string;
  mode: ProjectMode;
  visibility: Visibility;
  updated_at: string;
  profile?: {
    display_name: string | null;
  };
}

export interface ProjectDetail extends Project {
  nodes: Node[];
  edges: Edge[];
}

// --- LLM Types ---

export interface LLMConfig {
  apiKey: string;
  model?: string;
}

export interface DictionaryPromptParams {
  topic: string;
  count: number;
  difficulty?: Difficulty;
}
