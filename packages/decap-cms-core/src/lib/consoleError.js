export default function consoleError(title, description) {
  console.error(
    `%c ⛔ ${title}\n` + `%c${description}\n\n`,
    'color: black; font-weight: bold; font-size: 16px; line-height: 50px;',
    'color: black;',
  );
}
