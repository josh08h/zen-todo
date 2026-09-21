import * as vscode from 'vscode';

/**
 * Short decoration pulses on the editor. VS Code has no keyframe API, so each
 * "frame" is a decoration type swapped in for a few milliseconds. Extra CSS is
 * smuggled through `textDecoration` (VS Code writes that string into a CSS
 * rule), which is how the checkmark can pop/scale.
 */

let playId = 0;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function reducedMotion(): boolean {
  return vscode.workspace.getConfiguration('workbench').get<string>('reduceMotion') === 'on';
}

function afterCss(scale: number, translateY: number, opacity: number): string {
  return `none; display: inline-block; transform: scale(${scale}) translateY(${translateY}px); opacity: ${opacity};`;
}

interface Frame {
  ms: number;
  render: vscode.DecorationRenderOptions;
}

async function playFrames(editor: vscode.TextEditor, ranges: vscode.Range[], frames: Frame[]): Promise<void> {
  const id = ++playId;
  for (const frame of frames) {
    if (id !== playId || editor.document.isClosed) {
      return;
    }
    const type = vscode.window.createTextEditorDecorationType(frame.render);
    try {
      editor.setDecorations(type, ranges);
      await delay(frame.ms);
    } finally {
      type.dispose();
    }
  }
}

function lineRanges(editor: vscode.TextEditor, lineIndexes: number[]): vscode.Range[] {
  return lineIndexes
    .filter((i) => i >= 0 && i < editor.document.lineCount)
    .map((i) => editor.document.lineAt(i).range);
}

/** Small pop on lines that just became `[x]`. */
export async function celebrateDone(editor: vscode.TextEditor, lineIndexes: number[]): Promise<void> {
  if (reducedMotion() || lineIndexes.length === 0) {
    return;
  }
  const ranges = lineRanges(editor, lineIndexes);
  if (ranges.length === 0) {
    return;
  }

  const tick = (scale: number, opacity: number): vscode.ThemableDecorationAttachmentRenderOptions => ({
    contentText: ' ✓',
    color: '#3fb950',
    margin: '0 0 0 8px',
    fontWeight: 'bold',
    textDecoration: afterCss(scale, 0, opacity),
  });

  await playFrames(editor, ranges, [
    {
      ms: 80,
      render: {
        isWholeLine: true,
        after: tick(0.55, 0.45),
        dark: { backgroundColor: 'rgba(63, 185, 80, 0.16)' },
        light: { backgroundColor: 'rgba(26, 127, 55, 0.12)' },
      },
    },
    {
      ms: 140,
      render: {
        isWholeLine: true,
        after: tick(1.35, 1),
        dark: { backgroundColor: 'rgba(63, 185, 80, 0.34)' },
        light: { backgroundColor: 'rgba(26, 127, 55, 0.24)' },
      },
    },
    {
      ms: 180,
      render: {
        isWholeLine: true,
        after: tick(1, 1),
        dark: { backgroundColor: 'rgba(63, 185, 80, 0.14)' },
        light: { backgroundColor: 'rgba(26, 127, 55, 0.10)' },
      },
    },
  ]);
}
