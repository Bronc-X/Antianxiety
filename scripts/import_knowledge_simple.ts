/**
 * 简化版知识库导入脚本
 * 不需要embedding向量化，直接导入文本内容
 * 使用关键词和标签进行匹配
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// ==================== 配置 ====================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ==================== 类型定义 ====================

interface KnowledgeEntry {
  content: string;
  content_en: string;
  category: string;
  subcategory?: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface DatabaseRecord {
  database_version: string;
  last_updated: string;
  description: string;
  core_pathology_mechanisms: {
    [key: string]: {
      name_zh: string;
      name_en: string;
      mechanism: { zh: string; en: string };
      user_symptoms: { zh: string[]; en: string[] };
      references?: any[];
      biomarkers?: string[];
      metabolic_markers?: any;
    };
  };
  intervention_strategies: {
    [key: string]: {
      name_zh: string;
      name_en: string;
      type?: string;
      mechanism: { zh: string; en: string };
      protocol: { zh: string; en: string };
      user_symptoms?: { zh: string[]; en: string[] };
      references?: any[];
    };
  };
  key_research: {
    [key: string]: {
      title: string;
      authors: string;
      journal: string;
      year: number;
      doi: string;
      key_findings_zh: string[];
      clinical_implications_zh?: string[];
    };
  };
}

// ==================== 辅助函数 ====================

/**
 * 提取关键词用于搜索
 */
function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();
  
  // 中文关键词匹配
  const chinesePatterns = [
    /疲劳|累|乏力/g,
    /脂肪|肥胖|体重/g,
    /睡眠|失眠|困倦/g,
    /压力|焦虑|紧张/g,
    /运动|锻炼|健身/g,
    /饮食|营养|禁食/g,
    /炎症|发炎/g,
    /线粒体|能量|ATP/g,
    /代谢|新陈代谢/g,
    /激素|胰岛素/g,
  ];
  
  chinesePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => keywords.add(match));
    }
  });
  
  return Array.from(keywords);
}

/**
 * 插入单条知识到数据库（不需要embedding）
 */
async function insertKnowledgeEntry(
  content: string,
  content_en: string,
  category: string,
  subcategory: string | null,
  tags: string[],
  metadata: Record<string, any>,
  priority: number
): Promise<boolean> {
  try {
    // 提取搜索关键词
    const keywords = extractKeywords(content);
    
    const { error } = await supabase
      .from('metabolic_knowledge_base')
      .insert({
        content,
        content_en,
        category,
        subcategory,
        tags,
        metadata,
        priority,
        keywords, // 存储关键词用于搜索
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Insert error:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// ==================== 主函数 ====================

async function main() {
  console.log('🚀 Starting simple knowledge base import...\n');

  // 1. 读取知识库JSON
  const dbPath = path.join(__dirname, '..', 'data', 'metabolic_aging_research_database.json');
  console.log(`📖 Reading database from: ${dbPath}`);
  
  const dbContent = fs.readFileSync(dbPath, 'utf-8');
  const database: DatabaseRecord = JSON.parse(dbContent);
  console.log('✅ Database loaded successfully\n');

  // 2. 提取知识条目
  console.log('🔍 Extracting knowledge entries...');
  const entries: KnowledgeEntry[] = [];

  // 提取机制（Mechanisms）
  const mechanisms = database.core_pathology_mechanisms || {};
  Object.entries(mechanisms).forEach(([key, mech]) => {
    const symptoms = mech.user_symptoms?.zh || [];
    entries.push({
      content: `${mech.name_zh}\n\n机制：${mech.mechanism.zh}\n\n相关症状：${symptoms.join('、')}`,
      content_en: mech.name_en,
      category: 'mechanisms',
      subcategory: '病理机制',
      tags: [...symptoms, mech.name_zh],
      metadata: {
        name_zh: mech.name_zh,
        name_en: mech.name_en,
        biomarkers: mech.biomarkers || [],
        references: mech.references || [],
      },
    });
  });

  // 提取干预策略（Interventions）
  const interventions = database.intervention_strategies || {};
  Object.entries(interventions).forEach(([key, intervention]) => {
    const symptoms = intervention.user_symptoms?.zh || [];
    entries.push({
      content: `${intervention.name_zh}\n\n机制：${intervention.mechanism.zh}\n\n方案：${intervention.protocol.zh}`,
      content_en: intervention.name_en,
      category: 'interventions',
      subcategory: intervention.type || '干预策略',
      tags: [...symptoms, intervention.name_zh],
      metadata: {
        name_zh: intervention.name_zh,
        name_en: intervention.name_en,
        protocol: intervention.protocol,
        references: intervention.references || [],
      },
    });
  });

  // 提取研究亮点（Research）
  const research = database.key_research || {};
  Object.entries(research).forEach(([key, study]) => {
    const findings = study.key_findings_zh || [];
    entries.push({
      content: `${study.title}\n\n作者：${study.authors}\n\n期刊：${study.journal} (${study.year})\n\n关键发现：${findings.join('；')}`,
      content_en: study.title,
      category: 'research',
      subcategory: study.journal,
      tags: ['研究', '临床', study.authors],
      metadata: {
        title: study.title,
        doi: study.doi,
        year: study.year,
        key_findings: findings,
      },
    });
  });

  console.log(`   - Mechanisms: ${Object.keys(mechanisms).length} entries`);
  console.log(`   - Interventions: ${Object.keys(interventions).length} entries`);
  console.log(`   - Research: ${Object.keys(research).length} entries`);
  console.log(`   - Total: ${entries.length} entries\n`);

  // 3. 批量插入数据库
  console.log('💾 Inserting into database...');
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const priority = entry.category === 'mechanisms' ? 10 : 
                    entry.category === 'interventions' ? 8 : 5;

    const success = await insertKnowledgeEntry(
      entry.content,
      entry.content_en,
      entry.category,
      entry.subcategory || null,
      entry.tags,
      entry.metadata,
      priority
    );

    if (success) {
      successCount++;
      process.stdout.write(`\r   Progress: ${i + 1}/${entries.length} (✅ ${successCount} | ❌ ${failCount})`);
    } else {
      failCount++;
    }

    // 避免频率限制
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n\n✅ Import complete!');
  console.log(`   - Success: ${successCount} entries`);
  console.log(`   - Failed: ${failCount} entries\n`);

  // 4. 验证数据库
  console.log('🔍 Verifying database...');
  const { count, error } = await supabase
    .from('metabolic_knowledge_base')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Verification error:', error.message);
  } else {
    console.log(`✅ Total entries in database: ${count}\n`);
  }

  console.log('🎉 Done! Knowledge base is ready for keyword-based RAG queries.');
  console.log('💡 Tip: You can upgrade to vector-based search anytime by adding embeddings.\n');
}

// 运行主函数
main().catch(console.error);
