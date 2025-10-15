"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useCSVStatus } from "@/lib/hooks/use-csv-data";
import { useUser } from "@/lib/hooks/use-user";
import { clearCache } from "@/lib/cache";

interface UploadStatus {
  shopify: boolean;
  tiktok: boolean;
  subscription: boolean;
  pl_client1: boolean;
  pl_client2: boolean;
}

export default function DashboardPage() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
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
  };

  useEffect(() => {
    // Redirect if not admin
    if (!isLoadingUser && session && session.role !== "admin") {
      router.push("/unauthorized");
    }
  }, [session, isLoadingUser, router]);

  const handleFileUpload = async (event: any, fileType: string) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Invalid file type", {
        description: `Please upload a valid CSV file for ${fileType}`,
      });
      return;
    }

    setUploading(true);
    setMessage(`Uploading ${fileType} data...`);

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

      setMessage("");

      // Clear cache and refetch status
      clearCache("csv-data");
      clearCache("csv-status");
      refetchStatus();

      toast.success("CSV uploaded successfully!", {
        description: `${fileType} data has been uploaded and is now available to clients.`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setMessage("");
      toast.error("Upload failed", {
        description:
          error.message || "An unexpected error occurred while uploading.",
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const fileTypes = [
    {
      key: "shopify",
      label: "Shopify Orders",
      color: "from-green-500 to-emerald-600",
    },
    {
      key: "tiktok",
      label: "TikTok Orders",
      color: "from-blue-500 to-indigo-600",
    },
    {
      key: "subscription",
      label: "Subscriptions",
      color: "from-purple-500 to-pink-600",
    },
    {
      key: "pl_client1",
      label: "P&L - Client 1",
      color: "from-orange-500 to-red-600",
    },
    {
      key: "pl_client2",
      label: "P&L - Client 2",
      color: "from-pink-500 to-rose-600",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <FileText className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Upload CSV files for all clients to view
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.includes("success")
              ? "bg-green-50 text-green-800 border border-green-200"
              : message.includes("failed")
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {fileTypes.map(({ key, label, color }) => (
          <div
            key={key}
            className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
              status[key as keyof UploadStatus]
                ? "border-green-400"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{label}</h3>
              {status[key as keyof UploadStatus] && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>

            <label className="cursor-pointer block">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, key)}
                disabled={uploading}
                className="hidden"
              />
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  uploading
                    ? "border-gray-300 bg-gray-50"
                    : status[key as keyof UploadStatus]
                    ? "border-green-300 bg-green-50 hover:bg-green-100"
                    : "border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
                }`}
              >
                <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">
                  {status[key as keyof UploadStatus]
                    ? "Click to re-upload CSV"
                    : "Click to upload CSV"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {status[key as keyof UploadStatus]
                    ? "File already uploaded"
                    : "No file uploaded yet"}
                </p>
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">📝 Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload CSV files for each data source</li>
          <li>
            • All clients (Client 1 and Client 2) will see the uploaded data
          </li>
          <li>• Re-uploading a file will replace the previous data</li>
          <li>• Only administrators can upload files</li>
        </ul>
      </div>
    </div>
  );
}
