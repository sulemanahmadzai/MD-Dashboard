import { useQuery } from "@tanstack/react-query";
import { getCachedData, setCachedData } from "../cache";

interface CSVData {
  shopify: any[] | null;
  tiktok: any[] | null;
  subscription: any[] | null;
  pl_client1: any[] | null;
  pl_client2: any[] | null;
}

interface CSVStatus {
  shopify: boolean;
  tiktok: boolean;
  subscription: boolean;
  pl_client1: boolean;
  pl_client2: boolean;
}

/**
 * Hook to fetch full CSV data (with React Query caching)
 * Uses localStorage as additional cache layer (if data is small enough)
 */
export function useCSVData() {
  return useQuery<CSVData>({
    queryKey: ["csv-data"],
    queryFn: async () => {
      // Try to get from localStorage cache first (optional)
      const cached = getCachedData<CSVData>("csv-data");
      if (cached) {
        console.log("📦 Using cached CSV data from localStorage");
        return cached;
      }

      // Fetch from API
      console.log("🌐 Fetching CSV data from API...");
      const response = await fetch("/api/csv-data");
      if (!response.ok) {
        throw new Error("Failed to fetch CSV data");
      }

      const data = await response.json();

      // Try to cache in localStorage (will gracefully skip if too large)
      setCachedData("csv-data", data);

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch only CSV upload status (lightweight)
 * Much faster than fetching full data
 */
export function useCSVStatus() {
  return useQuery<CSVStatus>({
    queryKey: ["csv-status"],
    queryFn: async () => {
      // Try to get from localStorage cache first
      const cached = getCachedData<CSVStatus>("csv-status");
      if (cached) {
        console.log("📦 Using cached CSV status from localStorage");
        return cached;
      }

      // Fetch from API
      console.log("🌐 Fetching CSV status from API...");
      const response = await fetch("/api/csv-data/status");
      if (!response.ok) {
        throw new Error("Failed to fetch CSV status");
      }

      const data = await response.json();

      // Cache in localStorage
      setCachedData("csv-status", data);

      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (status can be checked more frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch specific CSV file type
 * More efficient when you only need one file type
 */
export function useCSVFileData(fileType: keyof CSVData) {
  return useQuery<any[] | null>({
    queryKey: ["csv-data", fileType],
    queryFn: async () => {
      // Get full data (will use cache if available)
      const response = await fetch("/api/csv-data");
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileType} data`);
      }

      const data: CSVData = await response.json();
      return data[fileType];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
