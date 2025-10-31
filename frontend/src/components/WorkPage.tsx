import React, { useState } from 'react';
import Navigation from './Navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Clock, Building2, FileText, Calendar, CheckCircle2, User, MessageSquare } from 'lucide-react';

interface WorkPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  selectedTask?: any;
}

export default function WorkPage({ onNavigate, onLogout, selectedTask }: WorkPageProps) {
  const [taskNotes, setTaskNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // Default task if none provided
  const task = selectedTask || {
    task: 'General Work Item',
    company: 'Unknown Company',
    date: new Date().toISOString().split('T')[0],
    urgent: false
  };

  const taskDetails = {
    description: `Complete the ${task.task} for ${task.company}. This involves preparing the necessary documentation, ensuring compliance with all regulatory requirements, and submitting the filing within the specified deadline.`,
    requirements: [
      'Review company records and documentation',
      'Prepare required forms and schedules',
      'Verify accuracy of all financial information',
      'Obtain necessary approvals and signatures',
      'Submit filing to appropriate authorities',
      'Update company registers and records'
    ],
    documents: [
      'Board Resolution',
      'Financial Statements',
      'Director Details',
      'Share Capital Information',
      'Registered Office Address'
    ],
    deadline: task.date,
    estimatedTime: '2-3 hours',
    complexity: task.urgent ? 'High' : 'Medium'
  };

  const handleCompleteTask = () => {
    setIsCompleted(true);
    // Here you would typically update the task status in your data store
  };

  return (
    <div className="min-h-screen">
      <Navigation currentPage="work" onNavigate={onNavigate} onLogout={onLogout} />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="mb-4">
              <Button variant="ghost" onClick={() => onNavigate('dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{task.task}</h1>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center text-muted-foreground">
                    <Building2 className="mr-1 h-4 w-4" />
                    {task.company}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="mr-1 h-4 w-4" />
                    Due: {task.date}
                  </div>
                  <Badge variant={task.urgent ? "destructive" : "secondary"}>
                    {task.urgent ? "Urgent" : "Scheduled"}
                  </Badge>
                  {isCompleted && (
                    <Badge className="bg-success text-success-foreground">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
              {!isCompleted && (
                <Button onClick={handleCompleteTask}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-muted-foreground">{taskDetails.description}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Requirements Checklist</h4>
                        <div className="space-y-2">
                          {taskDetails.requirements.map((requirement, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input type="checkbox" className="rounded" />
                              <span className="text-sm">{requirement}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-medium">Estimated Time</span>
                          </div>
                          <p className="text-muted-foreground">{taskDetails.estimatedTime}</p>
                        </div>
                        <div className="p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-medium">Deadline</span>
                          </div>
                          <p className="text-muted-foreground">{taskDetails.deadline}</p>
                        </div>
                        <div className="p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium">Complexity</span>
                          </div>
                          <p className="text-muted-foreground">{taskDetails.complexity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents">
                  <Card>
                    <CardHeader>
                      <CardTitle>Required Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {taskDetails.documents.map((document, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-4 w-4 text-primary" />
                              <span>{document}</span>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                              <Button size="sm" variant="outline">
                                Upload
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes">
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="notes">Add Notes</Label>
                          <Textarea
                            id="notes"
                            value={taskNotes}
                            onChange={(e) => setTaskNotes(e.target.value)}
                            placeholder="Add any notes or observations about this task..."
                            rows={6}
                          />
                        </div>
                        <Button>Save Notes</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle>Task History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3 p-3 border-l-2 border-primary pl-4">
                          <div className="flex-1">
                            <p className="font-medium">Task Created</p>
                            <p className="text-sm text-muted-foreground">Task was automatically generated based on compliance schedule</p>
                            <p className="text-xs text-muted-foreground mt-1">Today, 9:00 AM</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border-l-2 border-muted pl-4">
                          <div className="flex-1">
                            <p className="font-medium">Reminder Sent</p>
                            <p className="text-sm text-muted-foreground">Email reminder sent about upcoming deadline</p>
                            <p className="text-xs text-muted-foreground mt-1">Yesterday, 2:00 PM</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 h-fit">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    Assign to Colleague
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Request Help
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    Reschedule
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Template
                  </Button>
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Related Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 min-h-[120px]">
                    <div className="p-3 border border-border rounded-lg">
                      <p className="font-medium text-sm">Quarterly VAT Return</p>
                      <p className="text-xs text-muted-foreground">{task.company}</p>
                      <p className="text-xs text-muted-foreground">Due: 2025-09-01</p>
                    </div>
                    <div className="p-3 border border-border rounded-lg">
                      <p className="font-medium text-sm">Board Meeting Minutes</p>
                      <p className="text-xs text-muted-foreground">{task.company}</p>
                      <p className="text-xs text-muted-foreground">Due: 2025-08-15</p>
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
                      Filing Guidelines
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Form Templates
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contact Support
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