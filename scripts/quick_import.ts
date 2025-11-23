/**
 * 快速导入核心知识库
 * 直接插入15条最重要的知识条目
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const knowledge = [
  // 病理机制
  {
    content: '线粒体功能障碍\n\n机制：线粒体效率下降，ATP生成减少，氧化应激（ROS）增加\n\n相关症状：易疲劳、耐力下降、恢复慢',
    content_en: 'Mitochondrial Dysfunction',
    category: 'mechanisms',
    subcategory: '病理机制',
    tags: ['疲劳', '累', '乏力', '线粒体', '能量', 'ATP'],
    priority: 10,
    metadata: { references: ['Błaszczyk 2020'] }
  },
  {
    content: '代谢重编程\n\n机制：从氧化磷酸化转向糖酵解\n\n相关症状：对碳水渴望增加、餐后困倦、能量不稳定',
    content_en: 'Metabolic Reprogramming',
    category: 'mechanisms',
    subcategory: '病理机制',
    tags: ['困', '犯困', '碳水', '糖', '代谢'],
    priority: 10,
    metadata: { RER_shift: '0.75→0.85' }
  },
  {
    content: 'IL-17/TNF炎症通路\n\n机制：慢性炎症激活\n\n相关症状：腹部脂肪堆积、关节痛、睡眠质量差',
    content_en: 'IL-17/TNF Inflammation',
    category: 'mechanisms',
    subcategory: '病理机制',
    tags: ['炎症', '脂肪', '肥胖', '肚子', '腹部'],
    priority: 10,
    metadata: { pathway: 'IL-17/TNF' }
  },
  // 干预策略
  {
    content: 'Zone 2有氧运动\n\n方案：每日30分钟低心率跑或快走（60-70%最大心率）\n\n效果：8-12周内基础代谢率提升5-10%',
    content_en: 'Zone 2 Aerobic Exercise',
    category: 'interventions',
    subcategory: '运动干预',
    tags: ['运动', '跑步', '走路', '有氧', 'Zone 2'],
    priority: 8,
    metadata: { frequency: 'Daily', intensity: '60-70% max HR' }
  },
  {
    content: '抗阻训练\n\n方案：每周3次自重深蹲或俯卧撑（3组×8-12次）\n\n效果：保持肌肉量，提升基础代谢',
    content_en: 'Resistance Training',
    category: 'interventions',
    subcategory: '运动干预',
    tags: ['肌肉', '深蹲', '俯卧撑', '抗阻', '训练'],
    priority: 8,
    metadata: { sets_reps: '3×8-12', frequency: '3/week' }
  },
  {
    content: '16:8间歇性禁食\n\n方案：进食窗口8小时（如12pm-8pm）\n\n效果：改善胰岛素敏感性20-30%',
    content_en: '16:8 Intermittent Fasting',
    category: 'interventions',
    subcategory: '饮食干预',
    tags: ['禁食', '饮食', '16:8', '间歇', '胰岛素'],
    priority: 8,
    metadata: { eating_window: '8 hours' }
  },
  {
    content: 'Omega-3和多酚\n\n方案：深海鱼或绿茶/咖啡\n\n剂量：Omega-3 1-2g/天\n\n效果：降低炎症标志物20-30%',
    content_en: 'Omega-3 and Polyphenols',
    category: 'interventions',
    subcategory: '营养补充',
    tags: ['Omega-3', '鱼油', '绿茶', '咖啡', '多酚', '抗氧化'],
    priority: 8,
    metadata: { dosage: '1-2g EPA+DHA daily' }
  },
  {
    content: '优质蛋白质（亮氨酸）\n\n方案：早餐20-30g蛋白（鸡蛋/瘦肉）\n\n机制：激活mTOR，启动肌肉蛋白合成',
    content_en: 'High-Quality Protein',
    category: 'interventions',
    subcategory: '营养补充',
    tags: ['蛋白质', '鸡蛋', '肉', '亮氨酸', '肌肉'],
    priority: 8,
    metadata: { dosage: '20-30g protein' }
  },
  {
    content: '睡眠优化\n\n方案：7-9小时睡眠，固定作息，避免蓝光\n\n效果：恢复生长激素分泌，优化代谢修复',
    content_en: 'Sleep Optimization',
    category: 'interventions',
    subcategory: '生活方式',
    tags: ['睡眠', '失眠', '作息', '昼夜节律'],
    priority: 7,
    metadata: { duration: '7-9 hours' }
  },
  // 研究
  {
    content: 'Shen et al. 2024 - 能量消耗衰老指数\n\n关键发现：首个基于能量消耗的衰老指数，RER从0.75升至0.85',
    content_en: 'Energy Expenditure Aging Index',
    category: 'research',
    subcategory: 'Chinese Medicine',
    tags: ['研究', '能量', 'EEAI'],
    priority: 5,
    metadata: { doi: '10.1186/s13020-024-00927-9', year: 2024 }
  },
  {
    content: 'Arora et al. 2024 - AI抗衰分子预测\n\n关键发现：AI预测姜黄素、亚精胺等抗衰老分子',
    content_en: 'AgeXtend AI',
    category: 'research',
    subcategory: 'Nature Aging',
    tags: ['研究', 'AI', '姜黄素'],
    priority: 5,
    metadata: { doi: '10.1038/s43587-024-00763-4', year: 2024 }
  },
  {
    content: 'Chen & Wu 2024 - 肌少症\n\n关键发现：30岁后每年肌肉流失1-2%，抗阻训练+蛋白质最有效',
    content_en: 'Sarcopenia Research',
    category: 'research',
    subcategory: 'Aging and Disease',
    tags: ['研究', '肌少症', '肌肉'],
    priority: 5,
    metadata: { doi: '10.14336/AD.2024.0407', year: 2024 }
  },
  {
    content: 'Cabo et al. 2024 - 运动逆转代谢衰退\n\n关键发现：Zone 2有氧运动8-12周可提升BMR 5-10%',
    content_en: 'Exercise Reverses Decline',
    category: 'research',
    subcategory: 'Springer',
    tags: ['研究', '运动', 'Zone 2'],
    priority: 5,
    metadata: { doi: '10.1007/s10389-024-02327-7', year: 2024 }
  },
  {
    content: 'Błaszczyk 2020 - 线粒体衰退\n\n关键发现：线粒体功能下降是衰老的标志，ATP生成减少',
    content_en: 'Mitochondrial Decline',
    category: 'research',
    subcategory: 'Biomolecules',
    tags: ['研究', '线粒体', 'ATP'],
    priority: 5,
    metadata: { doi: '10.3390/biom10111508', year: 2020 }
  },
  {
    content: 'Zeng et al. 2024 - 血细胞代谢时钟\n\n关键发现：尿苷水平反映衰老程度，代谢时钟预测生物学年龄',
    content_en: 'Metabolic Clock',
    category: 'research',
    subcategory: 'Nature Aging',
    tags: ['研究', '代谢', '时钟'],
    priority: 5,
    metadata: { doi: '10.1038/s43587-024-00669-1', year: 2024 }
  }
];

async function main() {
  console.log('🚀 Quick knowledge import starting...\n');
  
  let success = 0;
  let failed = 0;
  
  for (const entry of knowledge) {
    try {
      const { error } = await supabase
        .from('metabolic_knowledge_base')
        .insert(entry);
      
      if (error) {
        console.error(`❌ Failed: ${entry.content_en}`, error.message);
        failed++;
      } else {
        console.log(`✅ Inserted: ${entry.content_en}`);
        success++;
      }
      
      // 避免频率限制
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`❌ Error: ${entry.content_en}`, e);
      failed++;
    }
  }
  
  console.log(`\n✅ Import complete!`);
  console.log(`   Success: ${success}`);
  console.log(`   Failed: ${failed}`);
  console.log(`\n🎉 Knowledge base ready for RAG!`);
}

main().catch(console.error);
