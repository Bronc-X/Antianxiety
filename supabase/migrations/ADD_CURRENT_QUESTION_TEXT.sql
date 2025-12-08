-- 添加 current_question_text 字段到 assessment_sessions 表
-- 用于保存当前问题文本，确保 AI 能看到完整的问答历史

ALTER TABLE assessment_sessions 
ADD COLUMN IF NOT EXISTS current_question_text TEXT;

-- 添加注释
COMMENT ON COLUMN assessment_sessions.current_question_text IS '当前问题文本，用于下次回答时记录到历史';
