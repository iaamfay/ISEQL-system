// src/core/compiler/ast-builder.ts

import { EventNode, ConstraintEdge, GraphData } from '../types/graph-model';
import { ISEQLNode, PredicateNode, OperatorNode } from '../types/iseql-ast';
import { mapConstraintToOperator } from './operator-mapper';

export function buildAST(graphData: GraphData): ISEQLNode {
  const { nodes, edges } = graphData;

  // Find root node (node with no incoming edges)
  const root = findRootNode(nodes, edges);
  
  if (!root) {
    throw new Error('No root node found. Graph must have exactly one node with no incoming edges.');
  }

  // Build tree from root
  const visited = new Set<string>();
  return buildSubtree(root.id, nodes, edges, visited, 1);
}

function findRootNode(
  nodes: EventNode[], 
  edges: ConstraintEdge[]
): EventNode | null {
  const nodesWithIncoming = new Set(edges.map(e => e.target));
  const roots = nodes.filter(n => !nodesWithIncoming.has(n.id));
  
  if (roots.length === 0) {
    throw new Error('No root node found (all nodes have incoming edges - possible cycle)');
  }
  
  if (roots.length > 1) {
    throw new Error(`Multiple root nodes found: ${roots.map(n => n.label || n.id).join(', ')}`);
  }
  
  return roots[0];
}

function buildSubtree(
  nodeId: string,
  nodes: EventNode[],
  edges: ConstraintEdge[],
  visited: Set<string>,
  relationCounter: number
): ISEQLNode {
  // Cycle detection
  if (visited.has(nodeId)) {
    throw new Error(`Cycle detected at node ${nodeId}`);
  }
  visited.add(nodeId);

  const node = nodes.find(n => n.id === nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  // Find outgoing edges from this node
  const outgoingEdges = edges.filter(e => e.source === nodeId);

  // Base case: Leaf node (predicate with no children)
  if (outgoingEdges.length === 0) {
    if (node.type !== 'predicate') {
      throw new Error(`Node ${nodeId} has no children but is not a predicate`);
    }

    return {
      type: 'PREDICATE',
      predicate: node.predicate!,
      arguments: node.arguments,
      relation: `M${relationCounter}`
    } as PredicateNode;
  }

  // Single child: Create operator node
  if (outgoingEdges.length === 1) {
    const edge = outgoingEdges[0];
    const { operator, params } = mapConstraintToOperator(edge.constraint);

    // Build left subtree (current node as predicate)
    const leftNode: ISEQLNode = node.type === 'predicate' 
      ? {
          type: 'PREDICATE',
          predicate: node.predicate!,
          arguments: node.arguments,
          relation: `M${relationCounter}`
        } as PredicateNode
      : buildSubtree(nodeId, nodes, edges, new Set(visited), relationCounter);

    // Build right subtree
    const rightNode = buildSubtree(
      edge.target, 
      nodes, 
      edges, 
      new Set(visited), 
      relationCounter + 1
    );

    return {
      type: 'OPERATOR',
      operator,
      params,
      left: leftNode,
      right: rightNode
    } as OperatorNode;
  }

  // Multiple children: Chain operators left-to-right
  // E.g., A → B → C becomes (A OP1 B) OP2 C
  let result: ISEQLNode = node.type === 'predicate'
    ? {
        type: 'PREDICATE',
        predicate: node.predicate!,
        arguments: node.arguments,
        relation: `M${relationCounter}`
      } as PredicateNode
    : buildSubtree(nodeId, nodes, edges, new Set(visited), relationCounter);

  let currentRelationCounter = relationCounter + 1;

  for (const edge of outgoingEdges) {
    const { operator, params } = mapConstraintToOperator(edge.constraint);
    
    const rightNode = buildSubtree(
      edge.target,
      nodes,
      edges,
      new Set(visited),
      currentRelationCounter
    );

    result = {
      type: 'OPERATOR',
      operator,
      params,
      left: result,
      right: rightNode
    } as OperatorNode;

    currentRelationCounter++;
  }

  return result;
}