import React, { useState } from "react";
import Navigation from "./Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Calendar } from "./ui/calendar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Building,
  FileText,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";

// 🔹 Import live backend data hook
import { useActsStats } from "../api/acts";

interface DashboardProps {
  onNavigate: (page: string, data?: any) => void;
  onLogout?: () => void;
}

export default function Dashboard({ onNavigate, onLogout }: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  // 🔹 Fetch live backend data
  const { loading, error, totals } = useActsStats();

  const notifications = [
    {
      id: 1,
      type: "deadline",
      title: "Annual Return Due",
      company: "TechCorp Ltd",
      date: "2025-07-30",
      priority: "high",
    },
    {
      id: 2,
      type: "request",
      title: "Collaboration Request",
      company: "Global Solutions Inc",
      date: "2025-07-24",
      priority: "medium",
    },
    {
      id: 3,
      type: "completed",
      title: "Board Resolution Filed",
      company: "StartupCo",
      date: "2025-07-23",
      priority: "low",
    },
  ];

  const newsItems = [
    {
      id: 1,
      title: "New Corporate Governance Guidelines Released",
      summary: "Updated compliance requirements for public companies...",
      date: "2025-07-22",
    },
    {
      id: 2,
      title: "Changes to Annual Filing Deadlines",
      summary: "Important updates to statutory filing requirements...",
      date: "2025-07-20",
    },
    {
      id: 3,
      title: "Digital Transformation in Corporate Compliance",
      summary: "Best practices for modernizing compliance processes...",
      date: "2025-07-18",
    },
  ];

  const upcomingTasks = [
    {
      date: "2025-07-25",
      task: "Board Meeting Minutes",
      company: "TechCorp Ltd",
      urgent: true,
    },
    {
      date: "2025-07-26",
      task: "Quarterly Report",
      company: "Global Solutions Inc",
      urgent: false,
    },
    {
      date: "2025-07-30",
      task: "Annual Return",
      company: "TechCorp Ltd",
      urgent: true,
    },
  ];

  // 🔹 Replace static stats with live backend data
  const stats = [
    {
      label: "Acts in Database",
      value: loading ? "…" : totals.actsCount,
      icon: Building,
      color: "text-primary",
    },
    {
      label: "Total Sections",
      value: loading ? "…" : totals.sectionsTotal,
      icon: FileText,
      color: "text-warning",
    },
    {
      label: "Total Compliances",
      value: loading ? "…" : totals.compliancesTotal,
      icon: Users,
      color: "text-success",
    },
    {
      label: "Last Sync",
      value: loading ? "…" : new Date().toLocaleDateString(),
      icon: CalendarIcon,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation
        currentPage="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Here's an overview of your compliance activities.
            </p>
            {/* 🔹 Optional live backend error indicator */}
            {error && (
              <p className="text-sm text-red-500 mt-1">
                Live backend data unavailable: {error.message || error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Calendar and Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Compliance Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-6">
                    <div className="w-full">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border w-full"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Upcoming Tasks</h4>
                      <div className="space-y-3">
                        {upcomingTasks.map((task, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 cursor-pointer transition-colors"
                            onClick={() => onNavigate("work", task)}
                          >
                            <div>
                              <p className="font-medium">{task.task}</p>
                              <p className="text-sm text-muted-foreground">
                                {task.company}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {task.date}
                              </p>
                            </div>
                            <Badge
                              variant={
                                task.urgent ? "destructive" : "secondary"
                              }
                            >
                              {task.urgent ? "Urgent" : "Scheduled"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        <div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">
                            {stat.label}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6 h-fit">
              {/* Notifications */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 min-h-[200px]">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-secondary/30"
                      >
                        <div className="flex-shrink-0">
                          {notification.type === "deadline" && (
                            <AlertTriangle className="h-5 w-5 text-warning" />
                          )}
                          {notification.type === "request" && (
                            <Bell className="h-5 w-5 text-primary" />
                          )}
                          {notification.type === "completed" && (
                            <CheckCircle className="h-5 w-5 text-success" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.company}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.date}
                          </p>
                        </div>
                        <Badge
                          variant={
                            notification.priority === "high"
                              ? "destructive"
                              : notification.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* News Feed */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Regulatory News
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 min-h-[300px]">
                    {newsItems.map((item) => (
                      <div
                        key={item.id}
                        className="border-b border-border last:border-0 pb-4 last:pb-0"
                      >
                        <h4 className="font-medium text-sm mb-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {item.summary}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.date}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => onNavigate("news")}
                  >
                    View All News
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
