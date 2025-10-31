import React, { useState } from 'react';
import Navigation from './Navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, ArrowLeft, File, FileText, AlertCircle } from 'lucide-react';

interface UploadDocumentPageProps {
  onNavigate: (page: string, data?: any) => void;
  onLogout?: () => void;
  selectedCompany?: string;
}

export default function UploadDocumentPage({ onNavigate, onLogout, selectedCompany }: UploadDocumentPageProps) {
  const [documentData, setDocumentData] = useState({
    name: '',
    type: '',
    company: selectedCompany || '',
    category: '',
    description: '',
    file: null as File | null
  });

  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setDocumentData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setDocumentData(prev => ({ ...prev, file }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = () => {
    console.log('Uploading document:', documentData);
    // Navigate back to companies page after upload
    onNavigate('companies');
  };

  return (
    <div className="min-h-screen">
      <Navigation currentPage="companies" onNavigate={onNavigate} onLogout={onLogout} />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => onNavigate('companies')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Companies
            </Button>
            <h1 className="text-3xl font-bold">Upload Document</h1>
            <p className="text-muted-foreground mt-2">
              Add a new document to your company's document library.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Document Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>Document File</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {documentData.file ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{documentData.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(documentData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">Drop your document here</p>
                      <p className="text-muted-foreground mb-4">or</p>
                      <Button variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
                        Browse Files
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        Supports PDF, DOC, DOCX, XLS, XLSX (max 10MB)
                      </p>
                    </div>
                  )}
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* Document Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentName">Document Name</Label>
                  <Input
                    id="documentName"
                    value={documentData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter document name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type</Label>
                  <Select value={documentData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certificate">Certificate of Incorporation</SelectItem>
                      <SelectItem value="memorandum">Memorandum of Association</SelectItem>
                      <SelectItem value="articles">Articles of Association</SelectItem>
                      <SelectItem value="resolution">Board Resolution</SelectItem>
                      <SelectItem value="return">Annual Return</SelectItem>
                      <SelectItem value="accounts">Financial Statements</SelectItem>
                      <SelectItem value="minutes">Meeting Minutes</SelectItem>
                      <SelectItem value="agreement">Legal Agreement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company</Label>
                  <Select value={documentData.company} onValueChange={(value) => handleInputChange('company', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TechCorp Ltd">TechCorp Ltd</SelectItem>
                      <SelectItem value="Global Solutions Inc">Global Solutions Inc</SelectItem>
                      <SelectItem value="StartupCo">StartupCo</SelectItem>
                      <SelectItem value="Manufacturing Corp">Manufacturing Corp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={documentData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="statutory">Statutory Documents</SelectItem>
                      <SelectItem value="governance">Corporate Governance</SelectItem>
                      <SelectItem value="financial">Financial Documents</SelectItem>
                      <SelectItem value="legal">Legal Documents</SelectItem>
                      <SelectItem value="operational">Operational Documents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={documentData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Add any additional notes or description for this document"
                  rows={3}
                />
              </div>

              {/* Compliance Alert */}
              <div className="flex items-start space-x-3 p-4 bg-secondary/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Document Compliance</p>
                  <p className="text-sm text-muted-foreground">
                    Ensure this document meets regulatory requirements and contains all necessary information. 
                    Some documents may need to be filed with Companies House or other regulatory bodies.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => onNavigate('companies')}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!documentData.file || !documentData.name || !documentData.type || !documentData.company}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}