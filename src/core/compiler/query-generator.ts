// src/core/compiler/query-generator.ts

import { ISEQLNode, OperatorParams } from '../types/iseql-ast';

export function generateISEQL(ast: ISEQLNode, pretty: boolean = false): string {
  const indent = pretty ? 0 : undefined;
  return generateNode(ast, indent);
}

function generateNode(node: ISEQLNode, indent?: number): string {
  const indentStr = indent !== undefined ? '  '.repeat(indent) : '';
  const newline = indent !== undefined ? '\n' : '';

  switch (node.type) {
    case 'PREDICATE':
      return `σ[pred=${node.predicate}${formatArguments(node.arguments)}](${node.relation})`;

    case 'OPERATOR': {
      const left = generateNode(node.left, indent !== undefined ? indent + 1 : undefined);
      const right = generateNode(node.right, indent !== undefined ? indent + 1 : undefined);
      const params = formatParams(node.params);
      
      if (indent !== undefined) {
        return `${indentStr}(${newline}${left} ${newline}${indentStr}${node.operator}${params} ${newline}${right}${newline}${indentStr})`;
      }
      
      return `(${left} ${node.operator}${params} ${right})`;
    }

    case 'PROJECT': {
      const source = generateNode(node.source, indent !== undefined ? indent + 1 : undefined);
      return `π[${node.fields.join(',')}](${source})`;
    }

    case 'SELECT': {
      const source = generateNode(node.source, indent !== undefined ? indent + 1 : undefined);
      return `σ[${node.condition}](${source})`;
    }

    case 'DIFFERENCE': {
      const left = generateNode(node.left, indent !== undefined ? indent + 1 : undefined);
      const right = generateNode(node.right, indent !== undefined ? indent + 1 : undefined);
      return `(${left} - ${right})`;
    }

    default:
      throw new Error(`Unknown AST node type: ${(node as any).type}`);
  }
}

function formatArguments(args?: Record<string, any>): string {
  if (!args || Object.keys(args).length === 0) {
    return '';
  }
  
  const pairs = Object.entries(args).map(([key, value]) => {
    if (typeof value === 'string') {
      return `${key}="${value}"`;
    }
    return `${key}=${value}`;
  });
  
  return `, ${pairs.join(', ')}`;
}

function formatParams(params: OperatorParams): string {
  const parts: string[] = [];

  // Always use Greek letters for parameters (matches papers)
  if (params.delta !== undefined && params.delta !== Infinity) {
    parts.push(`δ:${params.delta}`);
  }

  if (params.epsilon !== undefined && params.epsilon !== Infinity) {
    parts.push(`ε:${params.epsilon}`);
  }

  if (params.rho !== undefined) {
    parts.push(`ρ:${params.rho}`);
  }

  // Advanced constraints
  if (params.cardinality) {
    const { left, right } = params.cardinality;
    
    if (left) {
      const leftCard = formatCardinality(left);
      if (leftCard) parts.push(`leftCard:${leftCard}`);
    }
    
    if (right) {
      const rightCard = formatCardinality(right);
      if (rightCard) parts.push(`rightCard:${rightCard}`);
    }
  }

  if (params.overlapPercentage !== undefined) {
    parts.push(`overlap:${params.overlapPercentage}%`);
  }

  return parts.length > 0 ? `(${parts.join(', ')})` : '';
}

function formatCardinality(card: { min?: number; max?: number }): string {
  if (card.min !== undefined && card.max !== undefined) {
    return `[${card.min},${card.max}]`;
  }
  if (card.min !== undefined) {
    return `≥${card.min}`;
  }
  if (card.max !== undefined) {
    return `≤${card.max}`;
  }
  return '';
}