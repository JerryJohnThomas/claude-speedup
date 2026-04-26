# claude-speedup (extension)

Fixes UI lag in long Claude.ai conversations.

## The problem

Claude slows to a crawl after 50+ messages. Typing feels sticky, scrolling judders. This happens because React keeps all ~220 message component wrappers alive in the DOM and reconciles every single one on every keystroke.

## How it works

Detaches old message wrappers from the DOM entirely and replaces them with lightweight placeholder divs. React stops seeing them — no reconciliation, no layout, no paint. Only the last N turns stay fully rendered. Scroll position is preserved via placeholder height.

## Install

1. Download or clone this repo
2. Go to `chrome://extensions` → enable **Developer mode**
3. Click **Load unpacked** → select the `claude-speedup` folder
4. Open Claude, hard refresh (`Ctrl+Shift+R`), done

## Usage

Click the extension icon in your toolbar to toggle it on/off or change how many turns to keep visible (default: 4).

## Caveats

Targets internal Tailwind/React class names that Anthropic could change. If it stops working after a Claude update, open an issue.

This has been vibe coded with Claude,  and original inspiration is ![Light Session](https://chromewebstore.google.com/detail/chatgpt-lightsession/fmomjhjnmgpknbabfpojgifokaibeoje)

Inspired by [LightSession](https://chromewebstore.google.com/detail/chatgpt-lightsession/fmomjhjnmgpknbabfpojgifokaibeoje) for ChatGPT

## License

MIT — built by [Jerry](https://github.com/jerryjohnthomas)

Feel free to publish this to the Chrome Web Store, just keep my name in the credits.