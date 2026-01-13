// src/core/__tests__/compiler.test.ts

import { describe, test, expect } from '@jest/globals';
import { compileToISEQL } from '../compiler';
import type { GraphData } from '../types/graph-model';

describe('ISEQL Compiler', () => {
  test('BDPE Query compiles correctly', () => {
    const BDPE_Query: GraphData = {
      nodes: [
        {
          id: 'n1',
          type: 'predicate',
          predicate: 'hasPkg',
          arguments: { person: 'p1', package: 'pkg1' },
          position: { x: 100, y: 100 },
          label: 'P1 has package'
        },
        {
          id: 'n2',
          type: 'predicate',
          predicate: 'hasPkg',
          arguments: { person: 'p2', package: 'pkg1' },
          position: { x: 300, y: 100 },
          label: 'P2 has package'
        }
      ],
      edges: [
        {
          id: 'e1',
          source: 'n1',
          target: 'n2',
          constraint: {
            type: 'BEFORE',
            delta: 0
          }
        }
      ]
    };

    const result = compileToISEQL(BDPE_Query);
    
    expect(result.success).toBe(true);
    expect(result.query).toBeDefined();
    expect(result.query).toContain('Bef(δ:0)');
    expect(result.query).toContain('hasPkg');
  });

  test('Invalid graph returns error', () => {
    const invalidGraph: GraphData = {
      nodes: [],
      edges: []
    };
    
    const result = compileToISEQL(invalidGraph);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('Simple two-node graph', () => {
    const simpleGraph: GraphData = {
      nodes: [
        { 
          id: 'n1', 
          type: 'predicate', 
          predicate: 'hasPkg', 
          position: { x: 0, y: 0 } 
        },
        { 
          id: 'n2', 
          type: 'predicate', 
          predicate: 'in', 
          position: { x: 100, y: 0 } 
        }
      ],
      edges: [
        { 
          id: 'e1', 
          source: 'n1', 
          target: 'n2', 
          constraint: { type: 'BEFORE' } 
        }
      ]
    };
    
    const result = compileToISEQL(simpleGraph);
    
    expect(result.success).toBe(true);
    expect(result.query).toContain('Bef');
  });

  test('Parameters are formatted correctly', () => {
    const graphWithParams: GraphData = {
      nodes: [
        { 
          id: 'n1', 
          type: 'predicate', 
          predicate: 'hasPkg', 
          position: { x: 0, y: 0 } 
        },
        { 
          id: 'n2', 
          type: 'predicate', 
          predicate: 'in', 
          position: { x: 100, y: 0 } 
        }
      ],
      edges: [
        { 
          id: 'e1', 
          source: 'n1', 
          target: 'n2', 
          constraint: { 
            type: 'LEFT_OVERLAP',
            delta: 5,
            epsilon: 3,
            rho: 1
          } 
        }
      ]
    };
    
    const result = compileToISEQL(graphWithParams);
    
    expect(result.success).toBe(true);
    expect(result.query).toContain('LOJ');
    expect(result.query).toContain('δ:5');
    expect(result.query).toContain('ε:3');
    expect(result.query).toContain('ρ:1');
  });
});