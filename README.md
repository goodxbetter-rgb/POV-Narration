# UI Enhancements

A small SillyTavern extension that adds a Quick Insert Toolbar above the message input.

## Buttons

- `""` wraps selected text in quotation marks. With no selection, inserts `""` and places the caret between them.
- `**` wraps selected text in Markdown bold markers. With no selection, inserts `****` and places the caret between the markers.
- `(OOC:)` wraps selected text as `(OOC: selected text)`. With no selection, inserts `(OOC: )` and places the caret after the colon and space.

When text is selected, the wrapped text remains selected for convenient editing.

## Install

1. Extract this folder into your SillyTavern user extensions directory:
   `data/<your-user-folder>/extensions/ui-enhancements/`
2. Make sure `manifest.json`, `index.js`, and `style.css` are directly inside `ui-enhancements`.
3. Restart or refresh SillyTavern.
4. Enable **UI Enhancements** under Extensions if it is not enabled automatically.

## Notes

- This extension only edits the current message input. It does not send messages.
- It dispatches normal `input` and `change` events so the chat input can update its state.
- The toolbar targets SillyTavern's `#send_textarea` input.
