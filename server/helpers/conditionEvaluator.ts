// Condition Evaluator
// Safe expression evaluator for workflow decision nodes
// Date: 2025-10-09

import { ExecutionContext } from '../shared/types/workflow.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'BOOLEAN'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'COMPARATOR'
  | 'LOGICAL'
  | 'LPAREN'
  | 'RPAREN'
  | 'DOT'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string | number | boolean;
  position: number;
}

// ============================================================================
// MAIN EVALUATION FUNCTION
// ============================================================================

/**
 * Evaluate a condition string against an execution context
 * @param condition - Condition expression (e.g., "total_value >= 500")
 * @param context - Execution context with variables
 * @returns boolean result
 */
export function evaluateCondition(condition: string, context: ExecutionContext): boolean {
  try {
    // Tokenize the condition
    const tokens = tokenize(condition);

    // Parse into AST
    const ast = parse(tokens);

    // Evaluate the AST
    const result = evaluate(ast, context);

    // Ensure boolean result
    return Boolean(result);
  } catch (error) {
    console.error(`Condition evaluation error: ${(error as Error).message}`);
    throw new Error(`Failed to evaluate condition "${condition}": ${(error as Error).message}`);
  }
}

// ============================================================================
// TOKENIZER (LEXER)
// ============================================================================

/**
 * Tokenize condition string into tokens
 */
function tokenize(condition: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;

  while (position < condition.length) {
    const char = condition[position];

    // Skip whitespace
    if (/\s/.test(char)) {
      position++;
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let value = '';
      while (position < condition.length && /[\d.]/.test(condition[position])) {
        value += condition[position];
        position++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(value), position });
      continue;
    }

    // Strings (single or double quotes)
    if (char === '"' || char === "'") {
      const quote = char;
      let value = '';
      position++; // Skip opening quote
      while (position < condition.length && condition[position] !== quote) {
        value += condition[position];
        position++;
      }
      position++; // Skip closing quote
      tokens.push({ type: 'STRING', value, position });
      continue;
    }

    // Identifiers (variable names, keywords)
    if (/[a-zA-Z_]/.test(char)) {
      let value = '';
      while (position < condition.length && /[a-zA-Z0-9_]/.test(condition[position])) {
        value += condition[position];
        position++;
      }

      // Check for boolean literals
      if (value === 'true') {
        tokens.push({ type: 'BOOLEAN', value: true, position });
      } else if (value === 'false') {
        tokens.push({ type: 'BOOLEAN', value: false, position });
      }
      // Check for logical operators
      else if (value === 'AND' || value === 'OR' || value === 'NOT') {
        tokens.push({ type: 'LOGICAL', value: value.toLowerCase(), position });
      }
      // Identifier
      else {
        tokens.push({ type: 'IDENTIFIER', value, position });
      }
      continue;
    }

    // Comparison operators (>=, <=, ==, !=, >, <)
    if (char === '>' || char === '<' || char === '=' || char === '!') {
      let value = char;
      position++;
      if (position < condition.length && condition[position] === '=') {
        value += '=';
        position++;
      }
      tokens.push({ type: 'COMPARATOR', value, position });
      continue;
    }

    // Logical operators (&& and ||)
    if (char === '&' || char === '|') {
      let value = char;
      position++;
      if (position < condition.length && condition[position] === char) {
        value += char;
        position++;
      }
      const logicalOp = value === '&&' ? 'and' : value === '||' ? 'or' : value;
      tokens.push({ type: 'LOGICAL', value: logicalOp, position });
      continue;
    }

    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: char, position });
      position++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: char, position });
      position++;
      position++;
      continue;
    }

    // Dot notation (for object access)
    if (char === '.') {
      tokens.push({ type: 'DOT', value: char, position });
      position++;
      continue;
    }

    // Math operators (+, -, *, /)
    if (['+', '-', '*', '/'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char, position });
      position++;
      continue;
    }

    // Unknown character
    throw new Error(`Unexpected character at position ${position}: ${char}`);
  }

  tokens.push({ type: 'EOF', value: '', position });
  return tokens;
}

// ============================================================================
// PARSER (AST BUILDER)
// ============================================================================

type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'identifier'; name: string }
  | { type: 'property'; object: ASTNode; property: string }
  | { type: 'comparison'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'logical'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'unary'; operator: string; operand: ASTNode }
  | { type: 'binary'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'function'; name: string; args: ASTNode[] };

/**
 * Parse tokens into Abstract Syntax Tree
 */
function parse(tokens: Token[]): ASTNode {
  let current = 0;

  function parseExpression(): ASTNode {
    return parseLogical();
  }

  function parseLogical(): ASTNode {
    let left = parseComparison();

    while (current < tokens.length && tokens[current].type === 'LOGICAL') {
      const operator = tokens[current].value as string;
      current++;
      const right = parseComparison();
      left = { type: 'logical', operator, left, right };
    }

    return left;
  }

  function parseComparison(): ASTNode {
    let left = parseAdditive();

    while (current < tokens.length && tokens[current].type === 'COMPARATOR') {
      const operator = tokens[current].value as string;
      current++;
      const right = parseAdditive();
      left = { type: 'comparison', operator, left, right };
    }

    return left;
  }

  function parseAdditive(): ASTNode {
    let left = parseMultiplicative();

    while (current < tokens.length &&
           tokens[current].type === 'OPERATOR' &&
           ['+', '-'].includes(tokens[current].value as string)) {
      const operator = tokens[current].value as string;
      current++;
      const right = parseMultiplicative();
      left = { type: 'binary', operator, left, right };
    }

    return left;
  }

  function parseMultiplicative(): ASTNode {
    let left = parseUnary();

    while (current < tokens.length &&
           tokens[current].type === 'OPERATOR' &&
           ['*', '/'].includes(tokens[current].value as string)) {
      const operator = tokens[current].value as string;
      current++;
      const right = parseUnary();
      left = { type: 'binary', operator, left, right };
    }

    return left;
  }

  function parseUnary(): ASTNode {
    if (current < tokens.length && tokens[current].type === 'LOGICAL' && tokens[current].value === 'not') {
      current++;
      const operand = parseUnary();
      return { type: 'unary', operator: 'not', operand };
    }

    return parsePrimary();
  }

  function parsePrimary(): ASTNode {
    const token = tokens[current];

    // Numbers
    if (token.type === 'NUMBER') {
      current++;
      return { type: 'number', value: token.value as number };
    }

    // Strings
    if (token.type === 'STRING') {
      current++;
      return { type: 'string', value: token.value as string };
    }

    // Booleans
    if (token.type === 'BOOLEAN') {
      current++;
      return { type: 'boolean', value: token.value as boolean };
    }

    // Identifiers (variables or functions)
    if (token.type === 'IDENTIFIER') {
      const name = token.value as string;
      current++;

      // Function call
      if (current < tokens.length && tokens[current].type === 'LPAREN') {
        current++; // Skip (
        const args: ASTNode[] = [];

        // Parse arguments
        while (current < tokens.length && tokens[current].type !== 'RPAREN') {
          args.push(parseExpression());

          // Skip commas (not tokenized, but we should handle them)
          if (current < tokens.length && tokens[current].value === ',') {
            current++;
          }
        }

        current++; // Skip )
        return { type: 'function', name, args };
      }

      // Property access (e.g., user.role)
      let node: ASTNode = { type: 'identifier', name };
      while (current < tokens.length && tokens[current].type === 'DOT') {
        current++; // Skip .
        if (tokens[current].type !== 'IDENTIFIER') {
          throw new Error('Expected property name after dot');
        }
        const property = tokens[current].value as string;
        current++;
        node = { type: 'property', object: node, property };
      }

      return node;
    }

    // Parentheses
    if (token.type === 'LPAREN') {
      current++; // Skip (
      const node = parseExpression();
      current++; // Skip )
      return node;
    }

    throw new Error(`Unexpected token: ${token.type} at position ${token.position}`);
  }

  return parseExpression();
}

// ============================================================================
// EVALUATOR (AST INTERPRETER)
// ============================================================================

/**
 * Evaluate AST node with context
 */
function evaluate(node: ASTNode, context: ExecutionContext): any {
  switch (node.type) {
    case 'number':
    case 'string':
    case 'boolean':
      return node.value;

    case 'identifier':
      return resolveVariable(node.name, context);

    case 'property':
      const obj = evaluate(node.object, context);
      if (obj === null || obj === undefined) {
        return undefined;
      }
      return (obj as any)[node.property];

    case 'comparison':
      return evaluateComparison(node.operator,
                                evaluate(node.left, context),
                                evaluate(node.right, context));

    case 'logical':
      return evaluateLogical(node.operator,
                            evaluate(node.left, context),
                            evaluate(node.right, context));

    case 'unary':
      if (node.operator === 'not') {
        return !evaluate(node.operand, context);
      }
      throw new Error(`Unknown unary operator: ${node.operator}`);

    case 'binary':
      return evaluateBinary(node.operator,
                           evaluate(node.left, context),
                           evaluate(node.right, context));

    case 'function':
      return evaluateFunction(node.name, node.args.map(arg => evaluate(arg, context)), context);

    default:
      throw new Error(`Unknown node type: ${(node as any).type}`);
  }
}

/**
 * Resolve variable from context
 */
function resolveVariable(name: string, context: ExecutionContext): any {
  // Common shortcuts
  const shortcuts: Record<string, any> = {
    total_value: context.requestData?.totalValue,
    category_id: context.requestData?.categoryId,
    category_name: context.requestData?.categoryName,
    site_id: context.requestData?.siteId,
    site_name: context.requestData?.siteName,
    area_id: context.requestData?.areaId,
    area_name: context.requestData?.areaName,
    requestor_id: context.requestData?.requestorId,
    requestor_name: context.requestData?.requestorName,
    user_role: context.user?.role,
    user_id: context.user?.id,
    all_items_in_stock: context.stockData?.allItemsInStock,
    out_of_stock_items: context.stockData?.outOfStockItems
  };

  if (name in shortcuts) {
    return shortcuts[name];
  }

  // Direct context access
  if (name in context) {
    return (context as any)[name];
  }

  // Nested access (e.g., requestData)
  if (context.requestData && name in context.requestData) {
    return (context.requestData as any)[name];
  }

  if (context.user && name in context.user) {
    return (context.user as any)[name];
  }

  if (context.stockData && name in context.stockData) {
    return (context.stockData as any)[name];
  }

  return undefined;
}

/**
 * Evaluate comparison operators
 */
function evaluateComparison(operator: string, left: any, right: any): boolean {
  switch (operator) {
    case '>':
      return left > right;
    case '>=':
      return left >= right;
    case '<':
      return left < right;
    case '<=':
      return left <= right;
    case '==':
    case '===':
      return left === right;
    case '!=':
    case '!==':
      return left !== right;
    default:
      throw new Error(`Unknown comparison operator: ${operator}`);
  }
}

/**
 * Evaluate logical operators
 */
function evaluateLogical(operator: string, left: any, right: any): boolean {
  switch (operator) {
    case 'and':
    case '&&':
      return Boolean(left) && Boolean(right);
    case 'or':
    case '||':
      return Boolean(left) || Boolean(right);
    default:
      throw new Error(`Unknown logical operator: ${operator}`);
  }
}

/**
 * Evaluate binary math operators
 */
function evaluateBinary(operator: string, left: any, right: any): number {
  const l = Number(left);
  const r = Number(right);

  switch (operator) {
    case '+':
      return l + r;
    case '-':
      return l - r;
    case '*':
      return l * r;
    case '/':
      if (r === 0) throw new Error('Division by zero');
      return l / r;
    default:
      throw new Error(`Unknown binary operator: ${operator}`);
  }
}

/**
 * Evaluate custom functions
 */
function evaluateFunction(name: string, args: any[], context: ExecutionContext): any {
  switch (name) {
    case 'hasPermission':
      // Check if user has specific permission
      if (args.length < 1) throw new Error('hasPermission requires at least 1 argument');
      const permission = args[0];
      return context.user?.permissions?.includes(permission) || false;

    case 'isBusinessDay':
      // Check if date is a business day (Mon-Fri)
      const date = args[0] ? new Date(args[0]) : new Date();
      const day = date.getDay();
      return day >= 1 && day <= 5; // Monday = 1, Friday = 5

    case 'contains':
      // Check if array contains value
      if (args.length < 2) throw new Error('contains requires 2 arguments');
      const arr = Array.isArray(args[0]) ? args[0] : [];
      return arr.includes(args[1]);

    case 'length':
      // Get array/string length
      if (args.length < 1) throw new Error('length requires 1 argument');
      return args[0]?.length || 0;

    case 'abs':
      // Absolute value
      if (args.length < 1) throw new Error('abs requires 1 argument');
      return Math.abs(Number(args[0]));

    case 'round':
      // Round number
      if (args.length < 1) throw new Error('round requires 1 argument');
      return Math.round(Number(args[0]));

    case 'min':
      // Minimum of numbers
      return Math.min(...args.map(Number));

    case 'max':
      // Maximum of numbers
      return Math.max(...args.map(Number));

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate condition syntax without evaluating
 */
export function validateCondition(condition: string): { valid: boolean; error?: string } {
  try {
    const tokens = tokenize(condition);
    parse(tokens);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

/**
 * Get list of variables referenced in condition
 */
export function extractVariables(condition: string): string[] {
  try {
    const tokens = tokenize(condition);
    const variables: string[] = [];

    for (const token of tokens) {
      if (token.type === 'IDENTIFIER') {
        variables.push(token.value as string);
      }
    }

    return Array.from(new Set(variables));
  } catch (error) {
    return [];
  }
}
