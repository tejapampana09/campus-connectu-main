const BAD_WORDS = [
  "fuck", "shit", "bitch", "asshole", "idiot", "stupid",
  "bastard", "lanja", "dengey", "puka", "madarchod",
];

function normalize(t: string): string {
  return t.toLowerCase().replace(/[^a-z]/g, "");
}

export function containsBadWord(text: string): boolean {
  const clean = normalize(text);
  return BAD_WORDS.some((w) => clean.includes(w.replace(/[^a-z]/g, "")));
}
