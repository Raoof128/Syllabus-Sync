# Console Logs Guide & Troubleshooting

> **G'day Raouf!** 🇦🇺
> This guide breaks down common console logs that might look scary but are often harmless or easy to fix.

---

## 1. The "Download React DevTools" Message

- **Log:** `Download the React DevTools for a better development experience`
- **What it is:** A friendly suggestion from the React library.
- **The Fix:**
  - It’s not a bug.
  - If you want it to go away (and actually see your component tree), install the [React DevTools](https://react.dev/link/react-devtools) extension in Chrome/Edge.
  - **Note:** We have suppressed this message in `client-layout.tsx` to keep the console clean.

## 2. `[HMR] connected`

- **Log:** `[HMR] connected`
- **What it is:** **Hot Module Replacement**.
- **The Fix:**
  - This is actually a good thing! It means your development server (like Vite or Webpack) is successfully synced with your browser.
  - When you save a file, the page will update instantly without a full refresh. ⚡

## 3. The `rokt-icons.woff` Preload Warning

- **Log:** `The resource https://apps.rokt.com/icons/rokt-icons.woff was preloaded using link preload but not used...`
- **What it is:** A performance warning.
  - Your `index.html` (or an extension) told the browser, "Hey, I’m going to need this font file ASAP, download it now!"
  - But then, the browser waited a few seconds and realized the font wasn't actually used to style anything on the screen yet.
- **The Fix:**
  - This usually happens if you have a `<link rel="preload">` tag but:
    - The CSS that uses the font hasn't loaded yet.
    - The font is only used on a different page/component.
    - You forgot the `as="font"` or `type="font/woff2"` attributes.
- **How to fix (if it's in your code):**
  Check your `index.html` or header config. If you see a line for that Rokt icon font, make sure it looks like this:

  ```html
  <link
    rel="preload"
    href="https://apps.rokt.com/icons/rokt-icons.woff"
    as="font"
    type="font/woff"
    crossorigin
  />
  ```

  > **Security Caveat:** Since you're loading a resource from a third-party domain (`rokt.com`), ensure your **Content Security Policy (CSP)** headers allow `font-src` from that origin to avoid getting blocked in production. 🛡️
