import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  // Polyfill global for packages like @iarna/toml
  window.global = window;

  // Polyfill Buffer for packages like gray-matter
  window.Buffer = Buffer;
}
