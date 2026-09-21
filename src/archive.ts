import * as vscode from 'vscode';
import { isSubtreeChecked, parseDocument } from './parser';

/**
 * Moves every top-level item (and its whole subtree) that is fully checked
 * into an "Archive:" section at the end of the file. Items with any
 * unchecked descendant are left completely untouched, even if some of their
 * children are individually done.
 */
export async function archiveCompletedCommand(editor: vscode.TextEditor): Promise<void> {
  const document = editor.document;
  const lines = document.getText().split(/\r?\n/);
  const roots = parseDocument(lines);

  const toArchive = roots.filter(isSubtreeChecked).sort((a, b) => a.lineIndex - b.lineIndex);

  if (toArchive.length === 0) {
    vscode.window.showInformationMessage('TODO: no fully completed top-level items to archive.');
    return;
  }

  const archiveBlocks = toArchive.map((node) => lines.slice(node.lineIndex, node.endLine + 1));

  const removedLineIndexes = new Set<number>();
  for (const node of toArchive) {
    for (let i = node.lineIndex; i <= node.endLine; i++) {
      removedLineIndexes.add(i);
    }
  }

  const remainingLines = lines.filter((_, i) => !removedLineIndexes.has(i));

  // Re-use an existing "Archive:" section at the end of the file if present,
  // rather than creating a second one.
  const archiveHeaderIndex = remainingLines.findIndex((line) => /^Archive:\s*$/.test(line));
  const head = archiveHeaderIndex === -1 ? remainingLines : remainingLines.slice(0, archiveHeaderIndex);
  const existingArchiveLines = archiveHeaderIndex === -1 ? [] : remainingLines.slice(archiveHeaderIndex + 1);

  while (head.length && head[head.length - 1].trim() === '') {
    head.pop();
  }

  const newArchiveBody = [...existingArchiveLines, ...archiveBlocks.flat()];
  while (newArchiveBody.length && newArchiveBody[newArchiveBody.length - 1].trim() === '') {
    newArchiveBody.pop();
  }

  const finalLines = [...head, '', 'Archive:', ...newArchiveBody];
  const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

  const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, fullRange, finalLines.join(eol));
  await vscode.workspace.applyEdit(edit);

  vscode.window.showInformationMessage(`TODO: archived ${toArchive.length} completed item(s).`);
}
