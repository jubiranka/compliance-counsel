import React, { useState } from 'react';
import Navigation from './Navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Users, Send, MessageSquare, Clock, CheckCircle, Share2, FileText, Edit, Settings, X, Bot, Sparkles, Search, UserPlus, Shield } from 'lucide-react';

interface CollaborationPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export default function CollaborationPage({ onNavigate, onLogout }: CollaborationPageProps) {
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [draftContent, setDraftContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [selectedCompanyForAccess, setSelectedCompanyForAccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [requests, setRequests] = useState([
    {
      id: 1,
      type: 'sent',
      title: 'Review Annual Return - TechCorp Ltd',
      collaborator: 'Sarah Johnson',
      company: 'TechCorp Ltd',
      status: 'pending',
      date: '2025-07-23',
      message: 'Please review the annual return draft and provide feedback.'
    },
    {
      id: 2,
      type: 'received',
      title: 'Board Resolution Approval',
      collaborator: 'Michael Chen',
      company: 'Global Solutions Inc',
      status: 'completed',
      date: '2025-07-22',
      message: 'Board resolution for director appointment needs approval.'
    },
    {
      id: 3,
      type: 'received',
      title: 'Compliance Checklist Review',
      collaborator: 'Emma Davis',
      company: 'StartupCo',
      status: 'pending',
      date: '2025-07-21',
      message: 'Please review the Q2 compliance checklist for StartupCo.'
    }
  ]);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const sharedCompanies = [
    {
      id: 1,
      name: 'TechCorp Ltd',
      sharedWith: ['Sarah Johnson', 'Michael Chen'],
      role: 'Editor',
      lastAccessed: '2025-07-23'
    },
    {
      id: 2,
      name: 'Global Solutions Inc',
      sharedWith: ['Emma Davis'],
      role: 'Viewer',
      lastAccessed: '2025-07-22'
    }
  ];

  const drafts = [
    {
      id: 1,
      title: 'Annual Return - TechCorp Ltd',
      company: 'TechCorp Ltd',
      lastModified: '2025-07-23',
      collaborators: ['Sarah Johnson'],
      status: 'in_review'
    },
    {
      id: 2,
      title: 'Board Resolution - Director Appointment',
      company: 'Global Solutions Inc',
      lastModified: '2025-07-22',
      collaborators: ['Michael Chen', 'Emma Davis'],
      status: 'draft'
    },
    {
      id: 3,
      title: 'Compliance Report Q2 2025',
      company: 'StartupCo',
      lastModified: '2025-07-21',
      collaborators: [],
      status: 'draft'
    }
  ];

  // Admin-controlled approved users for collaboration
  const approvedUsers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      role: 'Company Secretary',
      department: 'Legal',
      canCollaborate: true,
      approvedFor: ['TechCorp Ltd', 'Global Solutions Inc']
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      role: 'Compliance Officer',
      department: 'Compliance',
      canCollaborate: true,
      approvedFor: ['Global Solutions Inc', 'Manufacturing Corp']
    },
    {
      id: 3,
      name: 'Emma Davis',
      email: 'emma.davis@example.com',
      role: 'Legal Counsel',
      department: 'Legal',
      canCollaborate: true,
      approvedFor: ['StartupCo', 'TechCorp Ltd']
    },
    {
      id: 4,
      name: 'Robert Wilson',
      email: 'robert.wilson@example.com',
      role: 'Financial Controller',
      department: 'Finance',
      canCollaborate: false,
      approvedFor: []
    }
  ];

  const openDraftEditor = (draft) => {
    setSelectedDraft(draft);
    setDraftContent(`# ${draft.title}\n\n## Company: ${draft.company}\n\nThis is a collaborative document. Please add your content here.\n\n### Notes:\n- Review all sections carefully\n- Ensure compliance with current regulations\n- Add any relevant comments using the sidebar`);
  };

  const handleWithdrawRequest = (requestId: number) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const handleManageAccess = (company: any) => {
    setSelectedCompanyForAccess(company);
    setShowAccessDialog(true);
  };

  const handleInviteUser = (user: any) => {
    const newRequest = {
      id: requests.length + 1,
      type: 'sent',
      title: 'Collaboration Request',
      collaborator: user.name,
      company: user.approvedFor[0] || 'General',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      message: `Collaboration request sent to ${user.name} for ${user.approvedFor[0] || 'general compliance'} work.`
    };
    
    setRequests(prev => [...prev, newRequest]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleVersionClick = (version: string) => {
    setSelectedVersion(version);
    // In a real application, you would load the version content here
    const versionContent = `# ${selectedDraft.title} - ${version}\n\n## Previous Version Content\n\nThis is the content from ${version} of the document.\n\n### Changes in this version:\n- Updated financial figures\n- Corrected director information\n- Added compliance notes\n\n[Previous version content would be loaded here...]`;
    setDraftContent(versionContent);
  };

  const handleAiAssist = () => {
    if (aiPrompt.trim()) {
      const aiResponse = generateAiResponse(aiPrompt);
      setDraftContent(prev => prev + '\n\n' + aiResponse);
      setAiPrompt('');
    }
  };

  const generateAiResponse = (prompt: string): string => {
    const responses = {
      'add introduction': '## Introduction\n\nThis document outlines the key compliance requirements and procedures that must be followed to ensure regulatory adherence.',
      'add conclusion': '## Conclusion\n\nIn summary, maintaining compliance requires ongoing vigilance and adherence to established procedures. Regular reviews and updates ensure continued regulatory compliance.',
      'add legal disclaimer': '## Legal Disclaimer\n\n*This document is for informational purposes only and does not constitute legal advice. Please consult with qualified legal professionals for specific compliance requirements.*',
      'format as board resolution': '**BOARD RESOLUTION**\n\nRESOLVED THAT the Board hereby approves the following matters:\n\n1. [Insert resolution details]\n2. [Insert additional clauses as needed]\n\nThis resolution was passed at the Board Meeting held on [Date].',
      'add signature section': '## Signatures\n\n**For the Company:**\n\n_________________________\nDirector Name\nDesignation\nDate: __________\n\n_________________________\nCompany Secretary\nDate: __________'
    };

    const lowerPrompt = prompt.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerPrompt.includes(key)) {
        return response;
      }
    }

    return `### AI Generated Content\n\nBased on your request: "${prompt}"\n\n[AI-generated content would be inserted here based on the specific requirements of your document. This system can help with formatting, legal language, compliance requirements, and document structure.]`;
  };

  if (selectedDraft) {
    return (
      <div className="min-h-screen">
        <Navigation currentPage="collaboration" onNavigate={onNavigate} onLogout={onLogout} />
        
        <main className="ml-64 pt-16">
          <div className="h-[calc(100vh-4rem)] flex">
            {/* Document Editor */}
            <div className="flex-1 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <Button variant="ghost" onClick={() => setSelectedDraft(null)} className="mb-2">
                    ← Back to Collaboration
                  </Button>
                  <h1 className="text-2xl font-bold">{selectedDraft.title}</h1>
                  <p className="text-muted-foreground">{selectedDraft.company}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={selectedDraft.status === 'in_review' ? 'default' : 'secondary'}>
                    {selectedDraft.status === 'in_review' ? 'In Review' : 'Draft'}
                  </Badge>
                  <Button>Save</Button>
                  <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
              
              {/* AI Assistant */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <span className="font-medium">AI Drafting Assistant</span>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Input
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Type a prompt (e.g., 'add introduction', 'format as board resolution', 'add signature section')"
                      onKeyPress={(e) => e.key === 'Enter' && handleAiAssist()}
                    />
                    <Button onClick={handleAiAssist} size="sm">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => setAiPrompt('add introduction')}>
                      Add Introduction
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAiPrompt('format as board resolution')}>
                      Board Resolution
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAiPrompt('add signature section')}>
                      Signature Section
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="h-[calc(100vh-20rem)]">
                <CardContent className="p-6 h-full">
                  <Textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="h-full resize-none border-none focus:ring-0"
                    placeholder="Start writing your document..."
                  />
                </CardContent>
              </Card>
            </div>

            {/* Comments Sidebar */}
            <div className="w-80 border-l border-border p-6 bg-secondary/20">
              <h3 className="font-semibold mb-4">Comments & History</h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>SJ</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">Sarah Johnson</span>
                    <span className="text-xs text-muted-foreground">2h ago</span>
                  </div>
                  <p className="text-sm">Please review the financial figures in section 3. They need to match the audited statements.</p>
                </div>

                <div className="p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>MC</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">Michael Chen</span>
                    <span className="text-xs text-muted-foreground">1d ago</span>
                  </div>
                  <p className="text-sm">Updated the director information. Please verify the new appointments are correct.</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Version History</h4>
                <div className="space-y-2">
                  <div 
                    className="text-sm p-2 bg-white rounded border cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() => handleVersionClick('Version 1.3')}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-primary">Version 1.3</span>
                      <span className="text-xs text-muted-foreground">2h ago</span>
                    </div>
                    <p className="text-xs text-muted-foreground">by Sarah Johnson</p>
                    {selectedVersion === 'Version 1.3' && (
                      <p className="text-xs text-primary mt-1">← Currently viewing</p>
                    )}
                  </div>
                  <div 
                    className="text-sm p-2 bg-white rounded border cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() => handleVersionClick('Version 1.2')}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-primary">Version 1.2</span>
                      <span className="text-xs text-muted-foreground">1d ago</span>
                    </div>
                    <p className="text-xs text-muted-foreground">by Michael Chen</p>
                    {selectedVersion === 'Version 1.2' && (
                      <p className="text-xs text-primary mt-1">← Currently viewing</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation currentPage="collaboration" onNavigate={onNavigate} onLogout={onLogout} />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Collaboration</h1>
            <p className="text-muted-foreground mt-2">
              Work together with colleagues on compliance documents and share company access.
            </p>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Find Approved Collaborators</span>
              </div>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (e.target.value.trim()) {
                        const results = approvedUsers.filter(user => 
                          user.canCollaborate && 
                          (user.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                           user.email.toLowerCase().includes(e.target.value.toLowerCase()) ||
                           user.role.toLowerCase().includes(e.target.value.toLowerCase()))
                        );
                        setSearchResults(results);
                      } else {
                        setSearchResults([]);
                      }
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div key={user.id} className="p-2 border border-border rounded-lg bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.role} • {user.department}</p>
                          <p className="text-xs text-muted-foreground">Approved for: {user.approvedFor.join(', ')}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleInviteUser(user)}>
                          <UserPlus className="h-3 w-3 mr-1" />
                          Invite
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searchTerm && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  No approved collaborators found. Only admin-approved users can collaborate.
                </p>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="requests" className="space-y-6">
            <TabsList>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="shared">Shared Companies</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
            </TabsList>

            <TabsContent value="requests">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Send className="mr-2 h-5 w-5" />
                      Sent Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {requests.filter(r => r.type === 'sent').map((request) => (
                        <div key={request.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{request.title}</h4>
                            <Badge variant={request.status === 'pending' ? 'default' : 'secondary'}>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{request.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">To: {request.collaborator}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">{request.date}</span>
                              {request.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleWithdrawRequest(request.id)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Withdraw
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Received Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {requests.filter(r => r.type === 'received').map((request) => (
                        <div key={request.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{request.title}</h4>
                            <Badge variant={request.status === 'pending' ? 'destructive' : 'default'}>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{request.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">From: {request.collaborator}</span>
                            <div className="flex space-x-2">
                              {request.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="outline">Decline</Button>
                                  <Button size="sm">Accept</Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="shared">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Shared Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sharedCompanies.map((company) => (
                      <div key={company.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{company.name}</h4>
                          <Badge variant="outline">{company.role}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Shared with: {company.sharedWith.join(', ')}</span>
                          <span>Last accessed: {company.lastAccessed}</span>
                        </div>
                        <div className="flex justify-end mt-2">
                          <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleManageAccess(company)}
                              >
                                <Settings className="mr-2 h-3 w-3" />
                                Manage Access
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Manage Access - {selectedCompanyForAccess?.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Current Users</h4>
                                  <div className="space-y-2">
                                    {selectedCompanyForAccess?.sharedWith.map((user, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                                        <span>{user}</span>
                                        <div className="flex space-x-2">
                                          <Button size="sm" variant="outline">Edit Role</Button>
                                          <Button size="sm" variant="outline">Remove</Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Add New User</h4>
                                  <div className="flex space-x-2">
                                    <Input placeholder="Enter email address" />
                                    <Button>Add User</Button>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="drafts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Collaborative Drafts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {drafts.map((draft) => (
                      <div key={draft.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{draft.title}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant={draft.status === 'in_review' ? 'default' : 'secondary'}>
                              {draft.status === 'in_review' ? 'In Review' : 'Draft'}
                            </Badge>
                            <Button size="sm" onClick={() => openDraftEditor(draft)}>
                              <Edit className="mr-2 h-3 w-3" />
                              Edit
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{draft.company}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Collaborators: {draft.collaborators.length > 0 ? draft.collaborators.join(', ') : 'None'}
                          </span>
                          <span>Modified: {draft.lastModified}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}