"use client";

// This file is now a barrel file for the sub-views
// See components/mobile/views/ for implementation

export { ViewDashboard } from "./views/ViewDashboard";
export { ViewMax } from "./views/ViewMax";
export { ViewPlan } from "./views/ViewPlan";
export { ViewProfile } from "./views/ViewProfile";

// New Sub-views
export { ViewPlanCreator } from "./views/ViewPlanCreator";
export { ViewPlanDetail } from "./views/ViewPlanDetail";
export { ViewArticleReader } from "./views/ViewArticleReader";
export { ViewProfileEdit } from "./views/ViewProfileEdit";
export { ViewSettings } from "./views/ViewSettings";
export { ViewCalibration } from "./views/ViewCalibration";
export { ViewScience } from "./views/ViewScience";
export { ViewWearables } from "./views/ViewWearables";
export { ViewGoals } from "./views/ViewGoals";
export { ViewOnboarding } from "./views/ViewOnboarding";
export { ViewDigitalTwin } from "./views/ViewDigitalTwin";

// Phase 2: New Hook-Connected Views
export { ViewAssessment } from "./views/ViewAssessment";
export { ViewHabits } from "./views/ViewHabits";
export { ViewAnalysis } from "./views/ViewAnalysis";
export { ViewAiReminders } from "./views/ViewAiReminders";
export { ViewDailyQuestionnaire } from "./views/ViewDailyQuestionnaire";
export { ViewBayesianLoop } from "./views/ViewBayesianLoop";
export { ViewInquiryCenter } from "./views/ViewInquiryCenter";
export { ViewInsightEngine } from "./views/ViewInsightEngine";
export { ViewVoiceAnalysis } from "./views/ViewVoiceAnalysis";
export { ViewMaxLabs } from "./views/ViewMaxLabs";
export { ViewAdaptiveOnboarding } from "./views/ViewAdaptiveOnboarding";
export { ViewDebugSession } from "./views/ViewDebugSession";
export { ViewCuratedFeed } from "./views/ViewCuratedFeed";

// Phase 3: Auth Views
export { ViewLogin } from "./views/ViewLogin";
export { ViewRegister } from "./views/ViewRegister";

// Phase 4: User Journey Views
export { ViewProfileSetup } from "./views/ViewProfileSetup";
export { ViewMembership } from "./views/ViewMembership";
export { ViewCoreHub } from "./views/ViewCoreHub";
