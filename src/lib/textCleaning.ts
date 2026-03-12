/** Strip balanced JSON objects/arrays that some models emit inline as tool data. */
function stripInlineJson(text: string): string {
  let result = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "{" || text[i] === "[") {
      const open = text[i];
      const close = open === "{" ? "}" : "]";
      let depth = 1;
      let j = i + 1;
      while (j < text.length && depth > 0) {
        if (text[j] === open) depth++;
        else if (text[j] === close) depth--;
        j++;
      }
      // Only strip if it looks like JSON (contains a quoted key or is an array)
      const block = text.slice(i, j);
      if (depth === 0 && (/"[^"]*"\s*:/.test(block) || open === "[")) {
        i = j;
        continue;
      }
    }
    result += text[i];
    i++;
  }
  return result;
}

export function cleanDisplayText(text: string): string {
  return stripInlineJson(text)
    .replace(/<emotion\s+value="[^"]*"\s*\/>/g, "")
    .replace(/\[laughter\]/g, "")
    .trim();
}
