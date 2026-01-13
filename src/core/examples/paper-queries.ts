// src/core/examples/paper-queries.ts

import { GraphData } from '../types/graph-model';

/**
 * BDPE (Basic Direct Package Exchange)
 * From paper Section 5:
 * Person 1 has package, then person 2 has same package (direct handoff)
 */
export const BDPE_Query: GraphData = {
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
        delta: 0  // Immediate handoff
      }
    }
  ]
};

/**
 * Expected output:
 * σ[pred=hasPkg, person="p1", package="pkg1"](M1) Bef(δ:0) σ[pred=hasPkg, person="p2", package="pkg1"](M2)
 */

/**
 * DPE2 (Direct Package Exchange Scenario 2)
 * From paper Section 5:
 * Two persons exchange package, first person enters scene first
 */
export const DPE2_Query: GraphData = {
  nodes: [
    {
      id: 'n1',
      type: 'predicate',
      predicate: 'in',
      arguments: { person: 'p1' },
      position: { x: 100, y: 100 },
      label: 'P1 enters'
    },
    {
      id: 'n2',
      type: 'predicate',
      predicate: 'hasPkg',
      arguments: { person: 'p1', package: 'pkg1' },
      position: { x: 300, y: 100 },
      label: 'P1 has package'
    },
    {
      id: 'n3',
      type: 'predicate',
      predicate: 'hasPkg',
      arguments: { person: 'p2', package: 'pkg1' },
      position: { x: 500, y: 100 },
      label: 'P2 has package'
    },
    {
      id: 'n4',
      type: 'predicate',
      predicate: 'in',
      arguments: { person: 'p2' },
      position: { x: 300, y: 300 },
      label: 'P2 enters'
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'n1',
      target: 'n2',
      constraint: {
        type: 'START_PRECEDING',
        delta: 50  // P1 enters at most 50 frames before having package
      }
    },
    {
      id: 'e2',
      source: 'n2',
      target: 'n3',
      constraint: {
        type: 'BEFORE',
        delta: 0  // Immediate handoff
      }
    },
    {
      id: 'e3',
      source: 'n4',
      target: 'n3',
      constraint: {
        type: 'START_PRECEDING',
        delta: 50  // P2 enters at most 50 frames before receiving package
      }
    }
  ]
};

/**
 * Unattended Package (UP)
 * From paper Section 5:
 * Package left unattended (set difference)
 */
export const UP_Query: GraphData = {
  nodes: [
    {
      id: 'n1',
      type: 'predicate',
      predicate: 'hasPkg',
      arguments: { person: 'p1', package: 'pkg1' },
      position: { x: 100, y: 100 },
      label: 'Person has package'
    },
    {
      id: 'n2',
      type: 'predicate',
      predicate: 'in',
      arguments: { person: 'p1' },
      position: { x: 300, y: 100 },
      label: 'Person leaves (NOT)'
      }
    ],
edges: [
{
id: 'e1',
source: 'n1',
target: 'n2',
constraint: {
type: 'BEFORE',
delta: Infinity  // Person eventually leaves
}
}
]
};