"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Tabs, EmptyState, Skeleton } from "@/components/ui";
import { IconCalendar, IconPlus, IconCheck, IconClock, IconClose, IconAlertCircle, IconInbox } from "@/components/icons";

type RequestStatus = "all" | "pending" | "approved" | "rejected";

interface VacationRequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  type: string;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  approver?: string;
  notes?: string;
}

const mockRequests: VacationRequest[] = [
  {
    id: "1",
    startDate: "Dec 20, 2025",
    endDate: "Dec 27, 2025",
    days: 5,
    type: "Vacation",
    status: "pending",
    submittedDate: "Dec 18, 2025",
    approver: "Carlos Rodriguez",
    notes: "Holiday travel",
  },
  {
    id: "2",
    startDate: "Nov 28, 2025",
    endDate: "Nov 29, 2025",
    days: 2,
    type: "Personal",
    status: "approved",
    submittedDate: "Nov 20, 2025",
    approver: "Carlos Rodriguez",
  },
  {
    id: "3",
    startDate: "Oct 15, 2025",
    endDate: "Oct 15, 2025",
    days: 1,
    type: "Sick Leave",
    status: "approved",
    submittedDate: "Oct 15, 2025",
  },
  {
    id: "4",
    startDate: "Sep 5, 2025",
    endDate: "Sep 10, 2025",
    days: 4,
    type: "Vacation",
    status: "rejected",
    submittedDate: "Aug 25, 2025",
    approver: "Carlos Rodriguez",
    notes: "Team coverage insufficient",
  },
];

const statusConfig = {
  pending: { variant: "warning" as const, icon: IconClock, label: "Pending" },
  approved: { variant: "success" as const, icon: IconCheck, label: "Approved" },
  rejected: { variant: "error" as const, icon: IconClose, label: "Rejected" },
};

// Loading State Component
function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Error State Component
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-error-border bg-error/30">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error flex items-center justify-center mb-4">
            <IconAlertCircle className="w-8 h-8 text-error-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load requests</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            We couldn&apos;t load your vacation requests. Please check your connection and try again.
          </p>
          <Button onClick={onRetry}>Try Again</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Request Card Component
function RequestCard({ request }: { request: VacationRequest }) {
  const status = statusConfig[request.status];
  const StatusIcon = status.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <IconCalendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground">{request.type}</h3>
                <Badge variant={status.variant}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-foreground mt-1">
                {request.startDate} - {request.endDate} ({request.days} {request.days === 1 ? "day" : "days"})
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Submitted: {request.submittedDate}
                {request.approver && ` • Approver: ${request.approver}`}
              </p>
              {request.notes && (
                <p className="text-xs text-muted-foreground mt-1 italic">&quot;{request.notes}&quot;</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {request.status === "pending" && (
              <Button variant="ghost" size="sm" className="text-error-foreground hover:bg-error/20">
                Cancel
              </Button>
            )}
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// New Request Modal (simplified inline form)
function NewRequestForm({ onClose }: { onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>New Vacation Request</CardTitle>
          <CardDescription>Submit a new time-off request</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Request Type</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option>Vacation</option>
                <option>Personal</option>
                <option>Sick Leave</option>
                <option>Bereavement</option>
                <option>Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Start Date</label>
                <input
                  type="date"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">End Date</label>
                <input
                  type="date"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Notes (optional)</label>
              <textarea
                rows={3}
                placeholder="Add any relevant details..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                Submit Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VacationsPage() {
  const [activeTab, setActiveTab] = useState<RequestStatus>("all");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const tabs = [
    { id: "all", label: "All Requests", count: mockRequests.length },
    { id: "pending", label: "Pending", count: mockRequests.filter((r) => r.status === "pending").length },
    { id: "approved", label: "Approved", count: mockRequests.filter((r) => r.status === "approved").length },
    { id: "rejected", label: "Rejected", count: mockRequests.filter((r) => r.status === "rejected").length },
  ];

  const filteredRequests = activeTab === "all" 
    ? mockRequests 
    : mockRequests.filter((r) => r.status === activeTab);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  // Demo controls for states
  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const simulateError = () => {
    setHasError(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vacation Requests</h1>
          <p className="text-muted-foreground">Manage your time-off requests</p>
        </div>
        <Button leftIcon={<IconPlus className="w-4 h-4" />} onClick={() => setShowNewRequest(true)}>
          New Request
        </Button>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <IconCheck className="w-5 h-5 text-success-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">Days Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <IconClock className="w-5 h-5 text-warning-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">5</p>
              <p className="text-xs text-muted-foreground">Days Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <IconCalendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">8</p>
              <p className="text-xs text-muted-foreground">Days Used</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo State Controls */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground mb-2">Demo: Simulate UI states</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={simulateLoading}>
            Show Loading
          </Button>
          <Button variant="outline" size="sm" onClick={simulateError}>
            Show Error
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setHasError(false); setIsLoading(false); }}>
            Reset
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as RequestStatus)} />

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : hasError ? (
        <ErrorState onRetry={handleRetry} />
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<IconInbox className="w-12 h-12" />}
              title="No requests found"
              description={
                activeTab === "all"
                  ? "You haven't submitted any vacation requests yet."
                  : `You don't have any ${activeTab} requests.`
              }
              action={
                <Button leftIcon={<IconPlus className="w-4 h-4" />} onClick={() => setShowNewRequest(true)}>
                  New Request
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequest && <NewRequestForm onClose={() => setShowNewRequest(false)} />}
    </div>
  );
}
