// src/core/compiler/operator-mapper.ts

import { TemporalConstraint } from '../types/graph-model';
import { ISEQLOperator, OperatorParams } from '../types/iseql-ast';

export function mapConstraintToOperator(constraint: TemporalConstraint): {
  operator: ISEQLOperator;
  params: OperatorParams;
} {
  const { type, delta, epsilon, rho, cardinality, overlapPercentage } = constraint;

  // Build params object
  const params: OperatorParams = {};
  
  // Add parameters if defined
  if (delta !== undefined) params.delta = delta;
  if (epsilon !== undefined) params.epsilon = epsilon;
  if (rho !== undefined) params.rho = rho;
  if (cardinality) params.cardinality = cardinality;
  if (overlapPercentage !== undefined) params.overlapPercentage = overlapPercentage;

  // Map constraint type to ISEQL operator
  switch (type) {
    case 'BEFORE':
      return {
        operator: 'Bef',
        params: {
          delta: delta ?? Infinity,
          ...extractAdvancedParams(params)
        }
      };

    case 'AFTER':
      return {
        operator: 'Aft',
        params: {
          delta: delta ?? Infinity,
          ...extractAdvancedParams(params)
        }
      };

    case 'DURING':
      return {
        operator: 'DJ',
        params: {
          delta: delta ?? Infinity,
          epsilon: epsilon ?? Infinity,
          ...extractAdvancedParams(params)
        }
      };

    case 'REVERSE_DURING':
      return {
        operator: 'RDJ',
        params: {
          delta: delta ?? Infinity,
          epsilon: epsilon ?? Infinity,
          ...extractAdvancedParams(params)
        }
      };

    case 'LEFT_OVERLAP':
      return {
        operator: 'LOJ',
        params: {
          delta: delta ?? Infinity,
          epsilon: epsilon ?? Infinity,
          ...extractAdvancedParams(params)
        }
      };

    case 'RIGHT_OVERLAP':
      return {
        operator: 'ROJ',
        params: {
          delta: delta ?? Infinity,
          epsilon: epsilon ?? Infinity,
          ...extractAdvancedParams(params)
        }
      };

    case 'START_PRECEDING':
      return {
        operator: 'SP',
        params: {
          delta: delta ?? Infinity,
          ...extractAdvancedParams(params)
        }
      };

    case 'END_FOLLOWING':
      return {
        operator: 'EF',
        params: {
          epsilon: epsilon ?? Infinity,
          ...extractAdvancedParams(params)
        }
      };

    case 'CONCURRENT':
      return {
        operator: 'DJ',
        params: {
          delta: 0,
          epsilon: 0,
          ...extractAdvancedParams(params)
        }
      };

    default:
      throw new Error(`Unknown constraint type: ${type}`);
  }
}

function extractAdvancedParams(params: OperatorParams): Partial<OperatorParams> {
  const advanced: Partial<OperatorParams> = {};
  
  if (params.rho !== undefined) {
    advanced.rho = params.rho;
  }
  
  if (params.cardinality) {
    advanced.cardinality = params.cardinality;
  }
  
  if (params.overlapPercentage !== undefined) {
    advanced.overlapPercentage = params.overlapPercentage;
  }
  
  return advanced;
}