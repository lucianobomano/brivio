export type BrandCategory = 
    | 'discovery'
    | 'strategy'
    | 'verbal_identity'
    | 'visual_identity'
    | 'sensorial_identity'
    | 'behavioural_identity'
    | 'activation'
    | 'governance'
    | 'intelligence'
    | 'agent'
    | 'utility';

export type NodeStatus = 
    | 'draft'
    | 'ai_proposed'
    | 'needs_validation'
    | 'research_backed'
    | 'approved'
    | 'deprecated'
    | 'rejected'
    | 'archived';

export type SemanticRelationship = 
    | 'supports'
    | 'depends_on'
    | 'derived_from'
    | 'influences'
    | 'uses'
    | 'applies_to'
    | 'belongs_to'
    | 'contradicts'
    | 'replaces'
    | 'generated_from'
    | 'validated_by';

export interface BrandObject {
    id: string;
    brand_id: string;
    space_id?: string;
    type: string;
    category: BrandCategory;
    title: string;
    content: any; // text, structured fields, color palettes, fonts, etc.
    metadata?: Record<string, any>;
    rationale?: string;
    status: NodeStatus;
    confidence?: number;
    source?: 'human' | 'ai' | 'research' | 'imported';
    version: number;
    created_by?: string;
    is_official: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface NodeOutputVersion {
    id: string;
    version: number;
    title: string;
    content: any;
    status: NodeStatus;
    rationale?: string;
    created_at: string;
    author?: string;
}

export interface BrandNode {
    id: string;
    space_id: string;
    object_id: string;
    type: string;
    category: BrandCategory;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    is_collapsed?: boolean;
    group_id?: string;
    object: BrandObject;
    outputs_history: NodeOutputVersion[];
    is_executing?: boolean;
}

export interface BrandRelationship {
    id: string;
    space_id: string;
    source_node_id: string;
    target_node_id: string;
    relationship_type: SemanticRelationship;
    status?: 'active' | 'pending' | 'rejected';
    metadata?: Record<string, any>;
}

export interface BrandGroup {
    id: string;
    space_id: string;
    title: string;
    category: BrandCategory;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    is_collapsed?: boolean;
}

export interface BrandDecision {
    id: string;
    brand_id: string;
    space_id?: string;
    decision_number: number;
    title: string;
    decision: string;
    rationale: string;
    status: 'approved' | 'rejected' | 'under_review';
    related_objects: string[];
    author: string;
    created_at: string;
}

export interface BrandSpace {
    id: string;
    brand_id: string;
    name: string;
    description?: string;
    use_official_context: boolean;
    viewport: { x: number; y: number; zoom: number };
    created_at?: string;
    updated_at?: string;
}

export interface BrandFlowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: string;
    nodes_count: number;
    estimated_time: string;
    tags: string[];
    icon_name?: string;
    initial_nodes: Partial<BrandNode>[];
    initial_edges: Partial<BrandRelationship>[];
    initial_groups?: Partial<BrandGroup>[];
}

export interface BrandCompleteness {
    overall: number;
    strategy: number;
    verbal_identity: number;
    visual_identity: number;
    sensorial_identity: number;
    behavioural_identity: number;
    activation: number;
    governance: number;
}
