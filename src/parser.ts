/**
 * Pure, VS Code-independent parsing of a TODO document into an indentation
 * tree of checkbox items. Plain (non-checkbox) lines are attached as trailing
 * "note" content of the nearest enclosing item, so they travel with it when
 * toggled or archived.
 */

export interface TodoNode {
  lineIndex: number;
  indent: number;
  checked: boolean;
  children: TodoNode[];
  parent?: TodoNode;
  /** Inclusive index of the last raw line belonging to this node's block
   * (itself, its notes, and all descendants). */
  endLine: number;
}

const CHECKBOX_RE = /^(\s*)\[( |x|X)\](\s.*)?$/;

function indentOf(line: string): number {
  const match = /^(\s*)/.exec(line);
  return match ? match[1].length : 0;
}

function extendEndLine(node: TodoNode, lineIndex: number): void {
  node.endLine = Math.max(node.endLine, lineIndex);
  if (node.parent) {
    extendEndLine(node.parent, lineIndex);
  }
}

export function parseDocument(lines: string[]): TodoNode[] {
  const roots: TodoNode[] = [];
  const stack: TodoNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = indentOf(line);
    const checkboxMatch = CHECKBOX_RE.exec(line);

    if (checkboxMatch) {
      while (stack.length && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const node: TodoNode = {
        lineIndex: i,
        indent,
        checked: checkboxMatch[2].toLowerCase() === 'x',
        children: [],
        endLine: i,
      };

      if (stack.length) {
        const parent = stack[stack.length - 1];
        node.parent = parent;
        parent.children.push(node);
        extendEndLine(parent, i);
      } else {
        roots.push(node);
      }

      stack.push(node);
    } else if (line.trim().length === 0) {
      // Blank line: keep it attached to whatever item is currently open.
      if (stack.length) {
        extendEndLine(stack[stack.length - 1], i);
      }
    } else {
      // Plain note line. A strictly shallower indent means we've dedented
      // out of the current item(s) (e.g. a new section header); pop until
      // we find an enclosing item, or none.
      while (stack.length && indent < stack[stack.length - 1].indent) {
        stack.pop();
      }
      if (stack.length) {
        extendEndLine(stack[stack.length - 1], i);
      }
    }
  }

  return roots;
}

export function findNodeAtLine(roots: TodoNode[], lineIndex: number): TodoNode | undefined {
  for (const node of roots) {
    if (node.lineIndex === lineIndex) {
      return node;
    }
    if (lineIndex > node.lineIndex && lineIndex <= node.endLine) {
      const found = findNodeAtLine(node.children, lineIndex);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

export function collectDescendants(node: TodoNode, acc: TodoNode[] = []): TodoNode[] {
  for (const child of node.children) {
    acc.push(child);
    collectDescendants(child, acc);
  }
  return acc;
}

export function collectAncestors(node: TodoNode): TodoNode[] {
  const acc: TodoNode[] = [];
  let current = node.parent;
  while (current) {
    acc.push(current);
    current = current.parent;
  }
  return acc;
}

export function isSubtreeChecked(node: TodoNode): boolean {
  if (!node.checked) {
    return false;
  }
  return node.children.every(isSubtreeChecked);
}
