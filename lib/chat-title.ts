export const DEFAULT_CONVERSATION_TITLE = '新对话';

const MAX_CJK_LENGTH = 16;
const MAX_LATIN_WORDS = 8;
const MAX_LATIN_CHARS = 60;

export function isDefaultConversationTitle(title?: string | null): boolean {
  if (!title) return true;
  const normalized = title.trim().toLowerCase();
  return normalized === 'new chat' || normalized === DEFAULT_CONVERSATION_TITLE;
}

export function deriveConversationTitle(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return DEFAULT_CONVERSATION_TITLE;

  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() ?? '';
  const firstSentence = firstLine.split(/[。！？!?]/)[0]?.trim() ?? '';
  const cleaned = firstSentence.replace(/\s+/g, ' ').trim();

  if (!cleaned) return DEFAULT_CONVERSATION_TITLE;

  const withoutEmoji = cleaned.replace(/[\u{1F300}-\u{1FAFF}]/gu, '');
  const hasCjk = /[\u4e00-\u9fff]/.test(withoutEmoji);

  if (hasCjk) {
    const compact = withoutEmoji.replace(/\s+/g, '').replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '');
    const title = compact.slice(0, MAX_CJK_LENGTH);
    return title.length >= 2 ? title : DEFAULT_CONVERSATION_TITLE;
  }

  const words = withoutEmoji
    .replace(/[^\w\s'-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const title = words.slice(0, MAX_LATIN_WORDS).join(' ');
  if (!title) return DEFAULT_CONVERSATION_TITLE;
  return title.length > MAX_LATIN_CHARS ? title.slice(0, MAX_LATIN_CHARS).trim() : title;
}
