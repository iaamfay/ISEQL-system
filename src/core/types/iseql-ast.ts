// src/core/types/iseql-ast.ts

export type ISEQLNode =
  | PredicateNode
  | OperatorNode
  | ProjectNode
  | SelectNode
  | DifferenceNode;

export interface PredicateNode {
  type: 'PREDICATE';
  predicate: string;
  arguments?: Record<string, any>;
  relation: string;  // e.g., "M1", "M2"
}

export interface OperatorNode {
  type: 'OPERATOR';
  operator: ISEQLOperator;
  params: OperatorParams;
  left: ISEQLNode;
  right: ISEQLNode;
}

export interface ProjectNode {
  type: 'PROJECT';
  fields: string[];
  source: ISEQLNode;
}

export interface SelectNode {
  type: 'SELECT';
  condition: string;
  source: ISEQLNode;
}

export interface DifferenceNode {
  type: 'DIFFERENCE';
  left: ISEQLNode;
  right: ISEQLNode;
}

export type ISEQLOperator = 
  | 'Bef'  // Before
  | 'Aft'  // After
  | 'DJ'   // During Join
  | 'RDJ'  // Reverse During Join
  | 'LOJ'  // Left Overlap Join
  | 'ROJ'  // Right Overlap Join
  | 'SP'   // Start Preceding
  | 'EF';  // End Following

export interface OperatorParams {
  delta?: number;
  epsilon?: number;
  rho?: number;
  cardinality?: {
    left?: { min?: number; max?: number };
    right?: { min?: number; max?: number };
  };
  overlapPercentage?: number;
}