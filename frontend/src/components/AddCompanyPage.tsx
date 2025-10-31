import React, { useEffect, useState } from "react";
import Navigation from "./Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { createCompany, updateCompany } from "../api/companies";
import { toast } from "sonner";

interface AddCompanyPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  editData?: any;
}

export default function AddCompanyPage({
  onNavigate,
  onLogout,
  editData,
}: AddCompanyPageProps) {
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    status: "",
    cinNumber: "",
    authorizedCapital: "",
    paidUpCapital: "",
    industry: "",
    registrationDate: "",
    directorName: "",
    directorEmail: "",
    companySecretary: "",
    auditorName: "",
    notes: "",
  });

  // ✅ Prefill data when editing
  useEffect(() => {
    if (editData) {
      setIsEditMode(true);
      setFormData({
        companyName: editData.name || "",
        companyAddress: editData.address || "",
        status: editData.status || "",
        cinNumber: editData.cin_number || "",
        authorizedCapital: editData.authorized_capital || "",
        paidUpCapital: editData.paid_up_capital || "",
        industry: editData.industry || "",
        registrationDate: editData.registration_date || "",
        directorName: editData.director_name || "",
        directorEmail: editData.director_email || "",
        companySecretary: editData.company_secretary || "",
        auditorName: editData.auditor_name || "",
        notes: editData.notes || "",
      });
    }
  }, [editData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ Submit logic with proper DB field mapping
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName.trim()) {
      toast.error("Company name is required!");
      return;
    }

    const payload = {
      name: formData.companyName.trim(),
      address: formData.companyAddress.trim() || null,
      status: formData.status || null,
      cin_number: formData.cinNumber || null,
      authorized_capital: Number(formData.authorizedCapital) || null,
      paid_up_capital: Number(formData.paidUpCapital) || null,
      industry: formData.industry || null,
      registration_date: formData.registrationDate || null,
      director_name: formData.directorName || null,
      director_email: formData.directorEmail || null,
      company_secretary: formData.companySecretary || null,
      auditor_name: formData.auditorName || null,
      notes: formData.notes || null,
    };

    setLoading(true);
    try {
      if (isEditMode && editData?.id) {
        await updateCompany(editData.id, payload);
        toast.success(`✅ ${payload.name} updated successfully!`);
      } else {
        await createCompany(payload);
        toast.success(`✅ ${payload.name} added successfully!`);
      }
      setTimeout(() => onNavigate("companies"), 1200);
    } catch (err: any) {
      toast.error(err.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation
        currentPage="companies"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 🔹 Header Section */}
          <div className="mb-8 flex items-center">
            <Button
              variant="ghost"
              onClick={() => onNavigate("companies")}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Companies
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isEditMode ? "Edit Company" : "Add New Company"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isEditMode
                  ? "Update company details and compliance information."
                  : "Enter the company details to start managing compliance."}
              </p>
            </div>
          </div>

          {/* 🔹 Form Section */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) =>
                        handleInputChange("companyName", e.target.value)
                      }
                      placeholder="Enter company name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Company Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private Limited</SelectItem>
                        <SelectItem value="public">Public Limited</SelectItem>
                        <SelectItem value="llp">
                          Limited Liability Partnership
                        </SelectItem>
                        <SelectItem value="opc">One Person Company</SelectItem>
                        <SelectItem value="section8">
                          Section 8 Company
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) =>
                        handleInputChange("industry", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="manufacturing">
                          Manufacturing
                        </SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="construction">
                          Construction
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationDate">Registration Date</Label>
                    <Input
                      id="registrationDate"
                      type="date"
                      value={formData.registrationDate}
                      onChange={(e) =>
                        handleInputChange("registrationDate", e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Legal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Legal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cinNumber">CIN Number *</Label>
                    <Input
                      id="cinNumber"
                      value={formData.cinNumber}
                      onChange={(e) =>
                        handleInputChange("cinNumber", e.target.value)
                      }
                      placeholder="e.g., U12345DL2020PTC123456"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authorizedCapital">
                      Authorized Share Capital *
                    </Label>
                    <Input
                      id="authorizedCapital"
                      value={formData.authorizedCapital}
                      onChange={(e) =>
                        handleInputChange("authorizedCapital", e.target.value)
                      }
                      placeholder="e.g., 10,00,000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paidUpCapital">Paid-Up Capital *</Label>
                    <Input
                      id="paidUpCapital"
                      value={formData.paidUpCapital}
                      onChange={(e) =>
                        handleInputChange("paidUpCapital", e.target.value)
                      }
                      placeholder="e.g., 1,00,000"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Address Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Registered Address *</Label>
                    <Textarea
                      id="companyAddress"
                      value={formData.companyAddress}
                      onChange={(e) =>
                        handleInputChange("companyAddress", e.target.value)
                      }
                      placeholder="Enter complete registered address"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Key Personnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Personnel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="directorName">Managing Director</Label>
                    <Input
                      id="directorName"
                      value={formData.directorName}
                      onChange={(e) =>
                        handleInputChange("directorName", e.target.value)
                      }
                      placeholder="Director name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="directorEmail">Director Email</Label>
                    <Input
                      id="directorEmail"
                      type="email"
                      value={formData.directorEmail}
                      onChange={(e) =>
                        handleInputChange("directorEmail", e.target.value)
                      }
                      placeholder="director@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySecretary">Company Secretary</Label>
                    <Input
                      id="companySecretary"
                      value={formData.companySecretary}
                      onChange={(e) =>
                        handleInputChange("companySecretary", e.target.value)
                      }
                      placeholder="Company secretary name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auditorName">Auditor</Label>
                    <Input
                      id="auditorName"
                      value={formData.auditorName}
                      onChange={(e) =>
                        handleInputChange("auditorName", e.target.value)
                      }
                      placeholder="Auditor/Firm name"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any additional information or special requirements"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate("companies")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  isEditMode ? (
                    "Updating..."
                  ) : (
                    "Adding..."
                  )
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditMode ? "Update Company" : "Add Company"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
