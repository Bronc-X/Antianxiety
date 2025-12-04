/**
 * 测试关键词提取 (使用 OpenAI 兼容 API - AICanAPI 中转站)
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-WyvlFFo5QAVpDLFTzU7ul6NhVndZTPewwduYb8Teskl8nm5u';
const OPENAI_API_BASE = (process.env.OPENAI_API_BASE || 'https://aicanapi.com/v1').replace(/\/$/, '');
const KEYWORD_MODEL = process.env.AI_MODEL || 'claude-sonnet-4-5-20250929';

async function extractKeywords(query: string): Promise<string[]> {
  console.log(`\n🔑 提取关键词: "${query}"`);
  console.log(`📡 API Base: ${OPENAI_API_BASE}`);
  console.log(`🤖 Model: ${KEYWORD_MODEL}`);
  
  try {
    // 使用 OpenAI 兼容格式
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KEYWORD_MODEL,
        max_tokens: 64,
        messages: [
          { 
            role: 'system', 
            content: `Extract 3-5 academic/medical English keywords from the user's health question for searching PubMed and Semantic Scholar.

Rules:
- Use medical/scientific terminology (e.g., "post-lunch dip" instead of "afternoon sleepy", "circadian rhythm" instead of "body clock")
- Avoid colloquial time expressions like "3pm", "morning", use "afternoon", "circadian" instead
- Focus on physiological terms, symptoms, and mechanisms
- Return a comma-separated list only, no explanations`
          },
          { role: 'user', content: query },
        ],
      }),
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ API Error: ${text}`);
      return [];
    }

    const data = await response.json();
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    
    // OpenAI 格式响应
    const text = data?.choices?.[0]?.message?.content || '';
    console.log(`📝 Raw text: "${text}"`);
    
    const extracted = text
      .split(/[,;\n]/)
      .map((kw: string) => kw.trim())
      .filter(Boolean)
      .map((kw: string) => kw.toLowerCase());
    
    console.log(`✅ Extracted: ${extracted.join(', ')}`);
    return extracted;
    
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    return [];
  }
}

async function main() {
  await extractKeywords('我通常下午三点半会非常困');
  await extractKeywords('How does sleep affect HRV?');
  await extractKeywords('为什么我早上起来总是很累？');
}

main();
