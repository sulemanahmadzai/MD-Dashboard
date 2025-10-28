"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useCSVStatus } from "@/lib/hooks/use-csv-data";
import { useUser } from "@/lib/hooks/use-user";
import { clearCache } from "@/lib/cache";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface UploadStatus {
  shopify: boolean;
  tiktok: boolean;
  subscription: boolean;
  pl_client1: boolean;
  pl_client2: boolean;
  sgd_transactions: boolean;
  usd_transactions: boolean;
}

export default function DataUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [currentUpload, setCurrentUpload] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const router = useRouter();

  // Use React Query hooks for user and CSV status
  const { data: session, isLoading: isLoadingUser } = useUser();
  const { data: uploadStatus, refetch: refetchStatus } = useCSVStatus();

  // Default status while loading
  const status = uploadStatus || {
    shopify: false,
    tiktok: false,
    subscription: false,
    pl_client1: false,
    pl_client2: false,
    sgd_transactions: false,
    usd_transactions: false,
  };

  useEffect(() => {
    // Redirect if not admin
    if (!isLoadingUser && session && session.role !== "admin") {
      router.push("/unauthorized");
    }
  }, [session, isLoadingUser, router]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Invalid file type", {
        description: `Please upload a valid CSV file for ${fileType}`,
      });
      return;
    }

    setUploading(true);
    setCurrentUpload(fileType);

    try {
      const Papa = await import("papaparse");
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

      // Upload to backend
      const response = await fetch("/api/csv-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType,
          data: parsed.data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const responseData = await response.json();

      // Clear cache and refetch status
      clearCache("csv-data");
      clearCache("csv-status");

      // Clear client2 dedicated cache if client2 data was uploaded
      if (
        fileType === "pl_client2" ||
        fileType === "sgd_transactions" ||
        fileType === "usd_transactions"
      ) {
        clearCache("csv-data-client2");
      }

      refetchStatus();

      // Auto-assign classifications for pl_client2 using predefined mappings
      if (
        fileType === "pl_client2" &&
        responseData.extractedCategories?.length > 0
      ) {
        // Predefined classification mappings
        const predefinedClassifications: Record<string, string> = {
          // ADNA Research classifications
          "Other Revenue": "Other Revenue",
          "Research Revenue - Qualitative": "Qual Revenue",
          "Research Revenue - Quantitative": "Quant Revenue",
          "Research Costs (Qual)": "Cost of Sales (Qual)",
          "Research Costs (Quant)": "Cost of Sales (Quant)",
          "Translation Costs": "Cost of Sales (Quant)",
          Others: "Cost of Sales (Other)",
          "AWS (Server Costs)": "Cost of Sales",
          Advertising: "Admin Cost",
          "Bank Fees": "Admin Cost",
          "Bank Revaluations": "Admin Cost",
          "Consulting & Accounting": "Admin Cost",
          "Corporate Secretarial Fees": "Admin Cost",
          Entertainment: "Admin Cost",
          "Freight & Courier": "Admin Cost",
          "General Expenses": "Admin Cost",
          "Legal expenses": "Admin Cost",
          "Office Expenses": "Admin Cost",
          "Printing & Stationery": "Admin Cost",
          "Realised Currency Gains": "Admin Cost",
          Depreciation: "Admin Cost",
          "Stripe Fees T": "Admin Cost",
          Subscriptions: "Admin Cost",
          "Travel - International": "Admin Cost",
          "Travel - National": "Admin Cost",
          "Unrealised Currency Gains": "Admin Cost",
          Website: "Admin Cost",
          Server: "Admin Cost",
          "CDAC/SINDA/MENDAKI/Others": "Employment Cost",
          Commission: "Employment Cost",
          "CPF - Indirect Team": "Employment Cost",
          "CPF - Research Team": "Employment Cost",
          "Employee SDL": "Employment Cost",
          Insurance: "Employment Cost",
          "Salaries - Indirect Team": "Employment Cost",
          "Salaries - Research Team": "Employment Cost",
          "Salaries - Tech Team": "Employment Cost",
          "Salaries - Sales and Marketing": "Employment Cost",
          "Salaries - Account Servicing": "Employment Cost",
          Bonuses: "Employment Cost",
          Senor: "Employment Cost",
          "Interest Expense": "Financing Cost",

          // E-commerce classifications (if Client2 also uses this data)
          "Shopify Sales": "Other Revenue",
          "Shopify Discounts": "Other Revenue",
          "Shopify Refunds": "Other Revenue",
          "Shopify Shipping Income": "Other Revenue",
          "TikTok Sales": "Other Revenue",
          "TikTok Discounts": "Other Revenue",
          "TikTok Refunds": "Other Revenue",
          "TikTok Shipping Income": "Other Revenue",
          "Cost of Goods Sold": "Cost of Sales",
          "Shopify Fees": "Admin Cost",
          "TikTok Commissions": "Admin Cost",
          "Dolphin International": "Cost of Sales",
          Shippo: "Cost of Sales",
          "TikTok Shipping": "Cost of Sales",
          "Shipping Supplies - COS": "Cost of Sales",
          "Advertising & Marketing": "Admin Cost",
          "Computer and Software Expenses": "Admin Cost",
          Contractors: "Admin Cost",
          "Cash back": "Other Revenue",
          "Interest Income": "Other Revenue",
          "Automobile Expenses": "Admin Cost",
          "Continuing Education": "Admin Cost",
          "Legal & Professional Fees": "Admin Cost",
          "Meals & Entertainment": "Admin Cost",
          "Office Supplies": "Admin Cost",
          "Taxes and Licenses": "Admin Cost",
          TBD: "Admin Cost",
          Travel: "Admin Cost",
        };

        // Auto-save classifications to global database
        try {
          const classificationResponse = await fetch(
            "/api/global-classifications",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                classifications: predefinedClassifications,
              }),
            }
          );

          if (classificationResponse.ok) {
            toast.success("Upload successful!", {
              description: `${getFileLabel(
                fileType
              )} has been uploaded. Categories auto-assigned.`,
            });
          } else {
            throw new Error("Failed to save classifications");
          }
        } catch (error) {
          console.error("Error saving classifications:", error);
          toast.warning("Upload successful but classifications not saved", {
            description: `${getFileLabel(
              fileType
            )} has been uploaded but auto-classification failed.`,
          });
        }
      } else {
        toast.success("Upload successful!", {
          description: `${getFileLabel(
            fileType
          )} has been uploaded and is now available.`,
        });
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while uploading.",
      });
    } finally {
      setUploading(false);
      setCurrentUpload("");
      // Reset file input
      event.target.value = "";
    }
  };

  const getFileLabel = (key: string) => {
    const labels: Record<string, string> = {
      shopify: "Shopify Orders",
      tiktok: "TikTok Orders",
      subscription: "Subscriptions",
      pl_client1: "P&L - LiquidPlus",
      pl_client2: "P&L - ADNA Research",
      sgd_transactions: "SGD Bank Transactions",
      usd_transactions: "USD Bank Transactions",
    };
    return labels[key] || key;
  };

  const getFileDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      shopify: "Upload order data from Shopify platform",
      tiktok: "Upload order data from TikTok Shop",
      subscription: "Upload subscription customer data",
      pl_client1: "Upload profit & loss data for LiquidPlus",
      pl_client2: "Upload profit & loss data for ADNA Research",
      sgd_transactions:
        "Upload SGD bank statement for cashflow visualization (ADNA Research)",
      usd_transactions:
        "Upload USD bank statement for cashflow visualization (ADNA Research)",
    };
    return descriptions[key] || "";
  };

  // Classification functions removed - now auto-assigned

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
      </div>
    );
  }

  const fileTypes = [
    { key: "shopify", icon: "📦" },
    { key: "tiktok", icon: "🎵" },
    { key: "subscription", icon: "💎" },
    { key: "pl_client1", icon: "📊" },
    { key: "pl_client2", icon: "📈" },
    { key: "sgd_transactions", icon: "💰" },
    { key: "usd_transactions", icon: "💵" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <FileText className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage CSV data files for all clients
          </p>
        </div>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>
                Upload CSV files for each data source using the cards below
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>
                All clients (LiquidPlus and ADNA Research) will see the uploaded
                data
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Re-uploading a file will replace the previous data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>
                Data is cached for performance - changes may take a moment to
                reflect
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fileTypes.map(({ key, icon }) => (
          <Card
            key={key}
            className={`transition-all hover:shadow-lg ${
              status[key as keyof UploadStatus]
                ? "border-green-500 shadow-md"
                : "border-border"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-lg">{getFileLabel(key)}</span>
                </CardTitle>
                {status[key as keyof UploadStatus] && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Uploaded
                  </Badge>
                )}
              </div>
              <CardDescription>{getFileDescription(key)}</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, key)}
                  disabled={uploading}
                  className="hidden"
                />
                <Button
                  variant={
                    status[key as keyof UploadStatus] ? "outline" : "default"
                  }
                  className="w-full"
                  disabled={uploading}
                  asChild
                >
                  <div>
                    {uploading && currentUpload === key ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {status[key as keyof UploadStatus]
                          ? "Re-upload CSV"
                          : "Upload CSV"}
                      </>
                    )}
                  </div>
                </Button>
              </label>
              {status[key as keyof UploadStatus] && (
                <Button
                  className="mt-3 w-full"
                  disabled={uploading}
                  onClick={() => {
                    setPendingDeleteKey(key);
                    setDeleteDialogOpen(true);
                  }}
                >
                  Remove CSV
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove CSV</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this CSV file? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPendingDeleteKey(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!pendingDeleteKey) return;
                try {
                  const res = await fetch(
                    `/api/csv-data?fileType=${pendingDeleteKey}`,
                    {
                      method: "DELETE",
                    }
                  );
                  if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Delete failed");
                  }
                  clearCache("csv-data");
                  clearCache("csv-status");
                  if (
                    pendingDeleteKey === "pl_client2" ||
                    pendingDeleteKey === "sgd_transactions" ||
                    pendingDeleteKey === "usd_transactions"
                  ) {
                    clearCache("csv-data-client2");
                  }
                  refetchStatus();
                  toast.success("File removed", {
                    description: `${getFileLabel(
                      pendingDeleteKey
                    )} has been removed.`,
                  });
                } catch (err: unknown) {
                  toast.error("Delete failed", {
                    description:
                      err instanceof Error ? err.message : "Unexpected error",
                  });
                } finally {
                  setDeleteDialogOpen(false);
                  setPendingDeleteKey(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Classification modal removed - categories are now auto-assigned */}
    </div>
  );
}
