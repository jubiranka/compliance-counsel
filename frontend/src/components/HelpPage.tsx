import React, { useState } from "react";
import Navigation from "./Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  HelpCircle,
  Send,
  Bot,
  User,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface HelpPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

interface Message {
  id: number;
  content: string;
  sender: "user" | "bot";
  timestamp: string;
}

export default function HelpPage({ onNavigate, onLogout }: HelpPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content:
        "Hello! I'm your Compliance Counsel assistant. I can help you with corporate compliance questions, filing deadlines, and regulatory requirements. How can I assist you today?",
      sender: "bot",
      timestamp: "10:00 AM",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const suggestedQuestions = [
    "When is my annual return due?",
    "What documents do I need for a director change?",
    "How do I file a board resolution?",
    "What are the requirements for a private limited company?",
    "How do I register a mortgage?",
    "What are the penalties for late filing?",
  ];

  const quickHelp = [
    {
      title: "Filing Deadlines",
      icon: Clock,
      description: "Learn about statutory filing deadlines and requirements",
    },
    {
      title: "Document Templates",
      icon: FileText,
      description: "Access templates for common corporate documents",
    },
    {
      title: "Compliance Alerts",
      icon: AlertCircle,
      description: "Set up notifications for upcoming deadlines",
    },
    {
      title: "Best Practices",
      icon: CheckCircle,
      description: "Follow industry best practices for compliance",
    },
  ];

  // 🧠 Send user question to backend AI assistant
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      content: inputMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    // Temporary placeholder “thinking” message
    const thinkingMessage: Message = {
      id: messages.length + 2,
      content: "Thinking...",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, thinkingMessage]);

    try {
      const res = await fetch("http://127.0.0.1:8000/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: inputMessage, k: 5 }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const reply =
        data?.answer ||
        "I couldn’t generate a confident answer from available sources. Please try rephrasing.";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingMessage.id ? { ...m, content: reply } : m
        )
      );
    } catch (err) {
      console.error("Assistant error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingMessage.id
            ? {
                ...m,
                content:
                  "Sorry, I had trouble reaching the assistant. Please ensure the backend is running.",
              }
            : m
        )
      );
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="min-h-screen">
      <Navigation
        currentPage="help"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Help & Support</h1>
            <p className="text-muted-foreground mt-2">
              Get instant help with compliance questions and regulatory
              requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Interface */}
            <div>
              <Card className="h-[calc(100vh-12rem)] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bot className="mr-2 h-5 w-5" />
                    Compliance Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0 p-0">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex items-start space-x-2 max-w-[80%] ${
                            message.sender === "user"
                              ? "flex-row-reverse space-x-reverse"
                              : ""
                          }`}
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            {message.sender === "user" ? (
                              <>
                                <AvatarImage src="/placeholder-avatar.jpg" />
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </>
                            ) : (
                              <AvatarFallback>
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div
                            className={`p-3 rounded-lg ${
                              message.sender === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-line">
                              {message.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender === "user"
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {message.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Suggested Questions */}
                    {messages.length === 1 && (
                      <div className="mt-6">
                        <p className="text-sm text-muted-foreground mb-3">
                          Try asking:
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {suggestedQuestions.map((question, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-left justify-start h-auto p-3 text-xs"
                              onClick={() => handleSuggestedQuestion(question)}
                            >
                              {question}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-border p-4 bg-background">
                    <div className="flex space-x-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask about compliance requirements..."
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Help and Resources Sidebar */}
            <div className="space-y-6 h-[calc(100vh-12rem)] overflow-y-auto">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HelpCircle className="mr-2 h-5 w-5" />
                    Quick Help
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 min-h-[200px]">
                    {quickHelp.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={index}
                          className="p-3 border border-border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <div>
                              <h4 className="font-medium">{item.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Contact Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[120px]">
                    <p className="text-sm text-muted-foreground mb-4">
                      Need additional help? Our compliance experts are here to
                      assist you.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        Email Support
                      </Button>
                      <Button variant="outline" className="w-full">
                        Schedule Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 min-h-[120px]">
                    <Button variant="ghost" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      User Guide
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Video Tutorials
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      FAQ
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Knowledge Base
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Training Videos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
