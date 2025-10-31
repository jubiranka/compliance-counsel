// src/App.tsx
import React, { useState } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import CompaniesPage from "./components/CompaniesPage";
import CollaborationPage from "./components/CollaborationPage";
import HelpPage from "./components/HelpPage";
import SettingsPage from "./components/SettingsPage";
import NewsPage from "./components/NewsPage";
import AddCompanyPage from "./components/AddCompanyPage";
import WorkPage from "./components/WorkPage";
import UploadDocumentPage from "./components/UploadDocumentPage";
import CompliancesPage from "./components/CompliancesPage";

import TestAPI from "./components/TestAPI";
import CompanyProfilePage from "./components/CompanyProfilePage"; // ✅ NEW IMPORT

export default function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [refreshCompanies, setRefreshCompanies] = useState(0); // ✅ keeps companies updated

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage("login");
    setSelectedCompany(null);
    setSelectedTask(null);
  };

  // ✅ Centralized navigation (handles all cases cleanly)
  const navigateTo = (page: string, data: any = null) => {
    setCurrentPage(page);

    if (page === "work") setSelectedTask(data);
    if (page === "add-company") setSelectedCompany(data);
    if (page === "company-profile") setSelectedCompany(data); // ✅ NEW
    if (page === "companies") {
      setSelectedCompany(null);
      setRefreshCompanies((r) => r + 1); // ✅ Refresh list
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case "companies":
        return (
          <CompaniesPage
            onNavigate={navigateTo}
            onLogout={handleLogout}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            refreshTrigger={refreshCompanies}
          />
        );
      case "company-profile": // ✅ NEW CASE
        return (
          <CompanyProfilePage
            company={selectedCompany}
            onBack={() => setCurrentPage("companies")}
            onNavigate={navigateTo}
            onLogout={handleLogout}
          />
        );
      case "collaboration":
        return (
          <CollaborationPage onNavigate={navigateTo} onLogout={handleLogout} />
        );
      case "help":
        return <HelpPage onNavigate={navigateTo} onLogout={handleLogout} />;
      case "settings":
        return <SettingsPage onNavigate={navigateTo} onLogout={handleLogout} />;
      case "news":
        return <NewsPage onNavigate={navigateTo} onLogout={handleLogout} />;
      case "add-company":
        return (
          <AddCompanyPage
            onNavigate={navigateTo}
            onLogout={handleLogout}
            editData={selectedCompany}
          />
        );
      case "work":
        return (
          <WorkPage
            onNavigate={navigateTo}
            onLogout={handleLogout}
            selectedTask={selectedTask}
          />
        );
      case "upload-document":
        return (
          <UploadDocumentPage onNavigate={navigateTo} onLogout={handleLogout} />
        );
      case "compliances":
        return (
          <CompliancesPage onNavigate={navigateTo} onLogout={handleLogout} />
        );

      default:
        return <Dashboard onNavigate={navigateTo} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">{renderCurrentPage()}</div>
  );
}
