import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoadingIndicator from './components/LoadingIndicator';
import { api } from './api/client';

// Code-split pages for high performance and optimal bundle sizes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GlobalAnalytics = lazy(() => import('./pages/GlobalAnalytics'));
const IndiaAnalytics = lazy(() => import('./pages/IndiaAnalytics'));
const TrendsAnalysis = lazy(() => import('./pages/TrendsAnalysis'));
const CovidPrediction = lazy(() => import('./pages/CovidPrediction'));
const DataExplorer = lazy(() => import('./pages/DataExplorer'));
const DataAnalysis = lazy(() => import('./pages/DataAnalysis'));
const ModelPerformance = lazy(() => import('./pages/ModelPerformance'));
const About = lazy(() => import('./pages/About'));

export function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('connecting');
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const checkApiHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const res = await api.checkHealth();
      if (res.status === 200) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    // Initial health check
    checkApiHealth();
    // Poll API health periodically
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, [checkApiHealth]);

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
        {/* Collapsible & Mobile Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          backendStatus={backendStatus}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Header */}
          <Header
            onMenuClick={() => setMobileOpen(true)}
            backendStatus={backendStatus}
            onCheckHealth={checkApiHealth}
            isCheckingHealth={isCheckingHealth}
          />

          {/* Dynamic Page Content with Suspense */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Suspense
              fallback={
                <LoadingIndicator
                  message="Loading application view..."
                  fullHeight
                />
              }
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/global" element={<GlobalAnalytics />} />
                <Route path="/india" element={<IndiaAnalytics />} />
                <Route path="/trends" element={<TrendsAnalysis />} />
                <Route path="/prediction" element={<CovidPrediction />} />
                <Route path="/explorer" element={<DataExplorer />} />
                <Route path="/analysis" element={<DataAnalysis />} />
                <Route path="/models" element={<ModelPerformance />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
