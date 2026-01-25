import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DiagnosticProvider } from "@/lib/diagnosticContext";
import Landing from "./pages/Landing";
import SituationSelector from "./pages/SituationSelector";
import GuidedIntake from "./pages/GuidedIntake";
import OutputModePicker from "./pages/OutputModePicker";
import ReportViewer from "./pages/ReportViewer";
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
            <Route path="/" element={<Landing />} />
            <Route path="/situation" element={<SituationSelector />} />
            <Route path="/intake" element={<GuidedIntake />} />
            <Route path="/output-mode" element={<OutputModePicker />} />
            <Route path="/report" element={<ReportViewer />} />
            <Route path="/upload" element={<UploadPacket />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DiagnosticProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
