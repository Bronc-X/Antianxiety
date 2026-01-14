'use client';

import { useState, useEffect, useCallback, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// 抽卡效果 Hook - 跟随光标的 3D 倾斜动画
function useCardTilt() {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 50 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 50 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg']);
  
  const sheenX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const sheenY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);
  
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };
  
  const handleMouseLeave = () => { x.set(0); y.set(0); };
  
  return { ref, rotateX, rotateY, sheenX, sheenY, handleMouseMove, handleMouseLeave };
}

// 金句数据 - 品牌核心理念 (17条完整版)
const WISDOM_QUOTES = [
  // 🟢 第一组：为"放弃"正名 (Physiological Justice)
  {
    textSC: "我们并非以'人'的身份在思考，而是以组成我们的'化学物质'的身份在思考。",
    textTC: "我們並非以'人'的身份在思考，而是以組成我們的'化學物質'的身份在思考。",
    textEN: "We do not think as the person we are; we think as the chemicals we are.",
    sourceSC: "罗伯特·萨波斯基 · 斯坦福行为生物学",
    sourceTC: "羅伯特·薩波斯基 · 斯坦福行為生物學",
    sourceEN: "Robert Sapolsky · Stanford Behavioral Biology",
    tagsSC: ["生理免责", "硬核唯物", "去道德化"],
    tagsTC: ["生理免責", "硬核唯物", "去道德化"],
    tagsEN: ["PhysiologicalJustice", "HardcoreMaterialism", "Demoralization"]
  },
  {
    textSC: "我们不会上升到我们预期的水平，我们只会跌落到我们系统（训练）设定的水平。",
    textTC: "我們不會上升到我們預期的水平，我們只會跌落到我們系統（訓練）設定的水平。",
    textEN: "We do not rise to the level of our expectations, we fall to the level of our training.",
    sourceSC: "阿基罗库斯 · 古希腊诗人",
    sourceTC: "阿基羅庫斯 · 古希臘詩人",
    sourceEN: "Archilochus · Ancient Greek Poet",
    tagsSC: ["系统至上", "反意志力", "底线思维"],
    tagsTC: ["系統至上", "反意志力", "底線思維"],
    tagsEN: ["SystemsFirst", "AntiWillpower", "BaselineThinking"]
  },
  
  // 🔵 第二组：解释"动态调整" (Bayesian Logic)
  {
    textSC: "当事实发生改变时，我就会改变我的想法。阁下，您又会怎么做呢？",
    textTC: "當事實發生改變時，我就會改變我的想法。閣下，您又會怎麼做呢？",
    textEN: "When the facts change, I change my mind. What do you do, sir?",
    sourceSC: "约翰·梅纳德·凯恩斯 · 经济学家",
    sourceTC: "約翰·梅納德·凱恩斯 · 經濟學家",
    sourceEN: "John Maynard Keynes · Economist",
    tagsSC: ["贝叶斯更新", "理性撤退", "动态校准"],
    tagsTC: ["貝葉斯更新", "理性撤退", "動態校準"],
    tagsEN: ["BayesianUpdate", "RationalRetreat", "DynamicCalibration"]
  },
  {
    textSC: "大自然没有直线。直线只存在于人类的贪婪之中。",
    textTC: "大自然沒有直線。直線只存在於人類的貪婪之中。",
    textEN: "Nature has no straight lines. Straight lines belong only to human greed.",
    sourceSC: "威廉·肯特 · 景观建筑哲学",
    sourceTC: "威廉·肯特 · 景觀建築哲學",
    sourceEN: "William Kent · Landscape Architecture Philosophy",
    tagsSC: ["非线性", "生物节律", "反打卡主义"],
    tagsTC: ["非線性", "生物節律", "反打卡主義"],
    tagsEN: ["NonLinear", "BioRhythm", "AntiStreakism"]
  },
  
  // ⚪ 第三组：定义"高级的自律" (Entropy & Compounding)
  {
    textSC: "复利的第一条原则：永远不要在非必要的时候打断它。",
    textTC: "複利的第一條原則：永遠不要在非必要的時候打斷它。",
    textEN: "The first rule of compounding: Never interrupt it unnecessarily.",
    sourceSC: "查理·芒格 · 穷查理宝典",
    sourceTC: "查理·芒格 · 窮查理寶典",
    sourceEN: "Charlie Munger · Poor Charlie's Almanack",
    tagsSC: ["复利效应", "枯燥力量", "拒绝高潮"],
    tagsTC: ["複利效應", "枯燥力量", "拒絕高潮"],
    tagsEN: ["CompoundingEffect", "PowerOfBoring", "RejectTheHighs"]
  },
  {
    textSC: "生命以负熵为食。新陈代谢的本质，在于有机体成功地将自身从活着时不可避免产生的熵中解脱出来。",
    textTC: "生命以負熵為食。新陳代謝的本質，在於有機體成功地將自身從活著時不可避免產生的熵中解脫出來。",
    textEN: "Life feeds on negative entropy. The essential thing in metabolism is that the organism succeeds in freeing itself from all the entropy it cannot help producing while alive.",
    sourceSC: "埃尔温·薛定谔 · 生命是什么 (1944)",
    sourceTC: "埃爾溫·薛定諤 · 生命是什麼 (1944)",
    sourceEN: "Erwin Schrödinger · What Is Life? (1944)",
    tagsSC: ["负熵汲取", "热力学", "生命本质"],
    tagsTC: ["負熵汲取", "熱力學", "生命本質"],
    tagsEN: ["NegativeEntropy", "Thermodynamics", "EssenceOfLife"]
  },
  
  // ⚫ 第四组：最终的哲学 (New Perspective)
  {
    textSC: "真正的发现之旅，不在于寻找新的大陆，而在于拥有新的眼睛。",
    textTC: "真正的發現之旅，不在於尋找新的大陸，而在於擁有新的眼睛。",
    textEN: "The real voyage of discovery consists not in seeking new landscapes, but in having new eyes.",
    sourceSC: "马塞尔·普鲁斯特 · 追忆似水年华",
    sourceTC: "馬塞爾·普魯斯特 · 追憶似水年華",
    sourceEN: "Marcel Proust · In Search of Lost Time",
    tagsSC: ["认知重构", "内观", "觉醒"],
    tagsTC: ["認知重構", "內觀", "覺醒"],
    tagsEN: ["CognitiveReframing", "Introspection", "Awakening"]
  },
  
  // 🟣 第五组：对抗焦虑的幻觉 (Stoicism & Reality)
  {
    textSC: "我们在想象中受到的折磨，远比在现实中受到的多。",
    textTC: "我們在想像中受到的折磨，遠比在現實中受到的多。",
    textEN: "We suffer more often in imagination than in reality.",
    sourceSC: "塞内卡 · 致卢西利乌斯道德书简",
    sourceTC: "塞內卡 · 致盧西利烏斯道德書簡",
    sourceEN: "Seneca · Moral Letters to Lucilius",
    tagsSC: ["反精神内耗", "斯多葛", "直面现实"],
    tagsTC: ["反精神內耗", "斯多葛", "直面現實"],
    tagsEN: ["AntiOverthinking", "Stoicism", "RealityCheck"]
  },
  {
    textSC: "有些事情由我们控制，有些则不然。由我们控制的是观点、追求、欲望……不由我们控制的是身体、财产、名声和地位。",
    textTC: "有些事情由我們控制，有些則不然。由我們控制的是觀點、追求、慾望……不由我們控制的是身體、財產、名聲和地位。",
    textEN: "Some things are in our control and others not. Things in our control are opinion, pursuit, desire, aversion... things not in our control are body, property, reputation, command.",
    sourceSC: "爱比克泰德 · 手册",
    sourceTC: "愛比克泰德 · 手冊",
    sourceEN: "Epictetus · Enchiridion",
    tagsSC: ["控制二分法", "接纳无常", "课题分离"],
    tagsTC: ["控制二分法", "接納無常", "課題分離"],
    tagsEN: ["DichotomyOfControl", "Acceptance", "SeparationOfTasks"]
  },
  
  // 🟤 第六组：数据的本质与去噪 (Information Theory)
  {
    textSC: "信息的定义，就是对不确定性的消除。",
    textTC: "信息的定義，就是對不確定性的消除。",
    textEN: "Information is the resolution of uncertainty.",
    sourceSC: "克劳德·香农 · 信息论之父",
    sourceTC: "克勞德·香農 · 信息論之父",
    sourceEN: "Claude Shannon · Father of Information Theory",
    tagsSC: ["去噪", "信号与噪声", "确定性"],
    tagsTC: ["去噪", "信號與噪聲", "確定性"],
    tagsEN: ["Denoising", "SignalVsNoise", "Certainty"]
  },
  {
    textSC: "生活中的任何事，都没有你在思考它时所认为的那么重要。",
    textTC: "生活中的任何事，都沒有你在思考它時所認為的那麼重要。",
    textEN: "Nothing in life is as important as you think it is, while you are thinking about it.",
    sourceSC: "丹尼尔·卡尼曼 · 思考，快与慢",
    sourceTC: "丹尼爾·卡尼曼 · 思考，快與慢",
    sourceEN: "Daniel Kahneman · Thinking, Fast and Slow",
    tagsSC: ["聚焦错觉", "认知偏差", "宏观视角"],
    tagsTC: ["聚焦錯覺", "認知偏差", "宏觀視角"],
    tagsEN: ["FocusingIllusion", "CognitiveBias", "MacroView"]
  },
  
  // 🟠 第七组：静止与恢复的力量 (The Power of Stillness)
  {
    textSC: "澄清浑水最好的办法，就是别去搅动它，让它自己静下来。",
    textTC: "澄清渾水最好的辦法，就是別去攪動它，讓它自己靜下來。",
    textEN: "Muddy water is best cleared by leaving it alone.",
    sourceSC: "艾伦·沃茨 · 禅之道",
    sourceTC: "艾倫·沃茨 · 禪之道",
    sourceEN: "Alan Watts · The Way of Zen",
    tagsSC: ["无为而治", "积极休息", "自我修复"],
    tagsTC: ["無為而治", "積極休息", "自我修復"],
    tagsEN: ["WuWei", "ActiveRest", "SelfHealing"]
  },
  {
    textSC: "睡眠是我们必须为生命这笔本金支付的利息。利息越高，支付得越规律，状况就越好。",
    textTC: "睡眠是我們必須為生命這筆本金支付的利息。利息越高，支付得越規律，狀況就越好。",
    textEN: "Sleep is the interest we have to pay on the capital of life. The higher the rate of interest and the more regularly it is paid, the better.",
    sourceSC: "叔本华 · 附录和补遗",
    sourceTC: "叔本華 · 附錄和補遺",
    sourceEN: "Arthur Schopenhauer · Parerga and Paralipomena",
    tagsSC: ["睡眠资产", "生命利息", "精力管理"],
    tagsTC: ["睡眠資產", "生命利息", "精力管理"],
    tagsEN: ["SleepEquity", "InterestOfLife", "EnergyManagement"]
  },
  
  // 🟡 第八组：长期主义与节奏 (Long-termism & Rhythm)
  {
    textSC: "自然从不匆忙，但万物皆循序完成。",
    textTC: "自然從不匆忙，但萬物皆循序完成。",
    textEN: "Nature does not hurry, yet everything is accomplished.",
    sourceSC: "老子 · 道德经",
    sourceTC: "老子 · 道德經",
    sourceEN: "Lao Tzu · Tao Te Ching",
    tagsSC: ["自然节律", "反内卷", "从容"],
    tagsTC: ["自然節律", "反內卷", "從容"],
    tagsEN: ["NaturalRhythm", "AntiHustle", "Composure"]
  },
  {
    textSC: "长期的一致性，永远胜过短期的爆发力。",
    textTC: "長期的一致性，永遠勝過短期的爆發力。",
    textEN: "Long-term consistency beats short-term intensity.",
    sourceSC: "李小龙 · 武术哲学",
    sourceTC: "李小龍 · 武術哲學",
    sourceEN: "Bruce Lee · Martial Arts Philosophy",
    tagsSC: ["长期主义", "拒绝爆发", "平滑曲线"],
    tagsTC: ["長期主義", "拒絕爆發", "平滑曲線"],
    tagsEN: ["Consistency", "RejectIntensity", "SmoothCurve"]
  },
  
  // 🔵 第九组：潜意识与觉醒 (Unconscious & Awakening)
  {
    textSC: "在你将潜意识带入意识之前，它会一直主导你的人生，而你却称之为命运。",
    textTC: "在你將潛意識帶入意識之前，它會一直主導你的人生，而你卻稱之為命運。",
    textEN: "Until you make the unconscious conscious, it will direct your life and you will call it fate.",
    sourceSC: "卡尔·荣格 · 心理学概念",
    sourceTC: "卡爾·榮格 · 心理學概念",
    sourceEN: "Carl Jung · Psychological Concepts",
    tagsSC: ["数据觉醒", "打破宿命", "内观"],
    tagsTC: ["數據覺醒", "打破宿命", "內觀"],
    tagsEN: ["DataAwakening", "BreakFate", "Insight"]
  },
  {
    textSC: "在行动上要急不可耐，在结果上要耐心等待。",
    textTC: "在行動上要急不可耐，在結果上要耐心等待。",
    textEN: "Impatience with actions, patience with results.",
    sourceSC: "纳瓦尔·拉维坎特 · 纳瓦尔宝典",
    sourceTC: "納瓦爾·拉維坎特 · 納瓦爾寶典",
    sourceEN: "Naval Ravikant · The Almanack of Naval Ravikant",
    tagsSC: ["延迟满足", "执行力", "极客哲学"],
    tagsTC: ["延遲滿足", "執行力", "極客哲學"],
    tagsEN: ["DelayedGratification", "Execution", "GeekPhilosophy"]
  }
];

interface WisdomCarouselProps {
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export function WisdomCarousel({ 
  autoPlay = true, 
  interval = 8000,
  className = ''
}: WisdomCarouselProps) {
  const { language } = useI18n();
  
  // 基于日期计算今天应该显示哪条金句
  const getTodayQuoteIndex = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return dayOfYear % WISDOM_QUOTES.length;
  };
  
  const [currentIndex, setCurrentIndex] = useState(getTodayQuoteIndex());
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { ref, rotateX, rotateY, sheenX, sheenY, handleMouseMove, handleMouseLeave } = useCardTilt();

  const nextQuote = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % WISDOM_QUOTES.length);
  }, []);

  const prevQuote = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + WISDOM_QUOTES.length) % WISDOM_QUOTES.length);
  }, []);

  useEffect(() => {
    if (!autoPlay || isHovered) return;
    const timer = setInterval(() => {
      nextQuote();
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, isHovered, nextQuote]);

  // 每天自动更新到当天的金句
  useEffect(() => {
    const checkDailyQuote = () => {
      const todayIndex = getTodayQuoteIndex();
      if (todayIndex !== currentIndex) {
        setCurrentIndex(todayIndex);
      }
    };
    
    // 每小时检查一次是否需要更新
    const timer = setInterval(checkDailyQuote, 3600000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const currentQuote = WISDOM_QUOTES[currentIndex];
  
  // 获取当前语言的标签
  const currentTags = language === 'en' ? currentQuote.tagsEN : language === 'zh-TW' ? currentQuote.tagsTC : currentQuote.tagsSC;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ perspective: '1000px' }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { handleMouseLeave(); setIsHovered(false); }}
        onMouseEnter={() => setIsHovered(true)}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative"
      >
        {/* 光泽层 - 跟随光标 */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none rounded-2xl overflow-hidden"
          style={{ background: `radial-gradient(circle at ${sheenX} ${sheenY}, rgba(255,255,255,0.3) 0%, transparent 50%)` }}
        />
        
        {/* 边缘光效 */}
        <motion.div
          className="absolute -inset-[1px] rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: `linear-gradient(135deg, rgba(251,191,36,0.3) 0%, transparent 50%, rgba(249,115,22,0.2) 100%)` }}
        />

        <div className="bg-gradient-to-r from-white to-amber-50/60 dark:from-neutral-900 dark:to-neutral-800 rounded-2xl p-4 border border-amber-200/60 dark:border-neutral-700 relative shadow-sm">
          {/* 今日金句标签 */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 opacity-60">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {language === 'en' ? 'Daily Wisdom' : language === 'zh-TW' ? '今日金句' : '今日金句'}
            </span>
          </div>
          
          {/* 装饰图标 */}
          <div className="absolute top-3 right-3 opacity-20">
            <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          
          {/* 金句内容 */}
          <div className="min-h-[120px] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-center px-6"
            >
              {/* 主文字 - 悬停时有高级渐变和发光效果 */}
              <motion.p 
                className="text-lg font-medium leading-relaxed mb-4 tracking-wide"
                animate={isHovered ? {
                  textShadow: '0 2px 8px rgba(11,61,46,0.15)',
                  letterSpacing: '0.04em',
                  backgroundImage: 'linear-gradient(135deg, #0B3D2E 0%, #1a5a42 50%, #0B3D2E 100%)',
                } : {
                  textShadow: '0 0 0px transparent',
                  letterSpacing: '0.015em',
                  backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #1a1a1a 100%)',
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                &ldquo;{language === 'en' ? currentQuote.textEN : language === 'zh-TW' ? currentQuote.textTC : currentQuote.textSC}&rdquo;
              </motion.p>
              
              {/* 来源 - 悬停时淡入更明显 */}
              <motion.p 
                className="text-sm font-medium tracking-wider mb-3"
                animate={isHovered ? {
                  opacity: 1,
                  y: 0,
                  color: '#0B3D2E',
                } : {
                  opacity: 0.7,
                  y: 0,
                  color: '#4a4a4a',
                }}
                transition={{ duration: 0.3 }}
              >
                — {language === 'en' ? currentQuote.sourceEN : language === 'zh-TW' ? currentQuote.sourceTC : currentQuote.sourceSC}
              </motion.p>
              
              {/* 标签 */}
              <motion.div 
                className="flex flex-wrap gap-2 justify-center mt-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.6, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {currentTags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="text-xs px-2 py-1 rounded-full bg-amber-100/50 dark:bg-neutral-700/50 text-amber-700 dark:text-amber-300"
                  >
                    #{tag}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 导航按钮 */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={prevQuote}
            className="p-1.5 rounded-full hover:bg-amber-100/50 dark:hover:bg-neutral-700 transition-colors"
            aria-label="上一条"
          >
            <ChevronLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </button>
          
          {/* 指示器 */}
          <div className="flex gap-1.5">
            {WISDOM_QUOTES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'bg-amber-500 dark:bg-amber-400 w-4' 
                    : 'bg-amber-200 dark:bg-neutral-600 hover:bg-amber-300 dark:hover:bg-neutral-500'
                }`}
                aria-label={`跳转到第 ${idx + 1} 条`}
              />
            ))}
          </div>
          
          <button
            onClick={nextQuote}
            className="p-1.5 rounded-full hover:bg-amber-100/50 dark:hover:bg-neutral-700 transition-colors"
            aria-label="下一条"
          >
            <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </button>
        </div>
        </div>
      </motion.div>
    </div>
  );
}

export default WisdomCarousel;
