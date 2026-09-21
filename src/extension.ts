import * as vscode from 'vscode';
import { archiveCompletedCommand } from './archive';
import { markStartedCommand } from './started';
import { toggleCommand } from './toggle';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand('todo.toggle', (editor) => toggleCommand(editor)),
    vscode.commands.registerTextEditorCommand('todo.markStarted', (editor) => markStartedCommand(editor)),
    vscode.commands.registerTextEditorCommand('todo.archiveCompleted', (editor) => archiveCompletedCommand(editor))
  );
}

export function deactivate(): void {}
