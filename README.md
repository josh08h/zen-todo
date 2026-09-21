# vscode-todo

A very small, personal replacement for the TODO+ extension. It only does
a few things:

1. Recognises any file literally named `TODO` (no extension) as a `todo`
   language, with basic colour coding:
   - Section headers (e.g. `TODO:`, `Archive:`) are highlighted as headings.
   - `[ ]` open checkboxes get a distinct "keyword" colour.
   - `[x]` completed items (box, text, and any `@done(...)` tag) are
     rendered struck-through.
   - `@tag(...)` annotations (e.g. `@started(...)`, `@done(...)`) get a
     distinct colour.
   - Plain note/bullet lines (`  - some detail`) are rendered like comments.
   - An open item tagged `@started(...)` is rendered in orange (the
     "string" colour) to flag it as in progress.
   - Exact colours depend on your current colour theme, since the grammar
     just maps onto standard TextMate scopes (`markup.heading`,
     `keyword.control`, `markup.strikethrough`, `constant.other.tag`,
     `comment.line`, `string.unquoted`).
2. **Option+D** (`alt+d`) toggles the `[ ]`/`[x]` checkbox on the current
   line:
   - Cascades the new state to every nested sub-item under it.
   - Rolls the new state up to every ancestor: a parent becomes checked only
     when *all* of its direct children are checked, and un-checks again as
     soon as any child is unchecked.
   - Checking an item stamps it with `@done(YY-MM-DD HH:mm)` (matching the
     existing `@started(...)` convention); unchecking removes that stamp.
3. **Option+S** (`alt+s`) toggles an `@started(YY-MM-DD HH:mm)` tag on the
   cursor's item, to mark it as in progress (turns it orange — see above).
   Pressing it again on an already-started item removes the tag.
4. **Command Palette → "TODO: Archive Completed"** moves every top-level
   item that is fully checked (itself and all descendants) into an
   `Archive:` section at the end of the file. Items that are only partially
   done — even if some of their children are finished — are left exactly
   where they are.

Nesting is arbitrary-depth and purely indentation-based; no fixed section
name is assumed. Plain (non-checkbox) lines, such as notes or bullet points
under an item, travel with that item when it's toggled/cascaded or archived.

## Format

```
TODO:
  [ ] PTs
    [ ] Review PTs raised by the team
    [ ] Follow up on any outstanding PTs
  [ ] Ask Talkdesk if SMS delivery status can be sent to us via webhooks
```

## Develop / run

```sh
npm install
npm run compile   # or: npm run watch
```

Press **F5** in VS Code (with this folder open) to launch an Extension
Development Host with the extension loaded, then open a file named `TODO`.

## Install locally (without the Marketplace)

Either:

- Symlink this folder into your extensions directory:
  ```sh
  ln -s ~/ai/vscode-todo ~/.vscode/extensions/vscode-todo
  ```
  (run `npm run compile` first, and re-run it after any change), or
- Package and install a `.vsix`:
  ```sh
  npx @vscode/vsce package
  code --install-extension vscode-todo-0.0.1.vsix
  ```

## Deliberately out of scope

No settings or automated test suite — kept intentionally minimal.

## Publishing / sharing with others

Two options, from simplest to most "official":

### 1. Share a `.vsix` via GitHub (no publisher account needed)

```sh
npm install
npm run compile
npx @vscode/vsce package
```

Push this repo to GitHub, then attach the generated `vscode-todo-<version>.vsix`
to a [GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github).
Others install it with:

```sh
code --install-extension vscode-todo-<version>.vsix
```

Before doing this:
- Add a real `"repository"` field to `package.json` once the GitHub URL
  exists (`{"type": "git", "url": "https://github.com/<you>/vscode-todo.git"}`)
  — `vsce package` currently only warns about its absence, it isn't fatal.
- `LICENSE` (MIT) is already included.

### 2. Publish to the official VS Code Marketplace

Extra steps beyond option 1:

1. Create an Azure DevOps organisation and a
   [Personal Access Token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token)
   with **Marketplace (Manage)** scope.
2. Register a publisher: `npx @vscode/vsce create-publisher <publisher-id>`
   (or via https://marketplace.visualstudio.com/manage), then set that id as
   `"publisher"` in `package.json` (currently the placeholder `"local"`).
3. Add an `"icon"` field pointing at a 128×128 PNG for the Marketplace
   listing (optional but recommended).
4. Log in and publish:
   ```sh
   npx @vscode/vsce login <publisher-id>
   npx @vscode/vsce publish
   ```
5. From then on, bump versions with `vsce publish patch|minor|major`.

Both routes work from the same `package.json`/build — option 2 just adds
publisher registration and a couple of metadata fields on top of option 1.

