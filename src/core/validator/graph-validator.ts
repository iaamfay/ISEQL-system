// src/core/validator/graph-validator.ts

import { EventNode, ConstraintEdge } from '../types/graph-model';
import { ValidationResult } from '../types/validation';

export function validateGraph(
  nodes: EventNode[], 
  edges: ConstraintEdge[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: At least one node
  if (nodes.length === 0) {
    errors.push('Graph must contain at least one event node');
    return { valid: false, errors };
  }

  // Check 2: No cycles
  const cycleCheck = detectCycles(nodes, edges);
  if (cycleCheck.hasCycle) {
    errors.push(`Circular dependency detected: ${cycleCheck.cycle?.join(' → ')}`);
  }

  // Check 3: No orphan nodes (except root)
  const orphans = findOrphanNodes(nodes, edges);
  if (orphans.length > 1) {
    warnings.push(`Multiple disconnected components: ${orphans.map(n => n.label || n.id).join(', ')}`);
  }

  // Check 4: Valid parameters
  for (const edge of edges) {
    const paramErrors = validateParameters(edge);
    if (paramErrors.length > 0) {
      errors.push(...paramErrors);
    }
  }

  // Check 5: Valid predicates
  for (const node of nodes) {
    if (node.type === 'predicate' && !node.predicate) {
      errors.push(`Node ${node.id} is missing predicate name`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

function detectCycles(
  nodes: EventNode[], 
  edges: ConstraintEdge[]
): { hasCycle: boolean; cycle?: string[] } {
  const adjList = buildAdjacencyList(nodes, edges);
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const result = dfsDetectCycle(node.id, adjList, visited, recStack, path);
      if (result.hasCycle) {
        return result;
      }
    }
  }

  return { hasCycle: false };
}

function dfsDetectCycle(
  nodeId: string,
  adjList: Map<string, string[]>,
  visited: Set<string>,
  recStack: Set<string>,
  path: string[]
): { hasCycle: boolean; cycle?: string[] } {
  visited.add(nodeId);
  recStack.add(nodeId);
  path.push(nodeId);

  const neighbors = adjList.get(nodeId) || [];
  
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      const result = dfsDetectCycle(neighbor, adjList, visited, recStack, path);
      if (result.hasCycle) {
        return result;
      }
    } else if (recStack.has(neighbor)) {
      // Found cycle
      const cycleStart = path.indexOf(neighbor);
      return { 
        hasCycle: true, 
        cycle: [...path.slice(cycleStart), neighbor] 
      };
    }
  }

  recStack.delete(nodeId);
  path.pop();
  return { hasCycle: false };
}

function buildAdjacencyList(
  nodes: EventNode[], 
  edges: ConstraintEdge[]
): Map<string, string[]> {
  const adjList = new Map<string, string[]>();
  
  for (const node of nodes) {
    adjList.set(node.id, []);
  }
  
  for (const edge of edges) {
    const neighbors = adjList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjList.set(edge.source, neighbors);
  }
  
  return adjList;
}

function findOrphanNodes(
  nodes: EventNode[], 
  edges: ConstraintEdge[]
): EventNode[] {
  const connectedNodes = new Set<string>();
  
  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }
  
  // Root nodes (no incoming edges) are OK
  const incomingEdges = new Map<string, number>();
  for (const edge of edges) {
    incomingEdges.set(edge.target, (incomingEdges.get(edge.target) || 0) + 1);
  }
  
  const roots = nodes.filter(n => (incomingEdges.get(n.id) || 0) === 0);
  
  // If we have exactly one root and all nodes are connected, we're good
  if (roots.length === 1 && connectedNodes.size === nodes.length) {
    return [];
  }
  
  return nodes.filter(n => !connectedNodes.has(n.id));
}

function validateParameters(edge: ConstraintEdge): string[] {
  const errors: string[] = [];
  const { constraint } = edge;

  if (constraint.delta !== undefined && constraint.delta < 0) {
    errors.push(`Edge ${edge.id}: δ (delta) must be ≥ 0, got ${constraint.delta}`);
  }

  if (constraint.epsilon !== undefined && constraint.epsilon < 0) {
    errors.push(`Edge ${edge.id}: ε (epsilon) must be ≥ 0, got ${constraint.epsilon}`);
  }

  if (constraint.rho !== undefined && constraint.rho < 0) {
    errors.push(`Edge ${edge.id}: ρ (rho) must be ≥ 0, got ${constraint.rho}`);
  }

  if (constraint.overlapPercentage !== undefined) {
    if (constraint.overlapPercentage < 0 || constraint.overlapPercentage > 100) {
      errors.push(`Edge ${edge.id}: overlapPercentage must be between 0-100, got ${constraint.overlapPercentage}`);
    }
  }

  if (constraint.cardinality) {
    const { left, right } = constraint.cardinality;
    
    if (left?.min !== undefined && left.min < 0) {
      errors.push(`Edge ${edge.id}: left cardinality min must be ≥ 0`);
    }
    
    if (left?.max !== undefined && left?.min !== undefined && left.max < left.min) {
      errors.push(`Edge ${edge.id}: left cardinality max must be ≥ min`);
    }
    
    if (right?.min !== undefined && right.min < 0) {
      errors.push(`Edge ${edge.id}: right cardinality min must be ≥ 0`);
    }
    
    if (right?.max !== undefined && right?.min !== undefined && right.max < right.min) {
      errors.push(`Edge ${edge.id}: right cardinality max must be ≥ min`);
    }
  }

  return errors;
}