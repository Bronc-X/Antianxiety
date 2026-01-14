'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ReportStep } from '@/types/assessment';
import { ChevronLeft, Download, Mail, AlertTriangle, Clock, Stethoscope, Home, History, Loader2 } from 'lucide-react';
import { tr, type Language } from '@/lib/i18n';
import { maybeCnToTw } from '@/lib/i18n-core';
import { useAssessmentReport } from '@/hooks/domain/useAssessmentReport';

interface HistoricalAssessment {
  date: string;
  chiefComplaint: string;
  topCondition: string;
}

interface ReportViewProps {
  report: ReportStep['report'];
  sessionId: string;
  onRestart: () => void;
  language: Language;
  historicalContext?: HistoricalAssessment[];
}

const URGENCY_CONFIG = {
  emergency: {
    color: 'bg-destructive',
    textColor: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: AlertTriangle,
    label_zh: '紧急',
    label_en: 'Emergency'
  },
  urgent: {
    color: 'bg-accent',
    textColor: 'text-accent',
    bgColor: 'bg-accent/10',
    icon: Clock,
    label_zh: '尽快就医',
    label_en: 'Urgent'
  },
  routine: {
    color: 'bg-primary',
    textColor: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: Stethoscope,
    label_zh: '建议就医',
    label_en: 'See a doctor'
  },
  self_care: {
    color: 'bg-chart-3',
    textColor: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
    icon: Home,
    label_zh: '自我护理',
    label_en: 'Self-care'
  }
};

export function ReportView({ report, sessionId, onRestart, language, historicalContext }: ReportViewProps) {
  const { exportReport, sendEmail } = useAssessmentReport();
  const urgencyConfig = URGENCY_CONFIG[report.urgency];
  const UrgencyIcon = urgencyConfig.icon;
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const html = await exportReport(sessionId, 'html');
      if (html) {
        // 打开新窗口用于打印
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const ok = await sendEmail(sessionId);
      if (ok) {
        setEmailSent(true);
      }
    } catch (error) {
      console.error('Email failed:', error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 格式化历史日期
  const formatHistoryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (language !== 'en') {
      if (diffDays < 30) return `${diffDays} 天前`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`;
      return `${Math.floor(diffDays / 365)} 年前`;
    } else {
      if (diffDays < 30) return `${diffDays} days ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="sticky top-0 bg-background px-4 py-4 border-b border-border">
        <button 
          onClick={onRestart}
          className="flex items-center text-primary hover:opacity-80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>{tr(language, { zh: '返回', en: 'Back' })}</span>
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 紧急程度标签 */}
        <motion.div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${urgencyConfig.bgColor} ${urgencyConfig.textColor} mb-6`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <UrgencyIcon className="w-4 h-4" />
          <span className="font-medium">
            {language === 'en' ? urgencyConfig.label_en : urgencyConfig.label_zh}
          </span>
        </motion.div>

        {/* 条件列表 */}
        <div className="space-y-4">
          {report.conditions.map((condition, index) => (
            <motion.div
              key={condition.name}
              className={`bg-card rounded-2xl p-6 border-2 ${
                condition.is_best_match ? 'border-primary' : 'border-border'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Best Match 标签 */}
              {condition.is_best_match && (
                <span className="inline-block px-3 py-1 bg-foreground text-background text-xs font-medium rounded-full mb-3">
                  {tr(language, { zh: '最佳匹配', en: 'Best match' })}
                </span>
              )}

              {/* 条件名称 */}
              <h3 className="text-xl font-bold text-card-foreground mb-2">
                {maybeCnToTw(language, condition.name)}
              </h3>

              {/* 描述 */}
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                {maybeCnToTw(language, condition.description)}
              </p>

              {/* 匹配症状 */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">
                  {tr(language, { zh: '匹配的症状', en: 'Your match' })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {condition.matched_symptoms.map(symptom => (
                    <span 
                      key={symptom}
                      className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                    >
                      {maybeCnToTw(language, symptom)}
                    </span>
                  ))}
                </div>
              </div>

              {/* 概率 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${condition.probability}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  />
                </div>
                <span className="text-sm font-medium text-card-foreground">
                  {condition.probability}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 下一步建议 */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h4 className="text-lg font-bold text-foreground mb-4">
            {tr(language, { zh: '下一步', en: 'Next steps' })}
          </h4>
          <div className="space-y-3">
            {report.next_steps.map((step, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
              >
                <span className="text-xl">{step.icon}</span>
                <span className="text-card-foreground">{maybeCnToTw(language, step.action)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 历史上下文 */}
        {historicalContext && historicalContext.length > 0 && (
          <motion.div
            className="mt-8 p-4 bg-secondary/50 rounded-xl border border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {tr(language, { zh: '历史记录', en: 'History' })}
              </span>
            </div>
            <div className="space-y-2">
              {historicalContext.map((item, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  <span className="text-foreground">{formatHistoryDate(item.date)}</span>
                  {' - '}
                  {language === 'en'
                    ? `You reported similar symptoms "${item.chiefComplaint}", diagnosed as ${item.topCondition}`
                    : maybeCnToTw(
                        language,
                        `您曾报告过类似症状「${item.chiefComplaint}」，当时诊断为 ${item.topCondition}`
                      )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 导出选项 */}
        <motion.div
          className="mt-8 flex gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button 
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {tr(language, { zh: '下载 PDF', en: 'Download PDF' })}
          </button>
          <button 
            onClick={handleSendEmail}
            disabled={isSendingEmail || emailSent}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-card border-2 border-primary text-primary rounded-full font-medium hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {isSendingEmail ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mail className="w-5 h-5" />
            )}
            {emailSent 
              ? tr(language, { zh: '已发送', en: 'Sent' })
              : tr(language, { zh: '发送邮件', en: 'Email' })
            }
          </button>
        </motion.div>

        {/* 免责声明 */}
        <motion.p
          className="mt-8 text-xs text-muted-foreground text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {maybeCnToTw(language, report.disclaimer)}
        </motion.p>
      </div>
    </div>
  );
}
