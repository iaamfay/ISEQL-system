// src/core/compiler/index.ts

import { GraphData } from '../types/graph-model';
import { CompilationResult } from '../types/validation';
import { validateGraph } from '../validator/graph-validator';
import { buildAST } from './ast-builder';
import { generateISEQL } from './query-generator';

export function compileToISEQL(
  graphData: GraphData,
  options: {
    pretty?: boolean;
    validate?: boolean;
  } = {}
): CompilationResult {
  const { pretty = false, validate = true } = options;

  try {
    // Step 1: Validate graph
    if (validate) {
      const validation = validateGraph(graphData.nodes, graphData.edges);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed:\n${validation.errors?.join('\n')}`
        };
      }
    }

    // Step 2: Build AST
    const ast = buildAST(graphData);

    // Step 3: Generate ISEQL string
    const query = generateISEQL(ast, pretty);

    return {
      success: true,
      query,
      ast
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Convenience exports
export { validateGraph } from '../validator/graph-validator';
export { buildAST } from './ast-builder';
export { generateISEQL } from './query-generator';
export * from '../types/graph-model';
export * from '../types/iseql-ast';
export * from '../types/validation';