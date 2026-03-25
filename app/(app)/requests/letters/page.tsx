"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, EmptyState } from "@/components/ui";
import { Modal, Select, Textarea, Checkbox, DataTable } from "@/components/ui/shared";
import { IconDocument, IconPlus, IconDownload, IconEye, IconCheck, IconClock } from "@/components/icons";

interface EmploymentLetter {
  id: string;
  type: string;
  requestDate: string;
  status: "pending" | "ready" | "expired";
  generatedDate?: string;
  expiresAt?: string;
  downloadUrl?: string;
}

const mockLetters: EmploymentLetter[] = [
  { id: "1", type: "Employment Verification", requestDate: "2026-03-20", status: "pending" },
  { id: "2", type: "Income Verification", requestDate: "2026-03-15", status: "ready", generatedDate: "2026-03-15", expiresAt: "2026-04-15" },
  { id: "3", type: "Employment Verification", requestDate: "2026-02-10", status: "ready", generatedDate: "2026-02-10", expiresAt: "2026-03-10" },
  { id: "4", type: "Work Experience Letter", requestDate: "2026-01-05", status: "expired", generatedDate: "2026-01-05", expiresAt: "2026-02-05" },
];

const letterTypes = [
  { value: "employment", label: "Employment Verification", description: "Confirms your current employment status" },
  { value: "income", label: "Income Verification", description: "Includes salary information" },
  { value: "experience", label: "Work Experience Letter", description: "Details your role and responsibilities" },
  { value: "recommendation", label: "Recommendation Letter", description: "Professional recommendation from HR" },
  { value: "custom", label: "Custom Letter", description: "Request a specific type of letter" },
];

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getStatusBadge = (status: EmploymentLetter["status"]) => {
  switch (status) {
    case "pending": return <Badge variant="warning">Generating...</Badge>;
    case "ready": return <Badge variant="success">Ready</Badge>;
    case "expired": return <Badge variant="error">Expired</Badge>;
  }
};

export default function EmploymentLettersPage() {
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<EmploymentLetter | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    type: "",
    includeIncome: false,
    includePosition: true,
    includeDates: true,
    additionalInfo: "",
    recipientName: "",
  });

  const handleSubmit = () => {
    setShowNewRequest(false);
    setShowSuccess(true);
    // Reset form
    setFormData({
      type: "",
      includeIncome: false,
      includePosition: true,
      includeDates: true,
      additionalInfo: "",
      recipientName: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employment Letters</h1>
          <p className="text-muted-foreground">Request and download employment verification letters</p>
        </div>
        <Button leftIcon={<IconPlus className="w-4 h-4" />} onClick={() => setShowNewRequest(true)}>
          Request Letter
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-info border-info-border">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-info-foreground/20">
              <IconDocument className="w-5 h-5 text-info-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">About Employment Letters</p>
              <p className="text-sm text-muted-foreground mt-1">
                Letters are typically generated within 24-48 business hours. Documents are valid for 30 days from generation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Letters History */}
      <Card>
        <CardHeader>
          <CardTitle>My Letters</CardTitle>
          <CardDescription>Your requested employment letters</CardDescription>
        </CardHeader>
        <CardContent>
          {mockLetters.length === 0 ? (
            <EmptyState
              icon={<IconDocument className="w-12 h-12" />}
              title="No letters yet"
              description="Request your first employment letter"
              action={
                <Button onClick={() => setShowNewRequest(true)}>
                  Request Letter
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {mockLetters.map((letter) => (
                <div
                  key={letter.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      letter.status === "ready" ? "bg-success" : letter.status === "pending" ? "bg-warning" : "bg-muted"
                    }`}>
                      {letter.status === "ready" ? (
                        <IconCheck className="w-6 h-6 text-success-foreground" />
                      ) : letter.status === "pending" ? (
                        <IconClock className="w-6 h-6 text-warning-foreground" />
                      ) : (
                        <IconDocument className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{letter.type}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested: {formatDate(letter.requestDate)}
                        {letter.expiresAt && ` • Expires: ${formatDate(letter.expiresAt)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(letter.status)}
                    {letter.status === "ready" && (
                      <Button size="sm" leftIcon={<IconDownload className="w-4 h-4" />}>
                        Download
                      </Button>
                    )}
                    {letter.status === "expired" && (
                      <Button variant="outline" size="sm" onClick={() => setShowNewRequest(true)}>
                        Request New
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Request Modal */}
      <Modal
        isOpen={showNewRequest}
        onClose={() => setShowNewRequest(false)}
        title="Request Employment Letter"
        description="Select the type of letter you need"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowNewRequest(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.type}>
              Submit Request
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Letter Type Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Letter Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {letterTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    formData.type === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <p className="font-medium text-foreground">{type.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          {formData.type && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Include in Letter</label>
                <div className="space-y-3">
                  <Checkbox
                    checked={formData.includePosition}
                    onChange={(v) => setFormData({ ...formData, includePosition: v })}
                    label="Current Position & Department"
                    description="Include your job title and department"
                  />
                  <Checkbox
                    checked={formData.includeDates}
                    onChange={(v) => setFormData({ ...formData, includeDates: v })}
                    label="Employment Dates"
                    description="Include your start date and tenure"
                  />
                  {(formData.type === "income" || formData.type === "custom") && (
                    <Checkbox
                      checked={formData.includeIncome}
                      onChange={(v) => setFormData({ ...formData, includeIncome: v })}
                      label="Salary Information"
                      description="Include your current compensation"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Addressed To (optional)
                </label>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="e.g., Bank Name, Embassy, etc."
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {formData.type === "custom" && (
                <Textarea
                  label="Additional Information"
                  placeholder="Describe what you need included in the letter..."
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                />
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Request Submitted"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-success mx-auto flex items-center justify-center mb-4">
            <IconCheck className="w-8 h-8 text-success-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Request Received</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Your employment letter will be ready within 24-48 business hours. We&apos;ll notify you when it&apos;s available for download.
          </p>
          <Button onClick={() => setShowSuccess(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
