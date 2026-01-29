import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DiagnosticProvider } from "@/lib/diagnosticContext";

// Pages
import Home from "./pages/Home";
import DemoScenarioLibrary from "./pages/DemoScenarioLibrary";
import DiagnosticIntake from "./pages/DiagnosticIntake";
import DiagnosticReview from "./pages/DiagnosticReview";
import ExportDelivery from "./pages/ExportDelivery";
import NotebookLMBriefing from "./pages/NotebookLMBriefing";
import AboutSystem from "./pages/AboutSystem";
import UploadPacket from "./pages/UploadPacket";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DiagnosticProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/diagnostic" element={<DiagnosticIntake />} />
            <Route path="/demos" element={<DemoScenarioLibrary />} />
            <Route path="/reports" element={<ExportDelivery />} />
            <Route path="/report" element={<DiagnosticReview />} />
            <Route path="/briefings" element={<NotebookLMBriefing />} />
            <Route path="/about" element={<AboutSystem />} />
            
            {/* Legacy Routes (redirect support) */}
            <Route path="/intake" element={<DiagnosticIntake />} />
            <Route path="/upload" element={<UploadPacket />} />
            <Route path="/situation" element={<DemoScenarioLibrary />} />
            <Route path="/output-mode" element={<DiagnosticIntake />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DiagnosticProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;