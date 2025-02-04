import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
import { Suspense, lazy } from "react";

// Lazy load pages
const Lists = lazy(() => import("@/pages/Lists"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Investors = lazy(() => import("@/pages/Investors"));
const Raise = lazy(() => import("@/pages/Raise"));
const Campaigns = lazy(() => import("@/pages/Campaigns"));
const Enrichment = lazy(() => import("@/pages/Enrichment"));
const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));
const Team = lazy(() => import("@/pages/Team"));
const Auth = lazy(() => import("@/pages/Auth"));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/auth/*" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <div className="flex h-screen">
                      <AppSidebar />
                      <main className="flex-1 overflow-y-auto bg-background">
                        <Suspense fallback={<div>Loading...</div>}>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/lists" element={<Lists />} />
                            <Route path="/investors" element={<Investors />} />
                            <Route path="/raise" element={<Raise />} />
                            <Route path="/campaigns" element={<Campaigns />} />
                            <Route path="/enrichment" element={<Enrichment />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/team" element={<Team />} />
                          </Routes>
                        </Suspense>
                      </main>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;