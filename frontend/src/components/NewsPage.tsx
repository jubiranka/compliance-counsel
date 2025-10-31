import React from 'react';
import Navigation from './Navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { TrendingUp, Calendar, ArrowLeft } from 'lucide-react';

interface NewsPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export default function NewsPage({ onNavigate, onLogout }: NewsPageProps) {
  const allNewsItems = [
    {
      id: 1,
      title: 'New Corporate Governance Guidelines Released',
      summary: 'Updated compliance requirements for public companies effective from August 2025. Key changes include enhanced director independence requirements and expanded disclosure obligations.',
      content: 'The Ministry of Corporate Affairs has released comprehensive new guidelines for corporate governance that will significantly impact public companies. These guidelines emphasize transparency, accountability, and stakeholder protection...',
      date: '2025-07-22',
      category: 'Regulatory Update',
      importance: 'high'
    },
    {
      id: 2,
      title: 'Changes to Annual Filing Deadlines',
      summary: 'Important updates to statutory filing requirements for financial year 2025-26.',
      content: 'Companies House has announced revised deadlines for annual filings. The new timeline provides additional 15 days for small companies to submit their annual returns...',
      date: '2025-07-20',
      category: 'Filing Requirements',
      importance: 'medium'
    },
    {
      id: 3,
      title: 'Digital Transformation in Corporate Compliance',
      summary: 'Best practices for modernizing compliance processes using technology.',
      content: 'A comprehensive guide on how companies can leverage technology to streamline their compliance processes. This includes automation tools, digital document management...',
      date: '2025-07-18',
      category: 'Best Practices',
      importance: 'low'
    },
    {
      id: 4,
      title: 'New Director Disqualification Rules',
      summary: 'Enhanced criteria for director disqualification cases under the Companies Act.',
      content: 'The government has introduced stricter rules for director disqualification proceedings. These changes aim to strengthen corporate accountability...',
      date: '2025-07-15',
      category: 'Legal Update',
      importance: 'high'
    },
    {
      id: 5,
      title: 'Tax Implications of Digital Assets',
      summary: 'Guidance on compliance requirements for companies dealing with cryptocurrency and digital assets.',
      content: 'With the growing adoption of digital assets, companies need to understand the compliance implications. This includes reporting requirements, tax obligations...',
      date: '2025-07-10',
      category: 'Tax Update',
      importance: 'medium'
    },
    {
      id: 6,
      title: 'Environmental Compliance Reporting',
      summary: 'New sustainability reporting requirements for large corporations.',
      content: 'Companies with annual turnover exceeding Rs. 1000 crores are now required to submit detailed environmental impact reports...',
      date: '2025-07-08',
      category: 'Environmental',
      importance: 'medium'
    }
  ];

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge variant="default">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return <Badge variant="outline">General</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Regulatory Update':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Filing Requirements':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Legal Update':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Tax Update':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Environmental':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation currentPage="news" onNavigate={onNavigate} onLogout={onLogout} />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center">
            <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Regulatory News</h1>
              <p className="text-muted-foreground mt-2">
                Stay updated with the latest compliance and regulatory developments.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {allNewsItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getCategoryColor(item.category)}`}>
                              {item.category}
                            </span>
                            {getImportanceBadge(item.importance)}
                          </div>
                          <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-4 w-4" />
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{item.summary}</p>
                      <p className="text-sm mb-4 line-clamp-3">{item.content}</p>
                      <Button variant="outline" size="sm">
                        Read Full Article
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['Regulatory Update', 'Filing Requirements', 'Legal Update', 'Tax Update', 'Environmental', 'Best Practices'].map((category) => (
                      <Button key={category} variant="ghost" className="w-full justify-start text-left">
                        <span className={`w-3 h-3 rounded-full mr-2 ${getCategoryColor(category).split(' ')[1]}`}></span>
                        {category}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>News Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get notified about important regulatory updates.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      Subscribe to Alerts
                    </Button>
                    <Button variant="ghost" className="w-full">
                      Manage Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Archive</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start">
                      July 2025
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      June 2025
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      May 2025
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      View All Archives
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