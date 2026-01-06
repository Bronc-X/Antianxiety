# Antianxiety白皮书

你好，感谢你愿意花时间读这份白皮书。下面是一个开发者视角的、尽量不绕弯的说明。  
体验提示：目前最佳体验在 PC；手机请用浏览器访问 [https://antianxiety.app](https://antianxiety.app)（可直接点击）。  
<u><em>App 还在开发中，我在从头学，脑容量有限，需要点时间，但春节前肯定会上线。</em></u>  
## 1. 白皮书主要介绍了什么
这份白皮书讲三件事：<u><em>这个 Agent 到底干什么、它是怎么做的、你该怎么用。</em></u>  
不是产品宣言，也不是营销剧本。它更像一个独立开发者的「搭建说明书」，带一点吐槽和一点诚实。

## 2. 省流不看长文版
- 它是一个针对焦虑、压力、睡眠的健康 Agent，不是情绪陪聊机器人。  
- 核心是：输入你的数据 → 找证据 → 生成可执行建议 → 跟踪调整。  
- 它不神秘：推荐逻辑是可解释的，计划逻辑是可回放的。  
- 你能影响它：你的反馈会改变下一次输出。  
- 我还要做一个共建区，让用户直接提需求，甚至自己写技能把想法上线。
- 独特性：只做健康干预闭环，不做泛用聊天；允许暴露公式与证据，不靠“相信我”。  
- 大厂不敢/不能/不屑做：  
  - 不敢：健康建议有责任边界，风险不可控；  
  - 不能：需要真实数据与长期闭环，无法用“短期增长”驱动；  
  - 不屑：不够性感、ROI 慢、做了也难讲故事。  
- <strong>真正解决的问题：</strong>  
  - <strong>对“睡眠崩、压力高、焦虑反复”的人提供可执行的微计划；</strong>  
  - <strong>对“看了一堆知识但做不到”的人提供动作级建议与替代选项；</strong>  
  - <strong>对“需要证据、讨厌鸡汤”的人提供可验证的科学依据。</strong>

## 3. 核心业务逻辑
我做的不是「什么都能聊」的机器人，而是「只对健康问题负责」的系统。  
整体链路很朴素：

1) 数据输入：问卷、日记、睡眠/压力记录、可穿戴数据、聊天内容。  
2) 证据检索：从学术与可靠内容源里找相关研究。  
3) 个性化推荐：对证据打分 + 对用户状态打分，筛出可执行建议。  
4) 计划生成：把建议变成可执行计划（时间、频率、步骤、预期感受）。  
5) 反馈闭环：你做/不做、好/不好，会影响下一次推荐和计划。

一句话：系统不是在讲大道理，是在做可执行的迭代。

## 4. Agent、推荐逻辑、业务逻辑、Max 逻辑
### 4.1 Agent 是什么
Agent 不是人格外壳，而是一个「执行链」。它有记忆、有工具、能把结果保存下来。  
它做的不是“回答”，而是“推进”。

### 4.2 推荐逻辑
推荐不是凭感觉。核心逻辑是三件事：
- 相关性：和你的问题/状态是否匹配  
- 证据强度：论文质量、共识程度、来源可信  
- 可执行性：你当下能否做到、有没有替代方案  

### 4.3 业务逻辑
我的业务逻辑很简单：让你少痛苦、多执行、少折腾。  
所有输出要能落地，不然就是在堆废话。

### 4.4 Max 逻辑
Max 是一个“理性但不冷”的执行助手：  
- 它会给出理由，但不会把你淹死在术语里。  
- 它不会夸你“好棒哦”，它会告诉你“这样做更有效”。  
这不是缺德，是省时间。

### 4.5 Max 的科学框架（四域解释）
Max 的解释不是“胡扯一段”，而是四域结构：  
生理学（physiology）→ 神经学（neurology）→ 心理学（psychology）→ 行为学（behavioral science）。  
这四域会同时给出“为什么有效”和“为什么你现在做得起”的解释。

### 4.6 科学抓取与证据排序（公式版）
科学检索采用多源并行：PubMed、Semantic Scholar、OpenAlex（扩源）与结构化内容库。  
排序采用加权公式（不改结构，只做来源降权）：  

```
CompositeScore = 0.4 * Authority + 0.3 * Recency + 0.3 * SourceQuality

Authority = log10(citationCount + 1) / log10(maxCitations + 1)
Recency   = clamp(1 - (currentYear - year) / 20, 0, 1)
SourceQuality: PubMed 1.0 / Semantic Scholar 0.8 / OpenAlex 0.8 / Healthline 0.7
```

OpenAlex 作为扩源默认降权：  
```
SourceQuality_openalex = SourceQuality * 0.9
```

### 4.7 贝叶斯推断（焦虑概率收缩）
Max 的信念更新采用贝叶斯公式，核心是把主观恐惧压回可解释区间：  

```
Posterior = (Prior * Likelihood) / Evidence
```

- Prior：用户主观估计的风险  
- Likelihood：生理信号（HRV RMSSD、LF/HF）对应的焦虑概率  
- Evidence：论文与证据的权重（引用数、相关性与来源质量）

### 4.8 A/B 实验（OpenAlex 扩源评测）
指标定义：  
- 覆盖率：每 query 的去重后论文数  
- 去重率：1 - unique / total  
- 相关性评分：query 关键词在标题/摘要的命中率  
- 新鲜度：基于年份的衰减评分  

| Pipeline | Avg 覆盖率/Query | 去重率 | Avg 相关性评分 | Avg 年龄(年) | Avg 新鲜度评分 | 全量 Unique |
| --- | --- | --- | --- | --- | --- | --- |
| 现有（PubMed + Semantic Scholar） | 19.40 | 3.00% | 67.4 | 7.79 | 66.2 | 191 |
| OpenAlex（扩源） | 10.00 | 0.00% | 77.0 | 14.54 | 36.6 | 99 |
| 现有 + OpenAlex | 27.40 | 8.67% | 68.9 | 10.01 | 56.4 | 270 |

说明：未来所有 A/B 实验结果统一用表格呈现，并保留查询批次与指标口径。  
说明：Semantic Scholar 存在 429 限流，现有链路指标偏保守。

## 5. 用户应该怎么使用
第一步：先让它“认识你”。  
至少完成基本资料、每日记录、一个简短问卷。  

第二步：提具体问题。  
比如“我最近总是睡不着”，比“我有点不好”更有效。  

第三步：把建议当成实验。  
你执行后回来反馈“好/不好/没时间”，系统才能更新模型。  

第四步：坚持最小行动。  
我不指望你一次就改变人生，只希望你能坚持一个最小动作。  

如果你愿意把它当一个“有边界的教练”，它会回报得很清楚。

## 6. 公开共建（即将上线）
我打算开放一个共建区域：  
- <strong>你可以直接提需求和问题</strong>  
- <strong>我会把高频需求变成可用功能</strong>  
- <strong>甚至允许内测用户直接“接入技能”，把想法在线落地</strong>  

<strong>最终目标是：用户不仅能提意见，还能让系统亲手执行自己的想法。</strong>  
<strong>开源不等于放飞，我会保留基本边界（隐私、安全、医学合规）。</strong>  
<strong>但这是一条值得走的路——人少，反而更敢做事。</strong>

## 7. 白皮书 UI 与导航入口（严肃版）
为了放在主页导航栏，我会把这份白皮书做成“严肃且可读”的 UI：  
- 首页入口：导航栏按钮「Agent 白皮书」  
- 版式结构：标题页 + 摘要框 + 指标表格 + 公式块 + 章节目录  
- 视觉基调：黑白灰为主，少量强调色用于图表与公式  
- 阅读体验：固定宽度正文（60-75 字符行宽），脚注式引用  

## 8. 时间轴（计划）
| 日期 | 里程碑 |
| --- | --- |
| 1 月（整月） | 内测 + 共建；有机会成为共建创始团队成员 |
| 1.6 | 网页版上线 |
| 1.20 | 进阶课程「迷走神经」上线 |
| 2.1 | 共建创始团队招募规则发布；启动第一轮公共共建计划（任务 + 奖励） |
| 2.5 | iOS 上线 |
| 2.10 | Max API 接入 Gemini + GPT-5.2（计划） |
| 2.15 | 90% 穿戴设备接入（目标） |

## 9. 引用文献（完整）
1. Spitzer RL, Kroenke K, Williams JBW, Löwe B. (2006). *A Brief Measure for Assessing Generalized Anxiety Disorder: The GAD-7*. Archives of Internal Medicine, 166(10), 1092-1097. DOI: 10.1001/archinte.166.10.1092. PMID: 16717171.  
2. Kroenke K, Spitzer RL, Williams JB. (2001). *The PHQ-9: validity of a brief depression severity measure*. Journal of General Internal Medicine, 16(9), 606-613. DOI: 10.1046/j.1525-1497.2001.016009606.x. PMID: 11556941.  
3. Bastien CH, Vallières A, Morin CM. (2001). *Validation of the Insomnia Severity Index as an outcome measure for insomnia research*. Sleep Medicine, 2(4), 297-307. DOI: 10.1016/s1389-9457(00)00065-4. PMID: 11438246.  
4. Cohen S, Kamarck T, Mermelstein R. (1983). *A global measure of perceived stress*. Journal of Health and Social Behavior, 24(4), 385-396. DOI: 10.2307/2136404. PMID: 6668417.  
5. Yan YX, Liu YQ, Li M, Hu PF, Guo AM, Yang XH, Qiu JJ, Yang SS, Shen J, Zhang LP, Wang W. (2009). *Development and evaluation of a questionnaire for measuring suboptimal health status in urban Chinese*. Journal of Epidemiology, 19(6), 333-341. DOI: 10.2188/jea.JE20080086. PMID: 19749497.  
6. Chalder T, Berelowitz G, Pawlikowska T, Watts L, Wessely S, Wright D, Wallace EP. (1993). *Development of a fatigue scale*. Journal of Psychosomatic Research, 37(2), 147-153. DOI: 10.1016/0022-3999(93)90081-p. PMID: 8463991.  

 
