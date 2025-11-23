/**
 * 知识库向量化脚本
 * 将 /data/metabolic_aging_research_database.json 转换为向量并存入Supabase
 * 
 * 运行方式：
 * npx ts-node scripts/embed_knowledge_base.ts
 * 或
 * npm run embed-knowledge
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 加载环境变量
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// ==================== 配置 ====================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_BASE_URL = process.env.OPENAI_API_BASE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase credentials');
}
if (!OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ 
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

// ==================== 类型定义 ====================

interface KnowledgeEntry {
  content: string;
  content_en: string;
  category: string;
  subcategory?: string;
  tags: string[];
  metadata: Record<string, any>;
  priority: number;
}

interface MetabolicDatabase {
  core_pathology_mechanisms: Record<string, any>;
  intervention_strategies: Record<string, any>;
  breakthrough_research: Record<string, any>;
  app_implementation_recommendations: Record<string, any>;
}

// ==================== 辅助函数 ====================

/**
 * 生成文本的向量嵌入
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // 尝试中转站可能支持的embedding模型
    // 按优先级尝试：v3 > ada-002 > v2
    const possibleModels = [
      'text-embedding-3-large',
      'text-embedding-3-small', 
      'text-embedding-ada-002',
      'embedding-2'
    ];
    
    const model = possibleModels[1]; // 先试text-embedding-3-small
    
    console.log(`尝试使用模型: ${model}`);
    const response = await openai.embeddings.create({
      model: model,
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * 批量生成嵌入（避免API频率限制）
 */
async function generateEmbeddingsBatch(texts: string[], batchSize = 10): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Generating embeddings for batch ${i / batchSize + 1}/${Math.ceil(texts.length / batchSize)}...`);
    
    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );
    embeddings.push(...batchEmbeddings);
    
    // 延迟以避免rate limit
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return embeddings;
}

/**
 * 插入知识条目到数据库
 */
async function insertKnowledgeEntry(
  content: string,
  content_en: string,
  category: string,
  subcategory: string | undefined,
  tags: string[],
  metadata: Record<string, any>,
  priority: number,
  embedding: number[]
): Promise<boolean> {
  try {
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
        embedding: JSON.stringify(embedding),
      });
    
    if (error) {
      console.error('Error inserting entry:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in insertKnowledgeEntry:', error);
    return false;
  }
}

// ==================== 知识库转换逻辑 ====================

/**
 * 将机制数据转换为知识条目
 */
function extractMechanisms(database: MetabolicDatabase): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];
  const mechanisms = database.core_pathology_mechanisms;
  
  for (const [key, mech] of Object.entries(mechanisms)) {
    // 主条目：机制描述
    entries.push({
      content: `${mech.name_zh}：${mech.mechanism.zh}`,
      content_en: `${mech.name_en}: ${mech.mechanism.en}`,
      category: 'mechanism',
      subcategory: key,
      tags: [key, 'mechanism', ...mech.user_symptoms.zh.map((s: string) => s.replace(/[、，]/g, '_'))],
      metadata: {
        symptoms_zh: mech.user_symptoms.zh,
        symptoms_en: mech.user_symptoms.en,
        biomarkers: mech.biomarkers || [],
        references: mech.references || []
      },
      priority: 5
    });
    
    // 症状条目
    mech.user_symptoms.zh.forEach((symptom: string, index: number) => {
      entries.push({
        content: `${symptom}可能与${mech.name_zh}有关。${mech.mechanism.zh}`,
        content_en: `${mech.user_symptoms.en[index]} may be related to ${mech.name_en}. ${mech.mechanism.en}`,
        category: 'symptom',
        subcategory: key,
        tags: [symptom.replace(/[、，]/g, '_'), key],
        metadata: {
          mechanism: mech.name_zh,
          mechanism_en: mech.name_en
        },
        priority: 4
      });
    });
  }
  
  return entries;
}

/**
 * 将干预策略转换为知识条目
 */
function extractInterventions(database: MetabolicDatabase): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];
  const interventions = database.intervention_strategies;
  
  for (const [key, intervention] of Object.entries(interventions)) {
    // 主干预条目
    const habitRec = intervention.app_habit_recommendation;
    const outcomes = intervention.expected_outcomes || intervention.metabolic_benefits || {};
    
    entries.push({
      content: `${intervention.problem_zh}的解决方案：${intervention.scientific_intervention.zh}。建议：${habitRec.zh}。${Object.values(outcomes).join('；')}`,
      content_en: `Solution for ${intervention.problem_en}: ${intervention.scientific_intervention.en}. Recommendation: ${habitRec.en}. ${Object.values(outcomes).join('; ')}`,
      category: 'intervention',
      subcategory: key,
      tags: [key, 'intervention', intervention.scientific_intervention.zh.replace(/\s+/g, '_')],
      metadata: {
        problem: intervention.problem_zh,
        intervention: intervention.scientific_intervention.zh,
        habit: habitRec,
        outcomes: outcomes,
        references: intervention.references || []
      },
      priority: 5
    });
    
    // 详细建议条目
    if (habitRec.intensity || habitRec.frequency || habitRec.dosage) {
      const details: string[] = [];
      if (habitRec.intensity) details.push(`强度：${habitRec.intensity}`);
      if (habitRec.frequency) details.push(`频率：${habitRec.frequency}`);
      if (habitRec.dosage || habitRec.dosage_zh) details.push(`剂量：${habitRec.dosage_zh || habitRec.dosage}`);
      
      if (details.length > 0) {
        entries.push({
          content: `关于${intervention.problem_zh}的详细建议：${details.join('；')}`,
          content_en: `Detailed recommendations for ${intervention.problem_en}: ${details.join('; ')}`,
          category: 'intervention',
          subcategory: `${key}_details`,
          tags: [key, 'details'],
          metadata: {
            problem: intervention.problem_zh,
            details: habitRec
          },
          priority: 3
        });
      }
    }
  }
  
  return entries;
}

/**
 * 将前沿研究转换为知识条目
 */
function extractResearch(database: MetabolicDatabase): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];
  const research = database.breakthrough_research;
  
  for (const [key, study] of Object.entries(research)) {
    // 研究概述
    entries.push({
      content: `${study.title}（${study.authors}, ${study.year}）：${study.key_innovation}`,
      content_en: `${study.title} (${study.authors}, ${study.year}): ${study.key_innovation}`,
      category: 'research',
      subcategory: key,
      tags: [key, 'research', study.journal || 'study'],
      metadata: {
        title: study.title,
        authors: study.authors,
        year: study.year,
        journal: study.journal,
        doi: study.doi,
        key_innovation: study.key_innovation
      },
      priority: 3
    });
    
    // AgeXtend抗衰分子
    if (key === 'AgeXtend_AI_antiaging' && study.identified_molecules) {
      study.identified_molecules.forEach((molecule: any) => {
        entries.push({
          content: `${molecule.name_zh}（${molecule.name}）：${molecule.mechanism_zh}。食物来源：${molecule.food_sources_zh?.join('、') || molecule.food_sources.join(', ')}`,
          content_en: `${molecule.name} (${molecule.name_zh}): ${molecule.mechanism}. Food sources: ${molecule.food_sources.join(', ')}`,
          category: 'food',
          subcategory: 'anti_aging',
          tags: ['anti_aging', molecule.name.toLowerCase(), 'supplement'],
          metadata: {
            molecule: molecule.name,
            mechanism: molecule.mechanism,
            food_sources: molecule.food_sources,
            research: `${study.authors} ${study.year}`
          },
          priority: 4
        });
      });
    }
    
    // 血细胞代谢时钟
    if (key === 'blood_metabolic_clock' && study.key_metabolites) {
      study.key_metabolites.forEach((metabolite: any) => {
        entries.push({
          content: `${metabolite.name_zh}（${metabolite.name}）：${metabolite.role}。食物来源：${metabolite.food_sources_zh?.join('、') || metabolite.food_sources.join(', ')}`,
          content_en: `${metabolite.name} (${metabolite.name_zh}): ${metabolite.role}. Food sources: ${metabolite.food_sources.join(', ')}`,
          category: 'food',
          subcategory: 'metabolic_marker',
          tags: ['metabolic_marker', metabolite.name.toLowerCase()],
          metadata: {
            metabolite: metabolite.name,
            role: metabolite.role,
            food_sources: metabolite.food_sources,
            research: `${study.authors} ${study.year}`
          },
          priority: 3
        });
      });
    }
  }
  
  return entries;
}

// ==================== 主函数 ====================

async function main() {
  console.log('🚀 Starting knowledge base embedding process...\n');
  
  // 1. 读取数据库文件
  const dbPath = path.join(__dirname, '../data/metabolic_aging_research_database.json');
  console.log(`📖 Reading database from: ${dbPath}`);
  
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found: ${dbPath}`);
  }
  
  const rawData = fs.readFileSync(dbPath, 'utf-8');
  const database: MetabolicDatabase = JSON.parse(rawData);
  console.log('✅ Database loaded successfully\n');
  
  // 2. 提取知识条目
  console.log('🔍 Extracting knowledge entries...');
  const mechanismEntries = extractMechanisms(database);
  const interventionEntries = extractInterventions(database);
  const researchEntries = extractResearch(database);
  
  const allEntries = [
    ...mechanismEntries,
    ...interventionEntries,
    ...researchEntries
  ];
  
  console.log(`   - Mechanisms: ${mechanismEntries.length} entries`);
  console.log(`   - Interventions: ${interventionEntries.length} entries`);
  console.log(`   - Research: ${researchEntries.length} entries`);
  console.log(`   - Total: ${allEntries.length} entries\n`);
  
  // 3. 生成向量嵌入
  console.log('🧮 Generating vector embeddings...');
  const texts = allEntries.map(entry => entry.content);
  const embeddings = await generateEmbeddingsBatch(texts, 10);
  console.log(`✅ Generated ${embeddings.length} embeddings\n`);
  
  // 4. 插入数据库
  console.log('💾 Inserting into database...');
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < allEntries.length; i++) {
    const entry = allEntries[i];
    const embedding = embeddings[i];
    
    const success = await insertKnowledgeEntry(
      entry.content,
      entry.content_en,
      entry.category,
      entry.subcategory,
      entry.tags,
      entry.metadata,
      entry.priority,
      embedding
    );
    
    if (success) {
      successCount++;
      if ((i + 1) % 10 === 0) {
        console.log(`   Progress: ${i + 1}/${allEntries.length} entries processed`);
      }
    } else {
      failCount++;
    }
  }
  
  console.log(`\n✅ Embedding complete!`);
  console.log(`   - Success: ${successCount} entries`);
  console.log(`   - Failed: ${failCount} entries`);
  
  // 5. 验证
  console.log('\n🔍 Verifying database...');
  const { count, error } = await supabase
    .from('metabolic_knowledge_base')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Error verifying database:', error);
  } else {
    console.log(`✅ Total entries in database: ${count}`);
  }
  
  console.log('\n🎉 Done! Knowledge base is ready for RAG queries.');
}

// 运行
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
