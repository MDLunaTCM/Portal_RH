"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Tabs, EmptyState } from "@/components/ui";
import { Modal, Select, Textarea, FileUpload, Timeline } from "@/components/ui/shared";
import { IconIdCard, IconPlus, IconCar, IconEye, IconClock, IconCheck, IconAlertCircle } from "@/components/icons";

interface CardRequest {
  id: string;
  type: "badge" | "parking" | "access";
  reason: string;
  status: "pending" | "approved" | "in_production" | "ready" | "delivered" | "rejected";
  requestDate: string;
  estimatedDate?: string;
  notes?: string;
}

const mockRequests: CardRequest[] = [
  { id: "1", type: "badge", reason: "Lost", status: "in_production", requestDate: "2026-03-18", estimatedDate: "2026-03-28" },
  { id: "2", type: "parking", reason: "New Vehicle", status: "pending", requestDate: "2026-03-20" },
  { id: "3", type: "badge", reason: "Damaged", status: "delivered", requestDate: "2026-02-01", estimatedDate: "2026-02-10" },
  { id: "4", type: "access", reason: "Department Change", status: "approved", requestDate: "2026-03-15" },
];

const cardTypes = [
  { value: "badge", label: "ID Badge", icon: IconIdCard, description: "Employee identification card" },
  { value: "parking", label: "Parking Card", icon: IconCar, description: "Vehicle access for parking lot" },
  { value: "access", label: "Access Card", icon: IconIdCard, description: "Building/area access card" },
];

const reasonOptions = [
  { value: "lost", label: "Lost" },
  { value: "stolen", label: "Stolen" },
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "new_vehicle", label: "New Vehicle (Parking only)" },
  { value: "department_change", label: "Department/Area Change" },
  { value: "name_change", label: "Name Change" },
  { value: "first_time", label: "First Time Request" },
];

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const getStatusBadge = (status: CardRequest["status"]) => {
  switch (status) {
    case "pending": return <Badge variant="warning">Pending Review</Badge>;
    case "approved": return <Badge variant="info">Approved</Badge>;
    case "in_production": return <Badge variant="info">In Production</Badge>;
    case "ready": return <Badge variant="success">Ready for Pickup</Badge>;
    case "delivered": return <Badge variant="success">Delivered</Badge>;
    case "rejected": return <Badge variant="error">Rejected</Badge>;
  }
};

const getTypeIcon = (type: CardRequest["type"]) => {
  switch (type) {
    case "badge": return <IconIdCard className="w-6 h-6" />;
    case "parking": return <IconCar className="w-6 h-6" />;
    case "access": return <IconIdCard className="w-6 h-6" />;
  }
};

const getTypeName = (type: CardRequest["type"]) => {
  switch (type) {
    case "badge": return "ID Badge";
    case "parking": return "Parking Card";
    case "access": return "Access Card";
  }
};

export default function CardReplacementsPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CardRequest | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    type: "",
    reason: "",
    details: "",
    files: [] as File[],
  });

  const activeRequests = mockRequests.filter((r) => !["delivered", "rejected"].includes(r.status));
  const historyRequests = mockRequests.filter((r) => ["delivered", "rejected"].includes(r.status));

  const tabs = [
    { id: "active", label: "Active Requests", count: activeRequests.length },
    { id: "history", label: "History", count: historyRequests.length },
  ];

  const currentRequests = activeTab === "active" ? activeRequests : historyRequests;

  const getTimelineItems = (request: CardRequest) => {
    const items = [
      { id: "1", title: "Request Submitted", date: formatDate(request.requestDate), status: "completed" as const },
    ];

    if (request.status !== "pending") {
      items.push({ id: "2", title: "Approved by HR", date: formatDate(request.requestDate), status: "completed" as const });
    } else {
      items.push({ id: "2", title: "Pending HR Review", date: "Waiting", status: "current" as const });
      return items;
    }

    if (["in_production", "ready", "delivered"].includes(request.status)) {
      items.push({ id: "3", title: "In Production", date: formatDate(request.requestDate), status: "completed" as const });
    } else if (request.status === "approved") {
      items.push({ id: "3", title: "Pending Production", date: "Waiting", status: "current" as const });
      return items;
    }

    if (["ready", "delivered"].includes(request.status)) {
      items.push({ id: "4", title: "Ready for Pickup", date: request.estimatedDate ? formatDate(request.estimatedDate) : "Ready", status: "completed" as const });
    } else if (request.status === "in_production") {
      items.push({ id: "4", title: "Ready for Pickup", date: request.estimatedDate ? `Est. ${formatDate(request.estimatedDate)}` : "Processing", status: "current" as const });
      return items;
    }

    if (request.status === "delivered") {
      items.push({ id: "5", title: "Delivered", date: formatDate(request.estimatedDate || request.requestDate), status: "completed" as const });
    }

    if (request.status === "rejected") {
      return [
        { id: "1", title: "Request Submitted", date: formatDate(request.requestDate), status: "completed" as const },
        { id: "2", title: "Rejected", description: request.notes || "Request was not approved", date: formatDate(request.requestDate), status: "rejected" as const },
      ];
    }

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Card Replacements</h1>
          <p className="text-muted-foreground">Request badge, parking, and access card replacements</p>
        </div>
        <Button leftIcon={<IconPlus className="w-4 h-4" />} onClick={() => setShowNewRequest(true)}>
          New Request
        </Button>
      </div>

      {/* Current Cards Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success">
                <IconIdCard className="w-6 h-6 text-success-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID Badge</p>
                <p className="font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Expires: Dec 2026</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success">
                <IconCar className="w-6 h-6 text-success-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parking Card</p>
                <p className="font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Lot B - Space 142</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning">
                <IconAlertCircle className="w-6 h-6 text-warning-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Access Card</p>
                <p className="font-medium text-foreground">Pending Update</p>
                <p className="text-xs text-muted-foreground">New area access requested</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Requests List */}
      <Card>
        <CardContent className="p-0">
          {currentRequests.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<IconIdCard className="w-12 h-12" />}
                title={activeTab === "active" ? "No active requests" : "No history yet"}
                description={activeTab === "active" ? "You don't have any pending card requests" : "Your completed requests will appear here"}
                action={
                  activeTab === "active" ? (
                    <Button onClick={() => setShowNewRequest(true)}>New Request</Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {currentRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      {getTypeIcon(request.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{getTypeName(request.type)}</p>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reason: {request.reason} • Requested: {formatDate(request.requestDate)}
                      </p>
                      {request.estimatedDate && request.status === "in_production" && (
                        <p className="text-xs text-info-foreground mt-1">
                          Estimated ready: {formatDate(request.estimatedDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <IconEye className="w-4 h-4" />
                  </Button>
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
        title="New Card Request"
        description="Request a replacement or new card"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowNewRequest(false)}>
              Cancel
            </Button>
            <Button disabled={!formData.type || !formData.reason}>
              Submit Request
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Card Type Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Card Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {cardTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      formData.type === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                      formData.type === type.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className="font-medium text-foreground">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {formData.type && (
            <>
              <Select
                label="Reason for Request"
                options={reasonOptions}
                value={formData.reason}
                onChange={(v) => setFormData({ ...formData, reason: v })}
                placeholder="Select a reason..."
              />

              <Textarea
                label="Additional Details"
                placeholder="Provide any additional information that might be helpful..."
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              />

              {["lost", "stolen", "damaged"].includes(formData.reason) && (
                <FileUpload
                  label="Supporting Evidence (optional)"
                  helperText="Upload photos or documents if applicable (police report, damaged card photo)"
                  accept="image/*,.pdf"
                  multiple
                  onFilesSelected={(files) => setFormData({ ...formData, files })}
                />
              )}

              {formData.type === "parking" && formData.reason === "new_vehicle" && (
                <div className="p-4 rounded-lg bg-info border border-info-border">
                  <p className="text-sm text-info-foreground">
                    For new vehicle registration, please have your vehicle registration document ready. You may be asked to provide it.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Request Detail Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Request Details"
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {getTypeIcon(selectedRequest.type)}
              </div>
              <div>
                <p className="font-semibold text-foreground">{getTypeName(selectedRequest.type)}</p>
                <p className="text-sm text-muted-foreground">Reason: {selectedRequest.reason}</p>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4">Request Timeline</h4>
              <Timeline items={getTimelineItems(selectedRequest)} />
            </div>

            {/* Actions */}
            {selectedRequest.status === "ready" && (
              <div className="p-4 rounded-lg bg-success border border-success-border">
                <div className="flex items-center gap-3">
                  <IconCheck className="w-5 h-5 text-success-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Ready for Pickup</p>
                    <p className="text-sm text-muted-foreground">
                      Please visit the HR office with your ID to collect your new card.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedRequest.status === "pending" && (
              <Button variant="danger" className="w-full">
                Cancel Request
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
