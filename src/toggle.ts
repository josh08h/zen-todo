import * as vscode from 'vscode';
import { celebrateDone } from './celebrate';
import { collectAncestors, collectDescendants, findNodeAtLine, parseDocument } from './parser';
import { formatTimestamp } from './timestamp';

const CHECKBOX_CHAR_RE = /\[( |x|X)\]/;
const DONE_TAG_RE = /\s*@done\([^)]*\)\s*$/i;

function getLines(document: vscode.TextDocument): string[] {
  return document.getText().split(/\r?\n/);
}

/** Flips the `[ ]`/`[x]` marker and adds/removes a trailing `@done(...)` tag to match. */
function applyCheckedState(line: string, checked: boolean, timestamp: string): string {
  const withBox = line.replace(CHECKBOX_CHAR_RE, checked ? '[x]' : '[ ]');
  const withoutDone = withBox.replace(DONE_TAG_RE, '');
  return checked ? `${withoutDone} @done(${timestamp})` : withoutDone;
}

/**
 * Toggles the checkbox on the cursor's line, cascading the new state to all
 * descendants, then rolling the state up to every ancestor (an ancestor is
 * checked only when all of its direct children are checked). Checking an
 * item stamps it with `@done(<timestamp>)`; unchecking removes that stamp.
 */
export async function toggleCommand(editor: vscode.TextEditor): Promise<void> {
  const lines = getLines(editor.document);
  const roots = parseDocument(lines);
  const cursorLine = editor.selection.active.line;
  const node = findNodeAtLine(roots, cursorLine);

  if (!node) {
    vscode.window.showInformationMessage('TODO: place the cursor on a "[ ]" checkbox line to toggle it.');
    return;
  }

  const newChecked = !node.checked;
  const affected = new Map<number, boolean>();

  node.checked = newChecked;
  affected.set(node.lineIndex, newChecked);

  for (const descendant of collectDescendants(node)) {
    descendant.checked = newChecked;
    affected.set(descendant.lineIndex, newChecked);
  }

  for (const ancestor of collectAncestors(node)) {
    const allChildrenChecked = ancestor.children.every((child) => child.checked);
    ancestor.checked = allChildrenChecked;
    affected.set(ancestor.lineIndex, allChildrenChecked);
  }

  const timestamp = formatTimestamp(new Date());
  const edit = new vscode.WorkspaceEdit();
  for (const [lineIndex, checked] of affected) {
    const line = lines[lineIndex];
    if (!CHECKBOX_CHAR_RE.test(line)) {
      continue;
    }
    const newLine = applyCheckedState(line, checked, timestamp);
    const range = editor.document.lineAt(lineIndex).range;
    edit.replace(editor.document.uri, range, newLine);
  }

  const applied = await vscode.workspace.applyEdit(edit);
  if (!applied || !newChecked) {
    return;
  }

  const checkedLines = [...affected.entries()]
    .filter(([, checked]) => checked)
    .map(([lineIndex]) => lineIndex);
  await celebrateDone(editor, checkedLines);
}
