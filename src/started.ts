import * as vscode from 'vscode';
import { findNodeAtLine, parseDocument } from './parser';
import { formatTimestamp } from './timestamp';

const STARTED_TAG_RE = /\s*@started\([^)]*\)/i;
const HAS_STARTED_RE = /@started\([^)]*\)/i;

/**
 * Toggles an `@started(<timestamp>)` tag on the cursor's item line. Items
 * carrying this tag (and still open) are rendered in orange to flag them as
 * in progress. Pressing it again on an already-started item removes the tag.
 */
export async function markStartedCommand(editor: vscode.TextEditor): Promise<void> {
  const lines = editor.document.getText().split(/\r?\n/);
  const roots = parseDocument(lines);
  const cursorLine = editor.selection.active.line;
  const node = findNodeAtLine(roots, cursorLine);

  if (!node) {
    vscode.window.showInformationMessage('TODO: place the cursor on an item line to mark it started.');
    return;
  }

  const line = lines[node.lineIndex];
  const newLine = HAS_STARTED_RE.test(line)
    ? line.replace(STARTED_TAG_RE, '')
    : `${line.replace(/\s+$/, '')} @started(${formatTimestamp(new Date())})`;

  const edit = new vscode.WorkspaceEdit();
  edit.replace(editor.document.uri, editor.document.lineAt(node.lineIndex).range, newLine);
  await vscode.workspace.applyEdit(edit);
}
