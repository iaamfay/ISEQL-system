// src/core/types/graph-model.ts

export interface EventNode {
  id: string;
  type: 'predicate' | 'compound';
  
  // For predicates
  predicate?: string;  // e.g., 'hasPkg', 'insideCar', 'in'
  arguments?: Record<string, any>;  // e.g., { person: "p1", package: "pkg1" }
  
  // For compound events (saved queries)
  compoundQuery?: string;
  
  // Visual properties (for frontend)
  position: { x: number; y: number };
  label?: string;
}

export interface ConstraintEdge {
  id: string;
  source: string;  // Node ID
  target: string;  // Node ID
  
  constraint: TemporalConstraint;
}

export interface TemporalConstraint {
  // Core relationship type
  type: 'BEFORE' | 'AFTER' | 'DURING' | 'REVERSE_DURING' | 
        'LEFT_OVERLAP' | 'RIGHT_OVERLAP' | 
        'START_PRECEDING' | 'END_FOLLOWING' |
        'CONCURRENT';  // Special case: δ=0 and ε=0
  
  // Parameters (match ISEQL operators)
  delta?: number;    // Max gap between left endpoints
  epsilon?: number;  // Max gap between right endpoints
  rho?: number;      // Robustness parameter
  
  // Advanced constraints (from papers)
  cardinality?: {
    left?: { min?: number; max?: number };
    right?: { min?: number; max?: number };
  };
  overlapPercentage?: number;  // 0-100
}

export interface GraphData {
  nodes: EventNode[];
  edges: ConstraintEdge[];
}