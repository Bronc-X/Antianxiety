'use client';

/**
 * Max Chat Page - Using assistant-ui components
 * 
 * Integrated with useMax hook via useMaxRuntime adapter.
 * Green-themed interface based on user's gradient image.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Menu } from 'lucide-react';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useMax } from '@/hooks/domain/useMax';
import { usePlans } from '@/hooks/domain/usePlans';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { Thread } from '@/components/assistant-ui/thread';
import { useMaxRuntime } from '@/components/assistant-ui/use-max-runtime';
import { PlanSelectorProvider } from '@/components/assistant-ui/plan-selector-context';
import type { ParsedPlan } from '@/lib/plan-parser';

export default function MaxPageClient() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const maxHook = useMax();
  const plansHook = usePlans();

  const {
    conversations,
    currentConversationId,
    isLoading: isHistoryLoading,
    starterQuestions,
    newConversation,
    switchConversation,
    deleteChat,
    sendMessage,
  } = maxHook;

  // Restore runtime
  const runtime = useMaxRuntime(maxHook);

  // Initialize: Load the most recent conversation
  useEffect(() => {
    if (historyLoaded) return;
    if (!isHistoryLoading) {
      const timer = setTimeout(() => {
        if (conversations.length > 0 && !currentConversationId) {
          switchConversation(conversations[0].id);
        }
        setHistoryLoaded(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isHistoryLoading, historyLoaded, conversations, currentConversationId, switchConversation]);

  // Close handler
  const handleClose = useCallback(() => {
    router.push('/unlearn');
  }, [router]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((question: string) => {
    sendMessage(question, [], 'zh');
  }, [sendMessage]);

  // Plan Selector: Save to user plans
  const handleSavePlan = useCallback(async (plan: ParsedPlan): Promise<boolean> => {
    const result = await plansHook.createFromAI([plan], currentConversationId || undefined);
    return result !== null && result.length > 0;
  }, [plansHook, currentConversationId]);

  // Plan Selector: Request alternative (continue in same conversation)
  const handleRequestAlternative = useCallback((plan: ParsedPlan) => {
    const message = `请帮我调整"${plan.title}"中较难执行的项目，用更简单的替代方案替换它们，保持同样的效果目标。`;
    sendMessage(message, [], 'zh');
  }, [sendMessage]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md md:p-8 animate-in fade-in duration-150 font-sans text-sm">
      {/* Modal Window */}
      <div className="unlearn-theme w-full h-[100dvh] md:h-[92vh] md:max-w-[1400px] bg-gradient-to-br from-[#0B3D2E] to-[#134e3f] text-white/90 md:rounded-[2rem] shadow-2xl overflow-hidden flex relative ring-1 ring-white/10">

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-colors backdrop-blur-md"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Sidebar */}
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewConversation={async () => { await newConversation(); setSidebarOpen(false); }}
          onSwitchConversation={(id) => { switchConversation(id); setSidebarOpen(false); }}
          onDeleteConversation={async (id) => { await deleteChat(id); }}
          isLoading={isHistoryLoading}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col min-w-0 relative transition-all duration-200 ${sidebarOpen ? 'blur-sm pointer-events-none md:blur-0 md:pointer-events-auto' : ''}`}>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-4 left-4 z-40 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors backdrop-blur-md md:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <PlanSelectorProvider
            savePlan={handleSavePlan}
            requestAlternative={handleRequestAlternative}
            isSaving={plansHook.isSaving}
          >
            <AssistantRuntimeProvider runtime={runtime}>
              <Thread
                starterQuestions={starterQuestions}
                onSuggestionClick={handleSuggestionClick}
              />
            </AssistantRuntimeProvider>
          </PlanSelectorProvider>
        </div>
      </div>
    </div>
  );
}
