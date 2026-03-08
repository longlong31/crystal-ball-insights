import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import ProjectAnalysis from "./pages/ProjectAnalysis";
import Documentation from "./pages/Documentation";
import Profiles from "./pages/Profiles";
import Admin from "./pages/Admin";
import Community from "./pages/Community";
import NewsDetail from "./pages/NewsDetail";
import NotFound from "./pages/NotFound";
import AlgorithmLab from "./pages/AlgorithmLab";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { PlatformLayout } from "@/components/platform/PlatformLayout";
import Dashboard from "./pages/platform/Dashboard";
import StockAnalysis from "./pages/platform/StockAnalysis";
import CryptoIntelligence from "./pages/platform/CryptoIntelligence";
import PortfolioOptimizer from "./pages/platform/PortfolioOptimizer";
import RiskEngine from "./pages/platform/RiskEngine";
import AIInsights from "./pages/platform/AIInsights";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/project" element={<ProjectAnalysis />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/community" element={<Community />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            {/* Platform Routes */}
            <Route path="/platform" element={<PlatformLayout><Dashboard /></PlatformLayout>} />
            <Route path="/platform/stocks" element={<PlatformLayout><StockAnalysis /></PlatformLayout>} />
            <Route path="/platform/crypto" element={<PlatformLayout><CryptoIntelligence /></PlatformLayout>} />
            <Route path="/platform/portfolio" element={<PlatformLayout><PortfolioOptimizer /></PlatformLayout>} />
            <Route path="/platform/risk" element={<PlatformLayout><RiskEngine /></PlatformLayout>} />
            <Route path="/platform/ai-insights" element={<PlatformLayout><AIInsights /></PlatformLayout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatbotWidget />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
