// src/core/types/validation.ts

import { ISEQLNode } from './iseql-ast';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface CompilationResult {
  success: boolean;
  query?: string;
  ast?: ISEQLNode;
  error?: string;
}