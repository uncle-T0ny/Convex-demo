export function extractCompleteSentences(text: string): {
  sentences: string[];
  remainder: string;
} {
  const pattern = /[^.!?]*[.!?]+(?:\s|$)/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    sentences.push(match[0]);
    lastIndex = match.index! + match[0].length;
  }
  return { sentences, remainder: text.slice(lastIndex) };
}
