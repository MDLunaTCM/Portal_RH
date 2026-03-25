"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Tabs, EmptyState } from "@/components/ui";
import { Modal, Select, SearchInput, DataTable } from "@/components/ui/shared";
import { IconWallet, IconDownload, IconEye, IconFileText, IconCalendar } from "@/components/icons";

interface PayrollReceipt {
  id: string;
  period: string;
  payDate: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: "paid" | "pending" | "processing";
  type: "regular" | "bonus" | "aguinaldo" | "settlement";
  hasXml: boolean;
  hasPdf: boolean;
}

const mockReceipts: PayrollReceipt[] = [
  { id: "1", period: "March 2026 - 2nd", payDate: "2026-03-31", grossPay: 45000, deductions: 8500, netPay: 36500, status: "pending", type: "regular", hasXml: false, hasPdf: false },
  { id: "2", period: "March 2026 - 1st", payDate: "2026-03-15", grossPay: 45000, deductions: 8500, netPay: 36500, status: "paid", type: "regular", hasXml: true, hasPdf: true },
  { id: "3", period: "February 2026 - 2nd", payDate: "2026-02-28", grossPay: 45000, deductions: 8500, netPay: 36500, status: "paid", type: "regular", hasXml: true, hasPdf: true },
  { id: "4", period: "February 2026 - 1st", payDate: "2026-02-15", grossPay: 45000, deductions: 8500, netPay: 36500, status: "paid", type: "regular", hasXml: true, hasPdf: true },
  { id: "5", period: "January 2026 - 2nd", payDate: "2026-01-31", grossPay: 45000, deductions: 8500, netPay: 36500, status: "paid", type: "regular", hasXml: true, hasPdf: true },
  { id: "6", period: "December 2025 - Aguinaldo", payDate: "2025-12-20", grossPay: 22500, deductions: 2800, netPay: 19700, status: "paid", type: "aguinaldo", hasXml: true, hasPdf: true },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

const getStatusBadge = (status: PayrollReceipt["status"]) => {
  switch (status) {
    case "paid": return <Badge variant="success">Paid</Badge>;
    case "pending": return <Badge variant="warning">Pending</Badge>;
    case "processing": return <Badge variant="info">Processing</Badge>;
  }
};

const getTypeBadge = (type: PayrollReceipt["type"]) => {
  switch (type) {
    case "regular": return <Badge variant="outline">Regular</Badge>;
    case "bonus": return <Badge variant="info">Bonus</Badge>;
    case "aguinaldo": return <Badge variant="success">Aguinaldo</Badge>;
    case "settlement": return <Badge variant="warning">Settlement</Badge>;
  }
};

// Receipt Detail Drawer Content
function ReceiptDetail({ receipt, onClose }: { receipt: PayrollReceipt; onClose: () => void }) {
  const earnings = [
    { concept: "Base Salary", amount: 40000 },
    { concept: "Food Vouchers", amount: 3000 },
    { concept: "Transportation", amount: 2000 },
  ];
  
  const deductions = [
    { concept: "IMSS", amount: 2500 },
    { concept: "ISR", amount: 5200 },
    { concept: "Savings Fund", amount: 800 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-lg bg-primary text-primary-foreground">
        <p className="text-sm opacity-80">Net Pay</p>
        <p className="text-3xl font-bold">{formatCurrency(receipt.netPay)}</p>
        <p className="text-sm opacity-80 mt-1">{receipt.period}</p>
      </div>

      {/* Status & Date */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-1">{getStatusBadge(receipt.status)}</div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Pay Date</p>
          <p className="text-sm font-medium text-foreground">{formatDate(receipt.payDate)}</p>
        </div>
      </div>

      {/* Earnings */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Earnings</h4>
        <div className="space-y-2">
          {earnings.map((item, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{item.concept}</span>
              <span className="text-sm font-medium text-success-foreground">+{formatCurrency(item.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-medium">
            <span className="text-foreground">Total Earnings</span>
            <span className="text-foreground">{formatCurrency(receipt.grossPay)}</span>
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Deductions</h4>
        <div className="space-y-2">
          {deductions.map((item, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{item.concept}</span>
              <span className="text-sm font-medium text-error-foreground">-{formatCurrency(item.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-medium">
            <span className="text-foreground">Total Deductions</span>
            <span className="text-error-foreground">-{formatCurrency(receipt.deductions)}</span>
          </div>
        </div>
      </div>

      {/* Net Pay Summary */}
      <div className="p-4 rounded-lg bg-success border border-success-border">
        <div className="flex justify-between items-center">
          <span className="font-medium text-foreground">Net Pay</span>
          <span className="text-xl font-bold text-success-foreground">{formatCurrency(receipt.netPay)}</span>
        </div>
      </div>

      {/* Download Actions */}
      <div className="space-y-3">
        <Button 
          variant="primary" 
          className="w-full" 
          leftIcon={<IconDownload className="w-4 h-4" />}
          disabled={!receipt.hasPdf}
        >
          Download PDF
        </Button>
        <Button 
          variant="outline" 
          className="w-full" 
          leftIcon={<IconFileText className="w-4 h-4" />}
          disabled={!receipt.hasXml}
        >
          Download XML (CFDI)
        </Button>
      </div>
    </div>
  );
}

export default function PayrollReceiptsPage() {
  const [selectedReceipt, setSelectedReceipt] = useState<PayrollReceipt | null>(null);
  const [yearFilter, setYearFilter] = useState("2026");
  const [monthFilter, setMonthFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const years = [
    { value: "2026", label: "2026" },
    { value: "2025", label: "2025" },
    { value: "2024", label: "2024" },
  ];

  const months = [
    { value: "", label: "All Months" },
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const filteredReceipts = mockReceipts.filter((receipt) => {
    const matchesYear = receipt.payDate.startsWith(yearFilter);
    const matchesMonth = !monthFilter || receipt.payDate.substring(5, 7) === monthFilter;
    const matchesSearch = receipt.period.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesMonth && matchesSearch;
  });

  // Calculate totals
  const totalNetPay = filteredReceipts
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.netPay, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payroll Receipts</h1>
        <p className="text-muted-foreground">View and download your payroll receipts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <IconWallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">YTD Net Pay</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalNetPay)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/50">
                <IconFileText className="w-6 h-6 text-success-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receipts Available</p>
                <p className="text-xl font-bold text-foreground">{filteredReceipts.filter((r) => r.status === "paid").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/50">
                <IconCalendar className="w-6 h-6 text-warning-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Pay Date</p>
                <p className="text-xl font-bold text-foreground">Mar 31</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Receipt History</CardTitle>
              <CardDescription>All your payroll receipts</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                options={years}
                value={yearFilter}
                onChange={setYearFilter}
                className="w-full sm:w-28"
              />
              <Select
                options={months}
                value={monthFilter}
                onChange={setMonthFilter}
                className="w-full sm:w-36"
              />
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search..."
                className="w-full sm:w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <EmptyState
              icon={<IconWallet className="w-12 h-12" />}
              title="No receipts found"
              description="No payroll receipts match your filters"
            />
          ) : (
            <div className="space-y-3">
              {filteredReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  onClick={() => setSelectedReceipt(receipt)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <IconFileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{receipt.period}</p>
                        {getTypeBadge(receipt.type)}
                      </div>
                      <p className="text-sm text-muted-foreground">Pay date: {formatDate(receipt.payDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8">
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-foreground">{formatCurrency(receipt.netPay)}</p>
                      <p className="text-xs text-muted-foreground">Net pay</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(receipt.status)}
                      <Button variant="ghost" size="sm">
                        <IconEye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Detail Modal */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Receipt Details"
        size="md"
      >
        {selectedReceipt && (
          <ReceiptDetail receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
        )}
      </Modal>
    </div>
  );
}
