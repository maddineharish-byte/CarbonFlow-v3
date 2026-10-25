/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicNavbar } from './components/layout/PublicNavbar';
import { PublicFooter } from './components/layout/PublicFooter';
import { AppLayout } from './components/layout/AppLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ProductPage } from './pages/public/ProductPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { SecurityPage } from './pages/public/SecurityPage';
import { CompliancePage } from './pages/public/CompliancePage';
import { TechnologyPage } from './pages/public/TechnologyPage';
import { DocumentationPage } from './pages/public/DocumentationPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { SignInPage } from './pages/public/SignInPage';
import { GetStartedPage } from './pages/public/GetStartedPage';

// SaaS App Pages
import { DashboardPage } from './pages/app/DashboardPage';
import { OrganizationPage } from './pages/app/OrganizationPage';
import { CarbonDataPage } from './pages/app/CarbonDataPage';
import { EvidencePage } from './pages/app/EvidencePage';
import { AuditsPage } from './pages/app/AuditsPage';
import { FindingsPage } from './pages/app/FindingsPage';
import { CorrectiveActionsPage } from './pages/app/CorrectiveActionsPage';
import { CompliancePage as AppCompliancePage } from './pages/app/CompliancePage';
import { ReportsPage } from './pages/app/ReportsPage';
import { AuditTrailPage } from './pages/app/AuditTrailPage';
import { BackupRecoveryPage } from './pages/app/BackupRecoveryPage';
import { SettingsPage } from './pages/app/SettingsPage';
import { TravelMobilityPage } from './pages/app/TravelMobilityPage';
import { GeminiChatbotPage } from './pages/app/GeminiChatbotPage';

function MainRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [appTab, setAppTab] = useState<string>('dashboard');

  // Sync with browser URL changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    setCurrentPath(window.location.pathname || '/');
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-800 border-t-transparent" />
          <span className="text-xs font-semibold text-stone-600">Initializing CarbonFlow...</span>
        </div>
      </div>
    );
  }

  // If user is authenticated and navigating in the app
  const isAppMode = isAuthenticated && (currentPath === '/app' || currentPath.startsWith('/app/'));

  if (isAppMode) {
    return (
      <AppLayout
        currentTab={appTab}
        setTab={setAppTab}
        navigatePublic={navigate}
      >
        {appTab === 'dashboard' && <DashboardPage setTab={setAppTab} />}
        {appTab === 'ai-assistant' && <GeminiChatbotPage />}
        {appTab === 'organization' && <OrganizationPage />}
        {appTab === 'carbon-data' && <CarbonDataPage />}
        {appTab === 'travel' && <TravelMobilityPage />}
        {appTab === 'evidence' && <EvidencePage />}
        {appTab === 'audits' && <AuditsPage />}
        {appTab === 'findings' && <FindingsPage />}
        {appTab === 'corrective-actions' && <CorrectiveActionsPage />}
        {appTab === 'compliance' && <AppCompliancePage />}
        {appTab === 'reports' && <ReportsPage />}
        {appTab === 'audit-trail' && <AuditTrailPage />}
        {appTab === 'backup' && <BackupRecoveryPage />}
        {appTab === 'settings' && <SettingsPage />}
      </AppLayout>
    );
  }

  // Guard: If accessing /app without authentication, show SignInPage
  if (currentPath.startsWith('/app')) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
        <PublicNavbar currentPath="/sign-in" navigate={navigate} />
        <main className="flex-1">
          <SignInPage navigate={navigate} onSuccess={() => navigate('/app')} />
        </main>
        <PublicFooter navigate={navigate} />
      </div>
    );
  }

  // Public Website Shell
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <PublicNavbar currentPath={currentPath} navigate={navigate} />

      <main className="flex-1">
        {currentPath === '/' && <HomePage navigate={navigate} />}
        {currentPath === '/product' && <ProductPage navigate={navigate} />}
        {currentPath === '/features' && <FeaturesPage navigate={navigate} />}
        {currentPath === '/how-it-works' && <HowItWorksPage navigate={navigate} />}
        {currentPath === '/security' && <SecurityPage navigate={navigate} />}
        {currentPath === '/compliance' && <CompliancePage navigate={navigate} />}
        {currentPath === '/technology' && <TechnologyPage navigate={navigate} />}
        {currentPath === '/documentation' && <DocumentationPage />}
        {currentPath === '/about' && <AboutPage />}
        {currentPath === '/contact' && <ContactPage />}
        {currentPath === '/sign-in' && (
          <SignInPage navigate={navigate} onSuccess={() => navigate('/app')} />
        )}
        {currentPath === '/get-started' && (
          <GetStartedPage navigate={navigate} onSuccess={() => navigate('/app')} />
        )}
      </main>

      <PublicFooter navigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
