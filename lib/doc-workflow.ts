/**
 * Documentation Workflow Utilities
 * 文档工作流工具函数
 */

// ============ Types ============

export type FeatureArea =
  | 'bayesian'
  | 'dashboard'
  | 'ai-assistant'
  | 'onboarding'
  | 'settings'
  | 'analysis'
  | 'other';

export type AssetType =
  | 'screenshot'
  | 'screencast'
  | 'animation'
  | 'description';

export type AssetStatus = 'TODO' | 'DONE';

export interface MarketingAsset {
  id: string;
  date: string;
  featureName: string;
  featureArea: FeatureArea;
  assetType: AssetType;
  status: AssetStatus;
  description: string;
  filePath?: string;
  dueDate?: string;
  isOverdue?: boolean;
}

export interface DiaryEntry {
  date: string;
  title: string;
  coreUpdates: string[];
  codeStats?: {
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
  };
  nextSteps: string[];
  marketingAssets?: string[];
}

export interface StartupChecklist {
  readConstitution: boolean;
  checkRecentDiary: boolean;
  reviewPendingAssets: boolean;
  timestamp?: string;
}

// ============ Constants ============

export const FEATURE_AREAS: FeatureArea[] = [
  'bayesian',
  'dashboard',
  'ai-assistant',
  'onboarding',
  'settings',
  'analysis',
  'other',
];

export const ASSET_TYPES: AssetType[] = [
  'screenshot',
  'screencast',
  'animation',
  'description',
];

export const ASSET_TYPE_EMOJI: Record<AssetType, string> = {
  screenshot: '📷',
  screencast: '🎬',
  animation: '🎞️',
  description: '📝',
};

export const OVERDUE_DAYS = 3;
export const URGENT_OVERDUE_DAYS = 7;

// ============ Validation ============

export function isValidFeatureArea(area: string): area is FeatureArea {
  return FEATURE_AREAS.includes(area as FeatureArea);
}

export function isValidAssetType(type: string): type is AssetType {
  return ASSET_TYPES.includes(type as AssetType);
}

export function isValidAssetStatus(status: string): status is AssetStatus {
  return status === 'TODO' || status === 'DONE';
}

export function validateAssetEntry(asset: Partial<MarketingAsset>): string[] {
  const errors: string[] = [];

  if (!asset.date || !/^\d{4}-\d{2}-\d{2}$/.test(asset.date)) {
    errors.push('Invalid date format (expected YYYY-MM-DD)');
  }
  if (!asset.featureName || asset.featureName.trim() === '') {
    errors.push('Feature name is required');
  }
  if (!asset.featureArea || !isValidFeatureArea(asset.featureArea)) {
    errors.push(`Invalid feature area (expected one of: ${FEATURE_AREAS.join(', ')})`);
  }
  if (!asset.assetType || !isValidAssetType(asset.assetType)) {
    errors.push(`Invalid asset type (expected one of: ${ASSET_TYPES.join(', ')})`);
  }
  if (!asset.status || !isValidAssetStatus(asset.status)) {
    errors.push('Invalid status (expected TODO or DONE)');
  }
  if (!asset.description || asset.description.trim() === '') {
    errors.push('Description is required');
  }

  return errors;
}

// ============ Date Utilities ============

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDueDate(daysFromNow: number = 3): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

export function daysSinceDate(dateStr: string): number {
  const date = new Date(dateStr);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function isOverdue(asset: MarketingAsset): boolean {
  if (asset.status === 'DONE') return false;
  if (asset.dueDate) {
    return new Date(asset.dueDate) < new Date();
  }
  return daysSinceDate(asset.date) > OVERDUE_DAYS;
}

export function isUrgentOverdue(asset: MarketingAsset): boolean {
  if (asset.status === 'DONE') return false;
  return daysSinceDate(asset.date) > URGENT_OVERDUE_DAYS;
}

// ============ Asset Generation ============

export function generateAssetId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateAssetEntry(params: {
  featureName: string;
  featureArea: FeatureArea;
  assetType: AssetType;
  description: string;
  filePath?: string;
}): MarketingAsset {
  const today = getTodayDate();
  return {
    id: generateAssetId(),
    date: today,
    featureName: params.featureName,
    featureArea: params.featureArea,
    assetType: params.assetType,
    status: 'TODO',
    description: params.description,
    filePath: params.filePath || generateSuggestedPath(params),
    dueDate: getDueDate(3),
    isOverdue: false,
  };
}

export function generateSuggestedPath(params: {
  featureName: string;
  featureArea: FeatureArea;
  assetType: AssetType;
}): string {
  const date = getTodayDate();
  const safeName = params.featureName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const extension = params.assetType === 'screencast' ? 'mp4' 
    : params.assetType === 'animation' ? 'gif' 
    : 'png';
  
  return `public/marketing/${params.featureArea}/${safeName}-${date}.${extension}`;
}

// ============ Markdown Generation ============

export function generateAssetMarkdown(asset: MarketingAsset): string {
  const emoji = ASSET_TYPE_EMOJI[asset.assetType];
  const statusEmoji = asset.status === 'DONE' ? '✅' : '🔴';
  
  return `### ${asset.date} ${asset.featureName}
- **类型**: ${emoji} ${asset.assetType}
- **区域**: ${asset.featureArea}
- **描述**: ${asset.description}
- **状态**: ${statusEmoji} ${asset.status}${asset.dueDate ? `\n- **截止**: ${asset.dueDate}` : ''}
- **路径**: \`${asset.filePath || '(待填写)'}\`
`;
}

export function generateDiaryEntryMarkdown(entry: DiaryEntry): string {
  let md = `## ${entry.date} - ${entry.title}\n\n`;
  
  md += `### 🎯 核心更新\n\n`;
  entry.coreUpdates.forEach((update, i) => {
    md += `#### ${i + 1}. ${update}\n`;
  });
  
  if (entry.codeStats) {
    md += `\n### 📊 代码统计\n`;
    md += `- **文件变更**: ${entry.codeStats.filesChanged} 个文件\n`;
    md += `- **新增代码**: ${entry.codeStats.linesAdded} 行\n`;
    md += `- **删除代码**: ${entry.codeStats.linesDeleted} 行\n`;
  }
  
  md += `\n### 🚀 下一步计划\n`;
  entry.nextSteps.forEach(step => {
    md += `- [ ] ${step}\n`;
  });
  
  if (entry.marketingAssets && entry.marketingAssets.length > 0) {
    md += `\n### 📸 营销素材\n`;
    entry.marketingAssets.forEach(asset => {
      md += `- [ ] ${asset}\n`;
    });
  }
  
  return md;
}

// ============ Reminder Generation ============

export function generatePendingAssetsReminder(assets: MarketingAsset[]): string {
  const todoAssets = assets.filter(a => a.status === 'TODO');
  if (todoAssets.length === 0) return '';
  
  const overdueAssets = todoAssets.filter(isOverdue);
  const urgentAssets = todoAssets.filter(isUrgentOverdue);
  
  let reminder = '\n---\n';
  reminder += '## 📸 待收集营销素材提醒\n\n';
  
  if (urgentAssets.length > 0) {
    reminder += '### 🔴 紧急 (超过7天)\n';
    urgentAssets.forEach(a => {
      reminder += `- **${a.featureName}** (${a.assetType}): ${a.description.slice(0, 50)}...\n`;
    });
    reminder += '\n';
  }
  
  if (overdueAssets.length > 0 && overdueAssets.length !== urgentAssets.length) {
    reminder += '### 🟡 逾期 (超过3天)\n';
    overdueAssets.filter(a => !isUrgentOverdue(a)).forEach(a => {
      reminder += `- **${a.featureName}** (${a.assetType}): ${a.description.slice(0, 50)}...\n`;
    });
    reminder += '\n';
  }
  
  const normalTodo = todoAssets.filter(a => !isOverdue(a));
  if (normalTodo.length > 0) {
    reminder += '### 📋 待处理\n';
    normalTodo.forEach(a => {
      reminder += `- **${a.featureName}** (${a.assetType})\n`;
    });
  }
  
  reminder += '\n⚠️ **请在完成功能后及时截图/录屏，避免素材丢失！**\n';
  
  return reminder;
}

export function generateManualCaptureInstructions(asset: MarketingAsset): string {
  return `
⚠️ **请手动截图/录屏: ${asset.featureName}**

1. 打开功能页面
2. ${asset.assetType === 'screencast' ? '开始录屏' : '截图'}
3. 保存到: \`${asset.filePath}\`
4. 更新 MARKETING_ASSETS.md 状态为 DONE

**描述**: ${asset.description}
`;
}

// ============ Checklist ============

export function generateStartupChecklist(): StartupChecklist {
  return {
    readConstitution: false,
    checkRecentDiary: false,
    reviewPendingAssets: false,
    timestamp: new Date().toISOString(),
  };
}

export function isChecklistComplete(checklist: StartupChecklist): boolean {
  return checklist.readConstitution 
    && checklist.checkRecentDiary 
    && checklist.reviewPendingAssets;
}
