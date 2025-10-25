import React, { useState } from "react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function PLDashboard() {
  const [plFile, setPlFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState("all");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeTab, setActiveTab] = useState("officepl");

  const [cashflowFile, setCashflowFile] = useState(null);
  const [cashflowData, setCashflowData] = useState(null);
  const [processingCashflow, setProcessingCashflow] = useState(false);
  const [cashflowStatus, setCashflowStatus] = useState(null);
  const [selectedCashflowOffice, setSelectedCashflowOffice] = useState("all");
  const [expandedCashflowCategories, setExpandedCashflowCategories] = useState(
    {}
  );
  const [openingBalance, setOpeningBalance] = useState(0);

  const [pipelineFile, setPipelineFile] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [processingPipeline, setProcessingPipeline] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [selectedPipelineOffice, setSelectedPipelineOffice] = useState("all");
  const [expandedPipelineStages, setExpandedPipelineStages] = useState({});

  const [selectedAnalyticsOffice, setSelectedAnalyticsOffice] = useState("all");

  const [expandedOfficePLCategories, setExpandedOfficePLCategories] = useState(
    {}
  );

  const [sgdSankeyFile, setSgdSankeyFile] = useState(null);
  const [usdSankeyFile, setUsdSankeyFile] = useState(null);
  const [sgdSankeyData, setSgdSankeyData] = useState(null);
  const [usdSankeyData, setUsdSankeyData] = useState(null);
  const [processingSgdSankey, setProcessingSgdSankey] = useState(false);
  const [processingUsdSankey, setProcessingUsdSankey] = useState(false);
  const [sgdSankeyStatus, setSgdSankeyStatus] = useState(null);
  const [usdSankeyStatus, setUsdSankeyStatus] = useState(null);
  const [sgdOpeningBalance, setSgdOpeningBalance] = useState(0);
  const [usdOpeningBalance, setUsdOpeningBalance] = useState(0);

  const categoryGroups = {
    revenue: [
      "Revenue",
      "Interoffice Revenue",
      "Other Revenue",
      "Management Fee Revenue",
    ],
    costOfSales: ["Direct Labor", "Direct Cost", "Interoffice Costs"],
    operating: [
      "Overhead Staff Costs",
      "Operating Costs",
      "Management Fees",
      "Depreciation",
    ],
    financing: ["Interest", "Interoffice Interest Charges"],
    taxes: ["Taxes"],
  };

  const CALCULATED_ROWS = [
    "ebitda",
    "ebidta",
    "ebit",
    "ebt",
    "gross profit",
    "net profit",
    "net income",
    "net loss",
    "operating profit",
    "operating income",
    "profit after tax",
    "profit before tax",
    "profit for the year",
    "profit for the period",
  ];

  const parseValue = (val) => {
    if (!val) return 0;
    const str = String(val).trim();
    const clean = str.replace(/[$,()]/g, "").replace(/\s/g, "");
    const num = parseFloat(clean) || 0;
    return str.includes("(") || str.startsWith("-") ? -Math.abs(num) : num;
  };

  const formatCurrency = (amount) => {
    const absAmount = Math.abs(amount || 0);
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(absAmount);
    return amount < 0 ? `(${formatted})` : formatted;
  };

  const formatAxisCurrency = (value) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return `${value}`;
  };

  const shouldSkipRow = (lineItem) => {
    if (!lineItem) return true;
    const lower = lineItem.toLowerCase().trim();

    if (!lower || lower.startsWith("total ")) return true;
    if (CALCULATED_ROWS.includes(lower)) return true;

    const hasCalculatedKeyword = CALCULATED_ROWS.some((calc) =>
      lower.includes(calc)
    );
    if (hasCalculatedKeyword) return true;

    return false;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      setPlFile(file);
      setStatus(null);
      setDashboardData(null);
    } else {
      setStatus({ type: "error", message: "Please upload a CSV file" });
    }
  };

  const handleCashflowFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      setCashflowFile(file);
      setCashflowStatus(null);
      setCashflowData(null);
    } else {
      setCashflowStatus({ type: "error", message: "Please upload a CSV file" });
    }
  };

  const handlePipelineFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      setPipelineFile(file);
      setPipelineStatus(null);
      setPipelineData(null);
    } else {
      setPipelineStatus({ type: "error", message: "Please upload a CSV file" });
    }
  };

  const handleProcess = async () => {
    if (!plFile) {
      setStatus({ type: "error", message: "Please upload a CSV file first" });
      return;
    }

    setProcessing(true);
    setStatus({ type: "info", message: "Reading CSV file..." });

    try {
      const text = await plFile.text();
      const lines = text.split("\n");

      const headerLine = lines[0].trim();
      const headers = headerLine
        .split(",")
        .map((h) => h.trim().replace(/\r/g, ""));

      const accountIdx = headers.indexOf("Account");
      const ytdIdx = headers.indexOf("YTD");
      const plMonthColumns = headers.slice(
        accountIdx + 1,
        ytdIdx > 0 ? ytdIdx : headers.length
      );

      const plData = [];
      const classifications = {};
      const officesSet = new Set();
      const discoveredClasses = new Set();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let current = "";
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const classValue = values[0];
        const office = values[1];
        const account = values[2];

        if (shouldSkipRow(account)) continue;

        const row = {
          Class: classValue,
          Office: office,
          Account: account,
        };

        plMonthColumns.forEach((month, idx) => {
          row[month] = values[accountIdx + 1 + idx];
        });

        const hasData = plMonthColumns.some((m) => parseValue(row[m]) !== 0);
        if (!hasData) continue;

        plData.push(row);

        if (office) officesSet.add(office);

        if (classValue) {
          classifications[account] = classValue;
          discoveredClasses.add(classValue);
        }
      }

      const offices = Array.from(officesSet).sort();
      const allClasses = Array.from(discoveredClasses).sort();

      const months = plMonthColumns.map((col) => ({
        columnName: col,
        displayName: col,
      }));

      const monthStatus = months.map((month) => {
        const hasData = plData.some((row) => {
          const val = parseValue(row[month.columnName]);
          return val !== 0;
        });
        return hasData ? "ACTUAL" : "Forecast";
      });

      setDashboardData({
        plData,
        accountColumn: "Account",
        months,
        monthStatus,
        classifications,
        officeColumn: "Office",
        offices,
        discoveredClasses: allClasses,
      });

      setSelectedOffice("all");

      setStatus({
        type: "success",
        message: `Loaded ${plData.length} line items across ${
          months.length
        } months${
          offices.length > 0 ? ` from ${offices.length} offices` : ""
        }. Auto-classified ${Object.keys(classifications).length} items into ${
          allClasses.length
        } categories.`,
      });
      setProcessing(false);
    } catch (error) {
      console.error("ERROR:", error);
      setProcessing(false);
      setStatus({ type: "error", message: `Error: ${error.message}` });
    }
  };

  const handleProcessCashflow = async () => {
    if (!cashflowFile) {
      setCashflowStatus({
        type: "error",
        message: "Please upload a CSV file first",
      });
      return;
    }

    setProcessingCashflow(true);
    setCashflowStatus({
      type: "info",
      message: "Reading cashflow CSV file...",
    });

    try {
      const text = await cashflowFile.text();
      const lines = text.split("\n");

      const headerLine = lines[0].trim();
      const headers = headerLine
        .split(",")
        .map((h) => h.trim().replace(/\r/g, ""));

      const officeIdx = headers.indexOf("Office");
      const typeIdx = headers.indexOf("Inflow / Outflow");
      const contactIdx = headers.indexOf("Contact");

      const cfMonthColumns = headers
        .slice(contactIdx + 1)
        .filter((h) => h && h !== "");

      const cashflowItems = [];
      const officesSet = new Set();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let current = "";
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const office = values[officeIdx];
        const typeRaw = values[typeIdx];
        const contact = values[contactIdx];

        if (!contact || !typeRaw) continue;

        let type = "";
        if (typeRaw.toUpperCase().includes("INFLOW")) {
          type = "Inflow";
        } else if (typeRaw.toUpperCase().includes("OUTFLOW")) {
          type = "Outflow";
        } else {
          continue;
        }

        const row = {
          id: `${Date.now()}-${i}`,
          Office: office,
          Type: type,
          Contact: contact,
        };

        cfMonthColumns.forEach((month, idx) => {
          row[month] = values[contactIdx + 1 + idx];
        });

        const hasData = cfMonthColumns.some((m) => parseValue(row[m]) !== 0);
        if (!hasData) continue;

        cashflowItems.push(row);
        if (office) officesSet.add(office);
      }

      const offices = Array.from(officesSet).sort();

      const months = cfMonthColumns.map((col) => ({
        columnName: col,
        displayName: col,
      }));

      setCashflowData({
        cashflowItems,
        months,
        offices,
      });

      setSelectedCashflowOffice("all");

      setCashflowStatus({
        type: "success",
        message: `Loaded ${cashflowItems.length} cashflow items across ${
          months.length
        } months${
          offices.length > 0 ? ` from ${offices.length} offices` : ""
        }.`,
      });
      setProcessingCashflow(false);
    } catch (error) {
      console.error("Cashflow ERROR:", error);
      setProcessingCashflow(false);
      setCashflowStatus({ type: "error", message: `Error: ${error.message}` });
    }
  };

  const handleProcessPipeline = async () => {
    if (!pipelineFile) {
      setPipelineStatus({
        type: "error",
        message: "Please upload a CSV file first",
      });
      return;
    }

    setProcessingPipeline(true);
    setPipelineStatus({
      type: "info",
      message: "Reading pipeline CSV file...",
    });

    try {
      const text = await pipelineFile.text();
      const lines = text.split("\n");

      const headerLine = lines[0].trim();
      const headers = headerLine
        .split(",")
        .map((h) => h.trim().replace(/\r/g, ""));

      const stageIdx = headers.indexOf("Stage");
      const opportunityIdx = headers.indexOf("Opportunity");
      const valueIdx = headers.indexOf("Value");
      const probabilityIdx = headers.indexOf("Probability");
      const officeIdx = headers.indexOf("Office");
      const expectedCloseIdx = headers.indexOf("Expected Close");
      const reasonIdx = headers.indexOf("Reason");

      const excludeColumns = [
        "Expected Close",
        "Reason",
        "Stage",
        "Opportunity",
        "Value",
        "Probability",
        "Office",
      ];
      const pipelineMonthInfo = [];

      let searchStartIdx =
        Math.max(
          stageIdx >= 0 ? stageIdx : 0,
          opportunityIdx >= 0 ? opportunityIdx : 0,
          valueIdx >= 0 ? valueIdx : 0,
          probabilityIdx >= 0 ? probabilityIdx : 0,
          officeIdx >= 0 ? officeIdx : 0,
          expectedCloseIdx >= 0 ? expectedCloseIdx : 0,
          reasonIdx >= 0 ? reasonIdx : 0
        ) + 1;

      for (let i = searchStartIdx; i < headers.length; i++) {
        const header = headers[i];
        if (
          header &&
          header.trim() !== "" &&
          !excludeColumns.includes(header)
        ) {
          pipelineMonthInfo.push({
            columnName: header,
            displayName: header,
            index: i,
          });
        }
      }

      const pipelineItems = [];
      const officesSet = new Set();
      const stagesSet = new Set();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let current = "";
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const stage = values[stageIdx];
        const opportunity = values[opportunityIdx];
        const value = values[valueIdx];
        const probability = values[probabilityIdx];
        const office = officeIdx >= 0 ? values[officeIdx] : "";
        const expectedClose =
          expectedCloseIdx >= 0 ? values[expectedCloseIdx] : "";
        const reason = reasonIdx >= 0 ? values[reasonIdx] : "";

        if (!opportunity || !stage) continue;

        const numValue = parseValue(value);
        const numProbability = parseFloat(probability) || 0;

        const row = {
          id: `${Date.now()}-${i}`,
          Stage: stage,
          Opportunity: opportunity,
          Value: numValue,
          Probability: numProbability,
          WeightedValue: numValue * (numProbability / 100),
          Office: office,
          ExpectedClose: expectedClose,
          Reason: reason,
        };

        if (pipelineMonthInfo && pipelineMonthInfo.length > 0) {
          pipelineMonthInfo.forEach((monthInfo) => {
            row[monthInfo.columnName] = values[monthInfo.index] || "";
          });
        }

        const hasData =
          numValue !== 0 ||
          (pipelineMonthInfo &&
            pipelineMonthInfo.some((m) => parseValue(values[m.index]) !== 0));
        if (!hasData) continue;

        pipelineItems.push(row);
        if (office) officesSet.add(office);
        if (stage) stagesSet.add(stage);
      }

      const offices = Array.from(officesSet).sort();
      const stages = Array.from(stagesSet);

      const months = pipelineMonthInfo.map((m) => ({
        columnName: m.columnName,
        displayName: m.displayName,
      }));

      setPipelineData({
        pipelineItems,
        offices,
        stages,
        months,
      });

      setSelectedPipelineOffice("all");

      setPipelineStatus({
        type: "success",
        message: `Loaded ${
          pipelineItems.length
        } pipeline opportunities across ${stages.length} stages${
          months.length > 0
            ? ` with ${months.length} months of forecasted revenue`
            : ""
        }${offices.length > 0 ? ` from ${offices.length} offices` : ""}.`,
      });
      setProcessingPipeline(false);
    } catch (error) {
      console.error("Pipeline ERROR:", error);
      setProcessingPipeline(false);
      setPipelineStatus({ type: "error", message: `Error: ${error.message}` });
    }
  };

  const handleSgdSankeyFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      setSgdSankeyFile(file);
      setSgdSankeyStatus(null);
      setSgdSankeyData(null);
    } else {
      setSgdSankeyStatus({
        type: "error",
        message: "Please upload a CSV file",
      });
    }
  };

  const handleUsdSankeyFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      setUsdSankeyFile(file);
      setUsdSankeyStatus(null);
      setUsdSankeyData(null);
    } else {
      setUsdSankeyStatus({
        type: "error",
        message: "Please upload a CSV file",
      });
    }
  };

  const handleProcessSankey = async (currency) => {
    const isSgd = currency === "SGD";
    const file = isSgd ? sgdSankeyFile : usdSankeyFile;
    const setProcessing = isSgd
      ? setProcessingSgdSankey
      : setProcessingUsdSankey;
    const setStatus = isSgd ? setSgdSankeyStatus : setUsdSankeyStatus;
    const setData = isSgd ? setSgdSankeyData : setUsdSankeyData;
    const setOpeningBal = isSgd ? setSgdOpeningBalance : setUsdOpeningBalance;

    if (!file) {
      setStatus({ type: "error", message: "Please upload a CSV file first" });
      return;
    }

    setProcessing(true);
    setStatus({
      type: "info",
      message: `Reading ${currency} cashflow CSV file...`,
    });

    try {
      const text = await file.text();
      const lines = text.split("\n");

      const headerLine = lines[0].trim();
      const headers = headerLine
        .split(",")
        .map((h) => h.trim().replace(/\r/g, ""));

      const sourceIdx = headers.indexOf("Source");
      const categoryIdx = headers.indexOf("Category");
      const contactIdx = headers.indexOf("Contact");
      const debitIdx = headers.indexOf("Debit (Source)");
      const creditIdx = headers.indexOf("Credit (Source)");

      // For USD file, also get SGD columns for combined analysis
      const debitSgdIdx = headers.indexOf("Debit (SGD)");
      const creditSgdIdx = headers.indexOf("Credit (SGD)");

      if (categoryIdx === -1 || (debitIdx === -1 && creditIdx === -1)) {
        setStatus({
          type: "error",
          message:
            "CSV must have Category and Debit (Source) or Credit (Source) columns",
        });
        setProcessing(false);
        return;
      }

      const cashflowItems = [];
      const cashflowItemsSgd = []; // For combined analysis
      let openingBalance = 0;
      let openingBalanceSgd = 0;
      let skippedRows = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let current = "";
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const source = sourceIdx !== -1 ? values[sourceIdx] : "";
        const category = values[categoryIdx];
        const contact = contactIdx !== -1 ? values[contactIdx] : "";
        const debitValue = debitIdx !== -1 ? parseValue(values[debitIdx]) : 0;
        const creditValue =
          creditIdx !== -1 ? parseValue(values[creditIdx]) : 0;

        // For USD file, also parse SGD values
        const debitSgdValue =
          debitSgdIdx !== -1 ? parseValue(values[debitSgdIdx]) : 0;
        const creditSgdValue =
          creditSgdIdx !== -1 ? parseValue(values[creditSgdIdx]) : 0;

        // Check if this is the opening balance row (row 2)
        if (i === 1 || source.toLowerCase().includes("opening balance")) {
          // Opening balance: if in debit, it's positive; if in credit, it's negative
          if (debitValue > 0) {
            openingBalance = debitValue;
          } else if (creditValue > 0) {
            openingBalance = -creditValue;
          }

          // For USD file, also get SGD opening balance
          if (debitSgdIdx !== -1) {
            if (debitSgdValue > 0) {
              openingBalanceSgd = debitSgdValue;
            } else if (creditSgdValue > 0) {
              openingBalanceSgd = -creditSgdValue;
            }
          }
          continue; // Skip this row from transactions
        }

        // Skip rows with no transaction value
        if (debitValue === 0 && creditValue === 0) {
          skippedRows++;
          continue;
        }

        // If there's a debit value, it's an inflow
        if (debitValue > 0) {
          cashflowItems.push({
            id: `${Date.now()}-${i}-debit`,
            Type: "Inflow",
            Category: category || "Uncategorized",
            Contact: contact || "Unknown",
            Amount: debitValue,
          });
        }

        // If there's a credit value, it's an outflow
        if (creditValue > 0) {
          cashflowItems.push({
            id: `${Date.now()}-${i}-credit`,
            Type: "Outflow",
            Category: category || "Uncategorized",
            Contact: contact || "Unknown",
            Amount: creditValue,
          });
        }

        // For USD file, also store SGD equivalents for combined analysis
        if (debitSgdIdx !== -1) {
          if (debitSgdValue > 0) {
            cashflowItemsSgd.push({
              id: `${Date.now()}-${i}-debit-sgd`,
              Type: "Inflow",
              Category: category || "Uncategorized",
              Contact: contact || "Unknown",
              Amount: debitSgdValue,
            });
          }
          if (creditSgdValue > 0) {
            cashflowItemsSgd.push({
              id: `${Date.now()}-${i}-credit-sgd`,
              Type: "Outflow",
              Category: category || "Uncategorized",
              Contact: contact || "Unknown",
              Amount: creditSgdValue,
            });
          }
        }
      }

      setData({
        cashflowItems,
        cashflowItemsSgd, // Store SGD equivalents for combined analysis
        openingBalanceSgd, // Store SGD opening balance
        currency,
      });

      setOpeningBal(openingBalance);

      setStatus({
        type: "success",
        message: `Loaded ${
          cashflowItems.length
        } ${currency} transactions (Opening Balance: ${formatCurrency(
          openingBalance
        )}${skippedRows > 0 ? `, ${skippedRows} empty rows skipped` : ""}).`,
      });
      setProcessing(false);
    } catch (error) {
      console.error(`${currency} Sankey ERROR:`, error);
      setProcessing(false);
      setStatus({ type: "error", message: `Error: ${error.message}` });
    }
  };

  const updateCashflowValue = (itemIndex, monthColumn, newValue) => {
    if (!cashflowData) return;
    const updatedItems = [...cashflowData.cashflowItems];
    updatedItems[itemIndex][monthColumn] = newValue;
    setCashflowData({ ...cashflowData, cashflowItems: updatedItems });
  };

  const addNewCashflowRow = (type) => {
    if (!cashflowData) return;
    const newRow = {
      id: `new-${Date.now()}`,
      Office: "",
      Type: type,
      Contact: "New Item",
    };
    cashflowData.months.forEach((month) => {
      newRow[month.columnName] = "0";
    });
    setCashflowData({
      ...cashflowData,
      cashflowItems: [...cashflowData.cashflowItems, newRow],
    });
    setExpandedCashflowCategories((prev) => ({ ...prev, [type]: true }));
  };

  const deleteCashflowRow = (itemIndex) => {
    if (!cashflowData) return;
    const updatedItems = cashflowData.cashflowItems.filter(
      (_, idx) => idx !== itemIndex
    );
    setCashflowData({ ...cashflowData, cashflowItems: updatedItems });
  };

  const updateCashflowContact = (itemIndex, newContact) => {
    if (!cashflowData) return;
    const updatedItems = [...cashflowData.cashflowItems];
    updatedItems[itemIndex].Contact = newContact;
    setCashflowData({ ...cashflowData, cashflowItems: updatedItems });
  };

  const updatePipelineValue = (itemIndex, monthColumn, newValue) => {
    if (!pipelineData) return;
    const updatedItems = [...pipelineData.pipelineItems];
    updatedItems[itemIndex][monthColumn] = newValue;
    setPipelineData({ ...pipelineData, pipelineItems: updatedItems });
  };

  const updatePipelineTotalValue = (itemIndex, newValue) => {
    if (!pipelineData) return;
    const updatedItems = [...pipelineData.pipelineItems];
    const numValue = parseValue(newValue);
    updatedItems[itemIndex].Value = numValue;
    updatedItems[itemIndex].WeightedValue =
      numValue * (updatedItems[itemIndex].Probability / 100);
    setPipelineData({ ...pipelineData, pipelineItems: updatedItems });
  };

  const updatePipelineProbability = (itemIndex, newProbability) => {
    if (!pipelineData) return;
    const updatedItems = [...pipelineData.pipelineItems];
    const numProbability = parseFloat(newProbability) || 0;
    updatedItems[itemIndex].Probability = numProbability;
    updatedItems[itemIndex].WeightedValue =
      updatedItems[itemIndex].Value * (numProbability / 100);
    setPipelineData({ ...pipelineData, pipelineItems: updatedItems });
  };

  const updatePipelineOpportunity = (itemIndex, newName) => {
    if (!pipelineData) return;
    const updatedItems = [...pipelineData.pipelineItems];
    updatedItems[itemIndex].Opportunity = newName;
    setPipelineData({ ...pipelineData, pipelineItems: updatedItems });
  };

  const updatePipelineOffice = (itemIndex, newOffice) => {
    if (!pipelineData) return;
    const updatedItems = [...pipelineData.pipelineItems];
    updatedItems[itemIndex].Office = newOffice;
    setPipelineData({ ...pipelineData, pipelineItems: updatedItems });
  };

  const addNewPipelineOpportunity = (stage) => {
    if (!pipelineData) return;
    const newRow = {
      id: `new-${Date.now()}`,
      Stage: stage,
      Opportunity: "New Opportunity",
      Value: 0,
      Probability: 50,
      WeightedValue: 0,
      Office: selectedPipelineOffice === "all" ? "" : selectedPipelineOffice,
      ExpectedClose: "",
      Reason: "",
    };
    pipelineData.months.forEach((month) => {
      newRow[month.columnName] = "0";
    });
    setPipelineData({
      ...pipelineData,
      pipelineItems: [...pipelineData.pipelineItems, newRow],
    });
    setExpandedPipelineStages((prev) => ({ ...prev, [stage]: true }));
  };

  const deletePipelineOpportunity = (itemId) => {
    if (!pipelineData) return;
    const updatedItems = pipelineData.pipelineItems.filter(
      (item) => item.id !== itemId
    );
    setPipelineData({ ...pipelineData, pipelineItems: updatedItems });
  };

  const getClassifiedData = () => {
    if (!dashboardData) return null;
    const grouped = {};
    let officeFilter;
    if (activeTab === "analytics") {
      officeFilter = selectedAnalyticsOffice;
    } else if (activeTab === "officepl") {
      officeFilter = "all"; // Office P&L always shows all offices
    } else {
      officeFilter = selectedOffice;
    }
    const filteredData = dashboardData.plData.filter((row) => {
      if (officeFilter === "all") return true;
      if (!dashboardData.officeColumn) return true;
      return row[dashboardData.officeColumn] === officeFilter;
    });
    filteredData.forEach((row) => {
      const account = row[dashboardData.accountColumn];
      const category = dashboardData.classifications[account] || "Unclassified";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(row);
    });
    return grouped;
  };

  const getCashflowByType = () => {
    if (!cashflowData) return null;
    const grouped = { Inflow: [], Outflow: [] };
    const officeFilter =
      activeTab === "analytics"
        ? selectedAnalyticsOffice
        : selectedCashflowOffice;
    const filteredData = cashflowData.cashflowItems.filter((row) => {
      if (officeFilter === "all") return true;
      return row.Office === officeFilter;
    });
    filteredData.forEach((row) => {
      const type = row.Type;
      if (grouped[type]) grouped[type].push(row);
    });
    return grouped;
  };

  const getPipelineByStage = () => {
    if (!pipelineData) return null;
    const grouped = {};
    const officeFilter =
      activeTab === "analytics"
        ? selectedAnalyticsOffice
        : selectedPipelineOffice;
    const filteredData = pipelineData.pipelineItems.filter((row) => {
      if (officeFilter === "all") return true;
      return row.Office === officeFilter;
    });
    filteredData.forEach((row) => {
      const stage = row.Stage;
      if (!grouped[stage]) grouped[stage] = [];
      grouped[stage].push(row);
    });

    pipelineData.stages.forEach((stage) => {
      if (!grouped[stage]) grouped[stage] = [];
    });

    return grouped;
  };

  const classifiedData = getClassifiedData();
  const cashflowByType = getCashflowByType();
  const pipelineByStage = getPipelineByStage();

  const getCategorizedClasses = () => {
    if (!dashboardData || !dashboardData.discoveredClasses) return null;
    const allKnownClasses = [
      ...categoryGroups.revenue,
      ...categoryGroups.costOfSales,
      ...categoryGroups.operating,
      ...categoryGroups.financing,
      ...categoryGroups.taxes,
    ];
    const unknown = dashboardData.discoveredClasses.filter(
      (cls) => !allKnownClasses.includes(cls)
    );
    return {
      known: {
        revenue: categoryGroups.revenue.filter((c) =>
          dashboardData.discoveredClasses.includes(c)
        ),
        costOfSales: categoryGroups.costOfSales.filter((c) =>
          dashboardData.discoveredClasses.includes(c)
        ),
        operating: categoryGroups.operating.filter((c) =>
          dashboardData.discoveredClasses.includes(c)
        ),
        financing: categoryGroups.financing.filter((c) =>
          dashboardData.discoveredClasses.includes(c)
        ),
        taxes: categoryGroups.taxes.filter((c) =>
          dashboardData.discoveredClasses.includes(c)
        ),
      },
      unknown: unknown,
    };
  };

  const categorizedClasses = getCategorizedClasses();

  const getCategoriesTotal = (categories, month = null) => {
    if (!classifiedData) return 0;
    if (month) {
      return categories.reduce((sum, cat) => {
        if (!classifiedData[cat]) return sum;
        return (
          sum +
          classifiedData[cat].reduce(
            (catSum, row) => catSum + parseValue(row[month.columnName]),
            0
          )
        );
      }, 0);
    } else {
      return categories.reduce((sum, cat) => {
        if (!classifiedData[cat]) return sum;
        return (
          sum +
          classifiedData[cat].reduce(
            (catSum, row) =>
              catSum +
              dashboardData.months.reduce(
                (monthSum, month) =>
                  monthSum + parseValue(row[month.columnName]),
                0
              ),
            0
          )
        );
      }, 0);
    }
  };

  const getCashflowTotal = (type, month = null) => {
    if (!cashflowByType || !cashflowByType[type]) return 0;
    if (month) {
      return cashflowByType[type].reduce(
        (sum, row) => sum + parseValue(row[month.columnName]),
        0
      );
    } else {
      return cashflowByType[type].reduce(
        (sum, row) =>
          sum +
          cashflowData.months.reduce(
            (monthSum, month) => monthSum + parseValue(row[month.columnName]),
            0
          ),
        0
      );
    }
  };

  const getPipelineStageTotal = (stage, weighted = false) => {
    if (
      !pipelineByStage ||
      !pipelineByStage[stage] ||
      !Array.isArray(pipelineByStage[stage])
    )
      return 0;
    return pipelineByStage[stage].reduce(
      (sum, row) => sum + (weighted ? row.WeightedValue : row.Value),
      0
    );
  };

  const getRevenueCategoriesTotal = (month = null) => {
    if (!categorizedClasses) return 0;
    return getCategoriesTotal(categorizedClasses.known.revenue, month);
  };

  const getCostOfSalesTotal = (month = null) => {
    if (!categorizedClasses) return 0;
    return getCategoriesTotal(categorizedClasses.known.costOfSales, month);
  };

  const renderCategoryRows = (categories, bgColor = "bg-gray-50") => {
    if (!dashboardData || !classifiedData) return null;
    return categories.map((category) => {
      if (!classifiedData[category]) return null;
      const isExpanded = expandedCategories[category];
      const aggregated = {};
      dashboardData.months.forEach((month) => {
        aggregated[month.columnName] = classifiedData[category].reduce(
          (sum, row) => sum + parseValue(row[month.columnName]),
          0
        );
      });
      const ytdTotal = dashboardData.months.reduce(
        (sum, month) => sum + aggregated[month.columnName],
        0
      );
      return (
        <React.Fragment key={category}>
          <tr
            className={`border-b hover:bg-gray-200 ${bgColor} cursor-pointer group`}
            onClick={() =>
              setExpandedCategories((prev) => ({
                ...prev,
                [category]: !prev[category],
              }))
            }
          >
            <td
              className={`px-4 py-3 pl-8 sticky left-0 ${bgColor} group-hover:bg-gray-200 z-10 font-medium`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 inline mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 inline mr-2" />
              )}
              {category}
            </td>
            {dashboardData.months.map((month) => {
              const value = aggregated[month.columnName];
              return (
                <td key={month.columnName} className="px-4 py-3 text-right">
                  <span className={value < 0 ? "text-red-600" : ""}>
                    {formatCurrency(value)}
                  </span>
                </td>
              );
            })}
            <td
              className={`px-4 py-3 text-right font-semibold ${bgColor} group-hover:bg-gray-200 sticky right-0 z-10`}
            >
              <span className={ytdTotal < 0 ? "text-red-600" : ""}>
                {formatCurrency(ytdTotal)}
              </span>
            </td>
          </tr>
          {isExpanded &&
            classifiedData[category].map((row, idx) => {
              const lineItem = row[dashboardData.accountColumn];
              const office = row[dashboardData.officeColumn];
              const ytdLineTotal = dashboardData.months.reduce(
                (sum, month) => sum + parseValue(row[month.columnName]),
                0
              );
              return (
                <tr
                  key={`${category}-${idx}`}
                  className="border-b bg-white text-xs group hover:bg-gray-100"
                >
                  <td className="px-4 py-2 pl-16 sticky left-0 bg-white group-hover:bg-gray-100 z-10 text-gray-700">
                    <div className="italic">{lineItem}</div>
                    {office && (
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        📍 {office}
                      </div>
                    )}
                  </td>
                  {dashboardData.months.map((month) => {
                    const value = parseValue(row[month.columnName]);
                    return (
                      <td
                        key={month.columnName}
                        className="px-4 py-2 text-right text-gray-700"
                      >
                        <span className={value < 0 ? "text-red-600" : ""}>
                          {formatCurrency(value)}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-right bg-gray-50 group-hover:bg-gray-100 sticky right-0 z-10 text-gray-700">
                    <span className={ytdLineTotal < 0 ? "text-red-600" : ""}>
                      {formatCurrency(ytdLineTotal)}
                    </span>
                  </td>
                </tr>
              );
            })}
        </React.Fragment>
      );
    });
  };

  const renderCashflowRows = (type, bgColor = "bg-gray-50") => {
    if (!cashflowData || !cashflowByType || !cashflowByType[type]) return null;
    const isExpanded = expandedCashflowCategories[type];
    const aggregated = {};
    cashflowData.months.forEach((month) => {
      aggregated[month.columnName] = cashflowByType[type].reduce(
        (sum, row) => sum + parseValue(row[month.columnName]),
        0
      );
    });
    const ytdTotal = cashflowData.months.reduce(
      (sum, month) => sum + aggregated[month.columnName],
      0
    );

    return (
      <React.Fragment key={type}>
        <tr
          className={`border-b hover:bg-gray-200 ${bgColor} cursor-pointer group`}
          onClick={() =>
            setExpandedCashflowCategories((prev) => ({
              ...prev,
              [type]: !prev[type],
            }))
          }
        >
          <td
            className={`px-4 py-3 pl-8 sticky left-0 ${bgColor} group-hover:bg-gray-200 z-10 font-medium`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 inline mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 inline mr-2" />
            )}
            {type}
          </td>
          {cashflowData.months.map((month) => {
            const value = aggregated[month.columnName];
            return (
              <td key={month.columnName} className="px-4 py-3 text-right">
                <span className={value < 0 ? "text-red-600" : ""}>
                  {formatCurrency(value)}
                </span>
              </td>
            );
          })}
          <td
            className={`px-4 py-3 text-right font-semibold ${bgColor} group-hover:bg-gray-200 sticky right-0 z-10`}
          >
            <span className={ytdTotal < 0 ? "text-red-600" : ""}>
              {formatCurrency(ytdTotal)}
            </span>
          </td>
        </tr>
        {isExpanded &&
          cashflowByType[type].map((row, idx) => {
            const lineItem = row.Contact;
            const office = row.Office;
            const originalIndex = cashflowData.cashflowItems.findIndex(
              (item) => item.id === row.id
            );
            const ytdLineTotal = cashflowData.months.reduce(
              (sum, month) => sum + parseValue(row[month.columnName]),
              0
            );
            return (
              <tr
                key={`${type}-${idx}`}
                className="border-b bg-white text-xs group hover:bg-gray-100"
              >
                <td className="px-4 py-2 pl-16 sticky left-0 bg-white group-hover:bg-gray-100 z-10 text-gray-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={lineItem}
                      onChange={(e) =>
                        updateCashflowContact(originalIndex, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 italic bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 px-2 py-1 rounded transition-colors cursor-text"
                      placeholder="Item name"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this item?"))
                          deleteCashflowRow(originalIndex);
                      }}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete row"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {office && (
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      📍 {office}
                    </div>
                  )}
                </td>
                {cashflowData.months.map((month) => {
                  const value = parseValue(row[month.columnName]);
                  return (
                    <td
                      key={month.columnName}
                      className="px-4 py-2 text-right text-gray-700"
                    >
                      <input
                        type="text"
                        value={row[month.columnName] || ""}
                        onChange={(e) =>
                          updateCashflowValue(
                            originalIndex,
                            month.columnName,
                            e.target.value
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.target.select()}
                        className={`w-full text-right bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 px-2 py-1 rounded transition-colors cursor-text ${
                          value < 0 ? "text-red-600" : ""
                        }`}
                        style={{ minWidth: "90px" }}
                        placeholder="0.00"
                      />
                    </td>
                  );
                })}
                <td className="px-4 py-2 text-right bg-gray-50 group-hover:bg-gray-100 sticky right-0 z-10 text-gray-700">
                  <span className={ytdLineTotal < 0 ? "text-red-600" : ""}>
                    {formatCurrency(ytdLineTotal)}
                  </span>
                </td>
              </tr>
            );
          })}
        {isExpanded && (
          <tr className="border-b bg-indigo-50">
            <td
              colSpan={cashflowData.months.length + 2}
              className="px-4 py-2 pl-16 sticky left-0 bg-indigo-50 z-10"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNewCashflowRow(type);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <span className="text-lg">+</span> Add New {type} Item
              </button>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  const renderPipelineRows = (stage, bgColor = "bg-gray-50") => {
    if (!pipelineData || !pipelineByStage || !pipelineByStage[stage])
      return null;
    const isExpanded = expandedPipelineStages[stage];
    const stageTotal = getPipelineStageTotal(stage);
    const stageWeightedTotal = getPipelineStageTotal(stage, true);
    const stageCount = pipelineByStage[stage].length;
    const avgProbability =
      pipelineByStage[stage].reduce((sum, row) => sum + row.Probability, 0) /
      stageCount;
    const monthlyTotals = {};
    if (pipelineData.months) {
      pipelineData.months.forEach((month) => {
        monthlyTotals[month.columnName] = pipelineByStage[stage].reduce(
          (sum, row) => sum + parseValue(row[month.columnName]),
          0
        );
      });
    }

    const hasMonthlyData =
      pipelineData.months && pipelineData.months.length > 0;
    let matchCount = 0;
    let mismatchCount = 0;
    if (hasMonthlyData) {
      pipelineByStage[stage].forEach((row) => {
        const monthlySum = pipelineData.months.reduce(
          (sum, month) => sum + parseValue(row[month.columnName]),
          0
        );
        const totalValue = row.Value;
        if (Math.abs(monthlySum - totalValue) < 1) {
          matchCount++;
        } else {
          mismatchCount++;
        }
      });
    }

    return (
      <React.Fragment key={stage}>
        <tr
          className={`border-b hover:bg-gray-200 ${bgColor} cursor-pointer group`}
          onClick={() =>
            setExpandedPipelineStages((prev) => ({
              ...prev,
              [stage]: !prev[stage],
            }))
          }
        >
          <td
            className={`px-4 py-3 pl-8 sticky left-0 ${bgColor} group-hover:bg-gray-200 z-10 font-medium`}
            style={{ minWidth: "300px" }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 inline mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 inline mr-2" />
            )}
            {stage}
          </td>
          <td className="px-4 py-3 text-right">
            <span>{formatCurrency(stageTotal)}</span>
          </td>
          <td className="px-4 py-3 text-center">
            {avgProbability.toFixed(0)}%
          </td>
          {pipelineData.months &&
            pipelineData.months.map((month) => (
              <td key={month.columnName} className="px-4 py-3 text-right">
                <span>{formatCurrency(monthlyTotals[month.columnName])}</span>
              </td>
            ))}
          <td
            className={`px-4 py-3 text-right font-semibold ${bgColor} group-hover:bg-gray-200 sticky right-0 z-10`}
          >
            <span className="text-green-700">
              {formatCurrency(stageWeightedTotal)}
            </span>
          </td>
          <td className="px-4 py-3 text-center bg-gray-100">
            {hasMonthlyData ? (
              <div
                className="text-xs"
                title={`${matchCount} matching, ${mismatchCount} mismatched`}
              >
                {matchCount > 0 && (
                  <span className="text-green-600 font-bold">
                    {matchCount}✓
                  </span>
                )}
                {mismatchCount > 0 && (
                  <span className="text-red-600 font-bold ml-1">
                    {mismatchCount}✗
                  </span>
                )}
                {matchCount === 0 && mismatchCount === 0 && (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 text-xs">—</span>
            )}
          </td>
        </tr>
        {isExpanded &&
          pipelineByStage[stage].map((row, idx) => {
            const originalIndex = pipelineData.pipelineItems.findIndex(
              (item) => item.id === row.id
            );
            const monthlySum = pipelineData.months
              ? pipelineData.months.reduce(
                  (sum, month) => sum + parseValue(row[month.columnName]),
                  0
                )
              : 0;
            const totalValue = row.Value;
            const difference = Math.abs(monthlySum - totalValue);
            const matches = difference < 1;

            return (
              <tr
                key={`${stage}-${idx}`}
                className="border-b bg-white text-xs group hover:bg-gray-100"
              >
                <td
                  className="px-4 py-2 pl-16 sticky left-0 bg-white group-hover:bg-gray-100 z-10 text-gray-700"
                  style={{ minWidth: "300px" }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={row.Opportunity || ""}
                        onChange={(e) =>
                          updatePipelineOpportunity(
                            originalIndex,
                            e.target.value
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.target.select()}
                        className="w-full font-medium bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 px-2 py-1 rounded transition-colors cursor-text text-gray-900"
                        placeholder="Opportunity name"
                        style={{ minWidth: "200px" }}
                      />
                      {pipelineData.offices &&
                        pipelineData.offices.length > 0 && (
                          <select
                            value={row.Office || ""}
                            onChange={(e) =>
                              updatePipelineOffice(
                                originalIndex,
                                e.target.value
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full mt-1 text-[10px] bg-white border border-gray-200 hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 px-1 py-0.5 rounded transition-colors cursor-pointer text-gray-600"
                          >
                            <option value="">Select Office...</option>
                            {pipelineData.offices.map((office) => (
                              <option key={office} value={office}>
                                {office}
                              </option>
                            ))}
                          </select>
                        )}
                      {!pipelineData.offices && row.Office && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          📍 {row.Office}
                        </div>
                      )}
                      {row.ExpectedClose && (
                        <div className="text-[10px] text-blue-600 mt-0.5">
                          📅 {row.ExpectedClose}
                        </div>
                      )}
                      {row.Reason && stage.toLowerCase() === "lost" && (
                        <div className="text-[10px] text-red-600 mt-0.5 font-medium">
                          ❌ {row.Reason}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const updatedItems = pipelineData.pipelineItems.filter(
                          (item) => item.id !== row.id
                        );
                        setPipelineData({
                          ...pipelineData,
                          pipelineItems: updatedItems,
                        });
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 z-20 cursor-pointer"
                      title="Delete opportunity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 text-right text-gray-700">
                  <input
                    type="text"
                    value={row.Value || ""}
                    onChange={(e) =>
                      updatePipelineTotalValue(originalIndex, e.target.value)
                    }
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.target.select()}
                    className="w-full text-right bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 px-2 py-1 rounded transition-colors cursor-text"
                    style={{ minWidth: "100px" }}
                    placeholder="0.00"
                  />
                </td>
                <td className="px-4 py-2 text-center text-gray-700">
                  <input
                    type="text"
                    value={row.Probability || ""}
                    onChange={(e) =>
                      updatePipelineProbability(originalIndex, e.target.value)
                    }
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.target.select()}
                    className="w-full text-center bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 px-2 py-1 rounded transition-colors cursor-text"
                    style={{ minWidth: "60px" }}
                    placeholder="0"
                  />
                </td>
                {pipelineData.months &&
                  pipelineData.months.map((month) => {
                    const value = parseValue(row[month.columnName]);
                    return (
                      <td
                        key={month.columnName}
                        className="px-4 py-2 text-right text-gray-700"
                      >
                        <input
                          type="text"
                          value={row[month.columnName] || ""}
                          onChange={(e) =>
                            updatePipelineValue(
                              originalIndex,
                              month.columnName,
                              e.target.value
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.target.select()}
                          className={`w-full text-right bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 px-2 py-1 rounded transition-colors cursor-text ${
                            value < 0 ? "text-red-600" : ""
                          }`}
                          style={{ minWidth: "90px" }}
                          placeholder="0.00"
                        />
                      </td>
                    );
                  })}
                <td className="px-4 py-2 text-right bg-gray-50 group-hover:bg-gray-100 sticky right-0 z-10 text-gray-700 font-medium">
                  {formatCurrency(row.WeightedValue)}
                </td>
                <td className="px-4 py-2 text-center bg-gray-100">
                  {pipelineData.months && pipelineData.months.length > 0 ? (
                    matches ? (
                      <span
                        className="text-green-600 font-bold text-sm"
                        title={`Match: Monthly ${formatCurrency(
                          monthlySum
                        )} = Total ${formatCurrency(totalValue)}`}
                      >
                        ✓
                      </span>
                    ) : (
                      <div
                        className="text-red-600 font-bold text-xs"
                        title={`Mismatch: Monthly ${formatCurrency(
                          monthlySum
                        )} vs Total ${formatCurrency(totalValue)}`}
                      >
                        <div>✗</div>
                        <div className="text-[10px]">
                          {formatCurrency(difference)}
                        </div>
                      </div>
                    )
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        {isExpanded && (
          <tr className="border-b bg-indigo-50">
            <td
              colSpan={
                (pipelineData.months ? pipelineData.months.length : 0) + 5
              }
              className="px-4 py-2 pl-16 sticky left-0 bg-indigo-50 z-10"
              style={{ minWidth: "300px" }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNewPipelineOpportunity(stage);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <span className="text-lg">+</span> Add New Opportunity to{" "}
                {stage}
              </button>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Financial Dashboard
            </h1>
          </div>

          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("officepl")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "officepl"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Office P&L
            </button>
            <button
              onClick={() => setActiveTab("pl")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "pl"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              P&L Statement
            </button>
            <button
              onClick={() => setActiveTab("cashflow")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "cashflow"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Cashflow
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "pipeline"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setActiveTab("sankey")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "sankey"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Cashflow Analysis
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
                activeTab === "analytics"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>

        {activeTab === "pl" && (
          <div>
            <div className="max-w-2xl mx-auto mb-6">
              <div
                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                  plFile ? "border-green-400" : "border-gray-200"
                }`}
              >
                <h3 className="text-lg font-semibold mb-4">Upload P&L CSV</h3>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 text-sm mb-2">
                    📋 CSV Format:
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>
                      • <strong>Class Column:</strong> Category (Revenue, Direct
                      Labor, etc.)
                    </li>
                    <li>
                      • <strong>Office Column:</strong> Office name for
                      filtering
                    </li>
                    <li>
                      • <strong>Account Column:</strong> Line item names
                    </li>
                    <li>
                      • <strong>Month Columns:</strong> Numeric data (can
                      include $ , ())
                    </li>
                    <li>
                      • <strong>Auto-Detection:</strong> New categories will be
                      automatically detected
                    </li>
                    <li>
                      • <strong>Auto-skipped:</strong> EBITDA, EBT, Net Income,
                      Total rows
                    </li>
                  </ul>
                </div>

                {!plFile ? (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center hover:bg-indigo-50">
                      <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to Upload CSV
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{plFile.name}</p>
                      <p className="text-xs text-gray-600">
                        {(plFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setPlFile(null);
                        setDashboardData(null);
                      }}
                    >
                      <X className="w-5 h-5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                )}
              </div>

              {dashboardData &&
                dashboardData.offices &&
                dashboardData.offices.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-200 mt-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Filter by Office
                    </h3>
                    <select
                      value={selectedOffice}
                      onChange={(e) => setSelectedOffice(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="all">All Offices</option>
                      {dashboardData.offices.map((office) => (
                        <option key={office} value={office}>
                          {office}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
            </div>

            {status && (
              <div
                className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
                  status.type === "success"
                    ? "bg-green-50 border border-green-200"
                    : status.type === "error"
                    ? "bg-red-50 border border-red-200"
                    : "bg-blue-50 border border-blue-200"
                }`}
              >
                {status.type === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {status.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                {status.type === "info" && (
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                <p className="text-sm font-medium flex-1">{status.message}</p>
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={processing || !plFile}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 mb-6 transition-colors"
            >
              {processing ? "Processing..." : "Process P&L Data"}
            </button>

            {dashboardData && classifiedData && categorizedClasses && (
              <div>
                {categorizedClasses.unknown.length > 0 && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 mb-2">
                          New Categories Detected
                        </h3>
                        <p className="text-sm text-amber-800 mb-2">
                          Found {categorizedClasses.unknown.length}{" "}
                          category(ies) not in pre-defined groups:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {categorizedClasses.unknown.map((cat) => (
                            <span
                              key={cat}
                              className="px-2 py-1 bg-amber-100 text-amber-900 rounded text-xs font-medium"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-amber-700 mt-2">
                          These will appear in the "Other Categories" section at
                          the bottom of the P&L.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-w-4xl mx-auto mb-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 border border-blue-200">
                      <h3 className="text-sm font-semibold text-blue-700">
                        YTD Total Revenue
                      </h3>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(getRevenueCategoriesTotal())}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg shadow p-4 border border-teal-200">
                      <h3 className="text-sm font-semibold text-teal-700">
                        YTD EBITDA
                      </h3>
                      <p className="text-2xl font-bold text-teal-900">
                        {formatCurrency(
                          getRevenueCategoriesTotal() +
                            getCostOfSalesTotal() +
                            (categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.known.operating.filter(
                                    (c) => c !== "Depreciation"
                                  )
                                )
                              : 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 border border-purple-200">
                      <h3 className="text-sm font-semibold text-purple-700">
                        YTD Net Profit
                      </h3>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatCurrency(
                          getRevenueCategoriesTotal() +
                            getCostOfSalesTotal() +
                            (categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.known.operating
                                )
                              : 0) +
                            (categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.known.financing
                                )
                              : 0) +
                            (categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.known.taxes
                                )
                              : 0) +
                            (categorizedClasses
                              ? getCategoriesTotal(categorizedClasses.unknown)
                              : 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                      Profit & Loss Statement
                    </h2>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          const allCategories = [
                            ...categorizedClasses.known.revenue,
                            ...categorizedClasses.known.costOfSales,
                            ...categorizedClasses.known.operating,
                            ...categorizedClasses.known.financing,
                            ...categorizedClasses.known.taxes,
                            ...categorizedClasses.unknown,
                          ];
                          const allExpanded = allCategories.every(
                            (cat) => expandedCategories[cat]
                          );
                          const newState = {};
                          allCategories.forEach((cat) => {
                            newState[cat] = !allExpanded;
                          });
                          setExpandedCategories(newState);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                      >
                        {(() => {
                          const allCategories = [
                            ...categorizedClasses.known.revenue,
                            ...categorizedClasses.known.costOfSales,
                            ...categorizedClasses.known.operating,
                            ...categorizedClasses.known.financing,
                            ...categorizedClasses.known.taxes,
                            ...categorizedClasses.unknown,
                          ];
                          const allExpanded = allCategories.every(
                            (cat) => expandedCategories[cat]
                          );
                          return allExpanded ? "Collapse All" : "Expand All";
                        })()}
                      </button>
                      <div className="text-xs text-gray-500 italic">
                        💡 Click category rows to expand/collapse details
                      </div>
                      {dashboardData.offices &&
                        dashboardData.offices.length > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-600">Viewing: </span>
                            <span className="font-bold text-indigo-600">
                              {selectedOffice === "all"
                                ? "All Offices"
                                : selectedOffice}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-gray-100 z-20"></th>
                          {dashboardData.months.map((month, idx) => (
                            <th
                              key={month.columnName}
                              className="px-4 py-3 text-right font-semibold min-w-[120px]"
                            >
                              <div>{month.displayName}</div>
                              <div className="text-xs font-normal text-gray-600">
                                ({dashboardData.monthStatus[idx]})
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right font-semibold bg-indigo-100 min-w-[120px] sticky right-0 z-20">
                            YTD Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-indigo-100 font-bold border-b-2">
                          <td className="px-4 py-3 sticky left-0 bg-indigo-100 z-10">
                            Total Revenue
                          </td>
                          {dashboardData.months.map((month) => {
                            const revenue = getRevenueCategoriesTotal(month);
                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right"
                              >
                                <span
                                  className={revenue < 0 ? "text-red-600" : ""}
                                >
                                  {formatCurrency(revenue)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right bg-indigo-200 sticky right-0 z-10">
                            <span>
                              {formatCurrency(getRevenueCategoriesTotal())}
                            </span>
                          </td>
                        </tr>

                        {categorizedClasses &&
                          renderCategoryRows(
                            categorizedClasses.known.revenue,
                            "bg-blue-50"
                          )}

                        <tr className="bg-red-100 font-bold border-b-2">
                          <td className="px-4 py-3 sticky left-0 bg-red-100 z-10">
                            Total Cost of Sales
                          </td>
                          {dashboardData.months.map((month) => {
                            const cos = getCostOfSalesTotal(month);
                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right"
                              >
                                <span className={cos < 0 ? "text-red-600" : ""}>
                                  {formatCurrency(cos)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right bg-red-200 sticky right-0 z-10">
                            <span>{formatCurrency(getCostOfSalesTotal())}</span>
                          </td>
                        </tr>

                        {categorizedClasses &&
                          renderCategoryRows(
                            categorizedClasses.known.costOfSales,
                            "bg-red-50"
                          )}

                        <tr className="bg-green-100 font-bold border-b-2">
                          <td className="px-4 py-3 sticky left-0 bg-green-100 z-10">
                            Gross Profit
                          </td>
                          {dashboardData.months.map((month) => {
                            const revenue = getRevenueCategoriesTotal(month);
                            const cos = getCostOfSalesTotal(month);
                            const grossProfit = revenue + cos;
                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right"
                              >
                                <span
                                  className={
                                    grossProfit < 0 ? "text-red-600" : ""
                                  }
                                >
                                  {formatCurrency(grossProfit)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right bg-green-200 sticky right-0 z-10">
                            <span
                              className={
                                getRevenueCategoriesTotal() +
                                  getCostOfSalesTotal() <
                                0
                                  ? "text-red-600"
                                  : ""
                              }
                            >
                              {formatCurrency(
                                getRevenueCategoriesTotal() +
                                  getCostOfSalesTotal()
                              )}
                            </span>
                          </td>
                        </tr>

                        <tr className="bg-orange-100 font-bold border-t-2">
                          <td className="px-4 py-3 sticky left-0 bg-orange-100 z-10">
                            Operating Expenses
                          </td>
                          <td colSpan={dashboardData.months.length + 1}></td>
                        </tr>

                        {categorizedClasses &&
                          renderCategoryRows(
                            categorizedClasses.known.operating.filter(
                              (c) => c !== "Depreciation"
                            ),
                            "bg-orange-50"
                          )}

                        <tr className="bg-teal-100 font-bold border-b-2">
                          <td className="px-4 py-3 sticky left-0 bg-teal-100 z-10">
                            EBITDA
                          </td>
                          {dashboardData.months.map((month) => {
                            const revenue = getRevenueCategoriesTotal(month);
                            const cos = getCostOfSalesTotal(month);
                            const operating = categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.known.operating.filter(
                                    (c) => c !== "Depreciation"
                                  ),
                                  month
                                )
                              : 0;
                            const ebitda = revenue + cos + operating;
                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right"
                              >
                                <span
                                  className={ebitda < 0 ? "text-red-600" : ""}
                                >
                                  {formatCurrency(ebitda)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right bg-teal-200 sticky right-0 z-10">
                            <span
                              className={
                                getRevenueCategoriesTotal() +
                                  getCostOfSalesTotal() +
                                  (categorizedClasses
                                    ? getCategoriesTotal(
                                        categorizedClasses.known.operating.filter(
                                          (c) => c !== "Depreciation"
                                        )
                                      )
                                    : 0) <
                                0
                                  ? "text-red-600"
                                  : ""
                              }
                            >
                              {formatCurrency(
                                getRevenueCategoriesTotal() +
                                  getCostOfSalesTotal() +
                                  (categorizedClasses
                                    ? getCategoriesTotal(
                                        categorizedClasses.known.operating.filter(
                                          (c) => c !== "Depreciation"
                                        )
                                      )
                                    : 0)
                              )}
                            </span>
                          </td>
                        </tr>

                        {categorizedClasses &&
                          categorizedClasses.known.operating.includes(
                            "Depreciation"
                          ) &&
                          renderCategoryRows(["Depreciation"], "bg-orange-50")}
                        {categorizedClasses &&
                          renderCategoryRows(
                            categorizedClasses.known.financing,
                            "bg-pink-50"
                          )}
                        {categorizedClasses &&
                          renderCategoryRows(
                            categorizedClasses.known.taxes,
                            "bg-yellow-50"
                          )}

                        <tr className="bg-indigo-200 font-bold border-t-4 border-b-4">
                          <td className="px-4 py-3 sticky left-0 bg-indigo-200 z-10">
                            Net Profit
                          </td>
                          {dashboardData.months.map((month) => {
                            const revenue = getRevenueCategoriesTotal(month);
                            const cos = getCostOfSalesTotal(month);
                            const operating = categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.known.operating,
                                  month
                                )
                              : 0;
                            const financing = categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.known.financing,
                                  month
                                )
                              : 0;
                            const taxes = categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.known.taxes,
                                  month
                                )
                              : 0;
                            const unknownCosts = categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.unknown,
                                  month
                                )
                              : 0;
                            const netProfit =
                              revenue +
                              cos +
                              operating +
                              financing +
                              taxes +
                              unknownCosts;
                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right"
                              >
                                <span
                                  className={
                                    netProfit < 0
                                      ? "text-red-600"
                                      : "text-green-700"
                                  }
                                >
                                  {formatCurrency(netProfit)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right bg-indigo-300 sticky right-0 z-10">
                            <span
                              className={
                                getRevenueCategoriesTotal() +
                                  getCostOfSalesTotal() +
                                  (categorizedClasses
                                    ? getCategoriesTotal(
                                        categorizedClasses.known.operating
                                      )
                                    : 0) +
                                  (categorizedClasses
                                    ? getCategoriesTotal(
                                        categorizedClasses.known.financing
                                      )
                                    : 0) +
                                  (categorizedClasses
                                    ? getCategoriesTotal(
                                        categorizedClasses.known.taxes
                                      )
                                    : 0) +
                                  (categorizedClasses
                                    ? getCategoriesTotal(
                                        categorizedClasses.unknown
                                      )
                                    : 0) <
                                0
                                  ? "text-red-600"
                                  : "text-green-700"
                              }
                            >
                              {formatCurrency(
                                getRevenueCategoriesTotal() +
                                  getCostOfSalesTotal() +
                                  (categorizedClasses
                                    ? getCategoriesTotal(
                                        categorizedClasses.known.operating
                                      )
                                    : 0) +
                                  (categorizedClasses
                                    ? getCategoriesTotal(
                                        categorizedClasses.known.financing
                                      )
                                    : 0) +
                                  (categorizedClasses
                                    ? getCategoriesTotal(
                                        categorizedClasses.known.taxes
                                      )
                                    : 0) +
                                  (categorizedClasses
                                    ? getCategoriesTotal(
                                        categorizedClasses.unknown
                                      )
                                    : 0)
                              )}
                            </span>
                          </td>
                        </tr>

                        {categorizedClasses &&
                          categorizedClasses.unknown.length > 0 && (
                            <React.Fragment>
                              <tr className="bg-gray-200 font-bold border-t-2">
                                <td
                                  className="px-4 py-3 sticky left-0 bg-gray-200 z-10"
                                  colSpan={dashboardData.months.length + 2}
                                >
                                  Other Categories (Not Pre-defined)
                                </td>
                              </tr>
                              {renderCategoryRows(
                                categorizedClasses.unknown,
                                "bg-gray-50"
                              )}
                            </React.Fragment>
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "cashflow" && (
          <div>
            <div className="max-w-2xl mx-auto mb-6">
              <div
                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                  cashflowFile ? "border-green-400" : "border-gray-200"
                }`}
              >
                <h3 className="text-lg font-semibold mb-4">
                  Upload Cashflow CSV
                </h3>
                {!cashflowFile ? (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCashflowFileUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center hover:bg-indigo-50">
                      <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to Upload CSV
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cashflowFile.name}</p>
                    </div>
                    <button
                      onClick={() => {
                        setCashflowFile(null);
                        setCashflowData(null);
                      }}
                    >
                      <X className="w-5 h-5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                )}
              </div>

              {cashflowData &&
                cashflowData.offices &&
                cashflowData.offices.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-200 mt-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Filter by Office
                    </h3>
                    <select
                      value={selectedCashflowOffice}
                      onChange={(e) =>
                        setSelectedCashflowOffice(e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="all">All Offices</option>
                      {cashflowData.offices.map((office) => (
                        <option key={office} value={office}>
                          {office}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
            </div>

            {cashflowStatus && (
              <div
                className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
                  cashflowStatus.type === "success"
                    ? "bg-green-50 border border-green-200"
                    : cashflowStatus.type === "error"
                    ? "bg-red-50 border border-red-200"
                    : "bg-blue-50 border border-blue-200"
                }`}
              >
                {cashflowStatus.type === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {cashflowStatus.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                {cashflowStatus.type === "info" && (
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                <p className="text-sm font-medium flex-1">
                  {cashflowStatus.message}
                </p>
              </div>
            )}

            <button
              onClick={handleProcessCashflow}
              disabled={processingCashflow || !cashflowFile}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 mb-6 transition-colors"
            >
              {processingCashflow ? "Processing..." : "Process Cashflow Data"}
            </button>

            {cashflowData && cashflowByType && (
              <div>
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Cashflow Statement</h2>
                    {cashflowData.offices &&
                      cashflowData.offices.length > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-600">Viewing: </span>
                          <span className="font-bold text-indigo-600">
                            {selectedCashflowOffice === "all"
                              ? "All Offices"
                              : selectedCashflowOffice}
                          </span>
                        </div>
                      )}
                  </div>
                  <p className="text-xs text-gray-500 italic mb-4">
                    💡 Click the first month's opening balance to edit it
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-gray-100 z-20"></th>
                          {cashflowData.months.map((month) => (
                            <th
                              key={month.columnName}
                              className="px-4 py-3 text-right font-semibold min-w-[120px]"
                            >
                              <div>{month.displayName}</div>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right font-semibold bg-indigo-100 min-w-[120px] sticky right-0 z-20">
                            YTD Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-blue-100 font-bold border-b-2">
                          <td className="px-4 py-3 sticky left-0 bg-blue-100 z-10">
                            Opening Balance
                          </td>
                          {cashflowData.months.map((month, idx) => {
                            let monthOpeningBalance = openingBalance;
                            for (let i = 0; i < idx; i++) {
                              const prevMonthInflow = getCashflowTotal(
                                "Inflow",
                                cashflowData.months[i]
                              );
                              const prevMonthOutflow = getCashflowTotal(
                                "Outflow",
                                cashflowData.months[i]
                              );
                              monthOpeningBalance =
                                monthOpeningBalance +
                                prevMonthInflow -
                                prevMonthOutflow;
                            }

                            // Make first month's opening balance editable
                            if (idx === 0) {
                              return (
                                <td
                                  key={month.columnName}
                                  className="px-4 py-3 text-right"
                                >
                                  <input
                                    type="text"
                                    value={openingBalance || ""}
                                    onChange={(e) =>
                                      setOpeningBalance(
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.target.select()}
                                    className={`w-full text-right bg-white border-2 border-indigo-400 hover:border-indigo-500 hover:bg-indigo-50 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 px-2 py-1 rounded transition-colors cursor-text font-bold ${
                                      openingBalance < 0 ? "text-red-600" : ""
                                    }`}
                                    style={{ minWidth: "90px" }}
                                    placeholder="0.00"
                                    title="Click to edit opening balance"
                                  />
                                </td>
                              );
                            }

                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right"
                              >
                                <span
                                  className={
                                    monthOpeningBalance < 0
                                      ? "text-red-600"
                                      : ""
                                  }
                                >
                                  {formatCurrency(monthOpeningBalance)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right bg-blue-200 sticky right-0 z-10">
                            <span
                              className={
                                openingBalance < 0 ? "text-red-600" : ""
                              }
                            >
                              {formatCurrency(openingBalance)}
                            </span>
                          </td>
                        </tr>

                        <tr className="bg-green-100 font-bold border-b-2">
                          <td className="px-4 py-3 sticky left-0 bg-green-100 z-10">
                            Total Inflows
                          </td>
                          {cashflowData.months.map((month) => {
                            const inflow = getCashflowTotal("Inflow", month);
                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right"
                              >
                                <span
                                  className={inflow < 0 ? "text-red-600" : ""}
                                >
                                  {formatCurrency(inflow)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right bg-green-200 sticky right-0 z-10">
                            <span>
                              {formatCurrency(getCashflowTotal("Inflow"))}
                            </span>
                          </td>
                        </tr>

                        {renderCashflowRows("Inflow", "bg-green-50")}

                        <tr className="bg-red-100 font-bold border-b-2">
                          <td className="px-4 py-3 sticky left-0 bg-red-100 z-10">
                            Total Outflows
                          </td>
                          {cashflowData.months.map((month) => {
                            const outflow = getCashflowTotal("Outflow", month);
                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right"
                              >
                                <span
                                  className={outflow < 0 ? "text-red-600" : ""}
                                >
                                  {formatCurrency(outflow)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right bg-red-200 sticky right-0 z-10">
                            <span>
                              {formatCurrency(getCashflowTotal("Outflow"))}
                            </span>
                          </td>
                        </tr>

                        {renderCashflowRows("Outflow", "bg-red-50")}

                        <tr className="bg-indigo-200 font-bold border-t-4 border-b-4">
                          <td className="px-4 py-3 sticky left-0 bg-indigo-200 z-10">
                            Net Cashflow
                          </td>
                          {cashflowData.months.map((month) => {
                            const inflow = getCashflowTotal("Inflow", month);
                            const outflow = getCashflowTotal("Outflow", month);
                            const netCashflow = inflow - outflow;
                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right"
                              >
                                <span
                                  className={
                                    netCashflow < 0
                                      ? "text-red-600"
                                      : "text-green-700"
                                  }
                                >
                                  {formatCurrency(netCashflow)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right bg-indigo-300 sticky right-0 z-10">
                            {(() => {
                              const totalInflow = getCashflowTotal("Inflow");
                              const totalOutflow = getCashflowTotal("Outflow");
                              const netCashflow = totalInflow - totalOutflow;
                              return (
                                <span
                                  className={
                                    netCashflow < 0
                                      ? "text-red-600"
                                      : "text-green-700"
                                  }
                                >
                                  {formatCurrency(netCashflow)}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>

                        <tr className="bg-purple-200 font-bold border-b-4">
                          <td className="px-4 py-3 sticky left-0 bg-purple-200 z-10">
                            Closing Balance
                          </td>
                          {cashflowData.months.map((month, idx) => {
                            let monthOpeningBalance = openingBalance;
                            for (let i = 0; i < idx; i++) {
                              const prevMonthInflow = getCashflowTotal(
                                "Inflow",
                                cashflowData.months[i]
                              );
                              const prevMonthOutflow = getCashflowTotal(
                                "Outflow",
                                cashflowData.months[i]
                              );
                              monthOpeningBalance =
                                monthOpeningBalance +
                                prevMonthInflow -
                                prevMonthOutflow;
                            }
                            const inflow = getCashflowTotal("Inflow", month);
                            const outflow = getCashflowTotal("Outflow", month);
                            const closingBalance =
                              monthOpeningBalance + inflow - outflow;
                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right"
                              >
                                <span
                                  className={
                                    closingBalance < 0
                                      ? "text-red-600"
                                      : "text-green-700"
                                  }
                                >
                                  {formatCurrency(closingBalance)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right bg-purple-300 sticky right-0 z-10">
                            {(() => {
                              let finalClosing = openingBalance;
                              cashflowData.months.forEach((month) => {
                                const inflow = getCashflowTotal(
                                  "Inflow",
                                  month
                                );
                                const outflow = getCashflowTotal(
                                  "Outflow",
                                  month
                                );
                                finalClosing = finalClosing + inflow - outflow;
                              });
                              return (
                                <span
                                  className={
                                    finalClosing < 0
                                      ? "text-red-600"
                                      : "text-green-700"
                                  }
                                >
                                  {formatCurrency(finalClosing)}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "pipeline" && (
          <div>
            <div className="max-w-2xl mx-auto mb-6">
              <div
                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                  pipelineFile ? "border-green-400" : "border-gray-200"
                }`}
              >
                <h3 className="text-lg font-semibold mb-4">
                  Upload Pipeline CSV
                </h3>
                {!pipelineFile ? (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handlePipelineFileUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center hover:bg-indigo-50">
                      <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to Upload CSV
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{pipelineFile.name}</p>
                    </div>
                    <button
                      onClick={() => {
                        setPipelineFile(null);
                        setPipelineData(null);
                      }}
                    >
                      <X className="w-5 h-5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                )}
              </div>

              {pipelineData &&
                pipelineData.offices &&
                pipelineData.offices.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-200 mt-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Filter by Office
                    </h3>
                    <select
                      value={selectedPipelineOffice}
                      onChange={(e) =>
                        setSelectedPipelineOffice(e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="all">All Offices</option>
                      {pipelineData.offices.map((office) => (
                        <option key={office} value={office}>
                          {office}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
            </div>

            {pipelineStatus && (
              <div
                className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
                  pipelineStatus.type === "success"
                    ? "bg-green-50 border border-green-200"
                    : pipelineStatus.type === "error"
                    ? "bg-red-50 border border-red-200"
                    : "bg-blue-50 border border-blue-200"
                }`}
              >
                {pipelineStatus.type === "success" && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {pipelineStatus.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                {pipelineStatus.type === "info" && (
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                <p className="text-sm font-medium flex-1">
                  {pipelineStatus.message}
                </p>
              </div>
            )}

            <button
              onClick={handleProcessPipeline}
              disabled={processingPipeline || !pipelineFile}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 mb-6 transition-colors"
            >
              {processingPipeline ? "Processing..." : "Process Pipeline Data"}
            </button>

            {pipelineData && pipelineByStage && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Sales Pipeline</h2>
                  {pipelineData.offices && pipelineData.offices.length > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-600">Viewing: </span>
                      <span className="font-bold text-indigo-600">
                        {selectedPipelineOffice === "all"
                          ? "All Offices"
                          : selectedPipelineOffice}
                      </span>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th
                          className="px-4 py-3 text-left font-semibold sticky left-0 bg-gray-100 z-20"
                          style={{ minWidth: "300px" }}
                        >
                          Stage
                        </th>
                        <th className="px-4 py-3 text-right font-semibold min-w-[140px]">
                          Total Value
                        </th>
                        <th className="px-4 py-3 text-center font-semibold min-w-[120px]">
                          Avg Probability
                        </th>
                        {pipelineData.months &&
                          pipelineData.months.map((month) => (
                            <th
                              key={month.columnName}
                              className="px-4 py-3 text-right font-semibold min-w-[120px]"
                            >
                              {month.displayName}
                            </th>
                          ))}
                        <th className="px-4 py-3 text-right font-semibold bg-indigo-100 min-w-[140px] sticky right-0 z-20">
                          Weighted Value
                        </th>
                        <th
                          className="px-4 py-3 text-center font-semibold bg-gray-100 min-w-[80px]"
                          title="Validation: Monthly totals vs Total Value"
                        >
                          ✓
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipelineData.stages.map((stage, idx) => {
                        const colors = [
                          "bg-blue-50",
                          "bg-purple-50",
                          "bg-green-50",
                          "bg-yellow-50",
                          "bg-orange-50",
                          "bg-pink-50",
                        ];
                        return renderPipelineRows(
                          stage,
                          colors[idx % colors.length]
                        );
                      })}

                      <tr className="bg-indigo-200 font-bold border-t-4 border-b-4">
                        <td
                          className="px-4 py-3 sticky left-0 bg-indigo-200 z-10"
                          style={{ minWidth: "300px" }}
                        >
                          TOTAL PIPELINE
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(
                            pipelineData.stages
                              .filter(
                                (stage) => stage.toLowerCase().trim() !== "lost"
                              )
                              .reduce(
                                (sum, stage) =>
                                  sum + getPipelineStageTotal(stage),
                                0
                              )
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(() => {
                            const filteredItems =
                              pipelineData.pipelineItems.filter(
                                (item) =>
                                  (selectedPipelineOffice === "all" ||
                                    item.Office === selectedPipelineOffice) &&
                                  item.Stage.toLowerCase().trim() !== "lost"
                              );
                            const avgProb =
                              filteredItems.length > 0
                                ? filteredItems.reduce(
                                    (sum, item) => sum + item.Probability,
                                    0
                                  ) / filteredItems.length
                                : 0;
                            return `${avgProb.toFixed(0)}%`;
                          })()}
                        </td>
                        {pipelineData.months &&
                          pipelineData.months.map((month) => {
                            const monthTotal = pipelineData.pipelineItems
                              .filter(
                                (item) =>
                                  (selectedPipelineOffice === "all" ||
                                    item.Office === selectedPipelineOffice) &&
                                  item.Stage.toLowerCase().trim() !== "lost"
                              )
                              .reduce(
                                (sum, item) =>
                                  sum + parseValue(item[month.columnName]),
                                0
                              );
                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right font-bold"
                              >
                                {formatCurrency(monthTotal)}
                              </td>
                            );
                          })}
                        <td className="px-4 py-3 text-right bg-indigo-300 sticky right-0 z-10">
                          <span className="text-green-700 font-bold">
                            {formatCurrency(
                              pipelineData.stages
                                .filter(
                                  (stage) =>
                                    stage.toLowerCase().trim() !== "lost"
                                )
                                .reduce(
                                  (sum, stage) =>
                                    sum + getPipelineStageTotal(stage, true),
                                  0
                                )
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center bg-indigo-200"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "officepl" && (
          <div>
            {!dashboardData ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No P&L Data Available
                </h3>
                <p className="text-gray-500">
                  Upload P&L data in the P&L Statement tab to see office
                  comparison
                </p>
              </div>
            ) : !dashboardData.offices || dashboardData.offices.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No Office Data
                </h3>
                <p className="text-gray-500">
                  Your P&L data doesn't include office information
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">
                    Office P&L Comparison (YTD)
                  </h2>
                  <button
                    onClick={() => {
                      const allCategories = [
                        ...categorizedClasses.known.revenue,
                        ...categorizedClasses.known.costOfSales,
                        ...categorizedClasses.known.operating,
                        ...categorizedClasses.known.financing,
                        ...categorizedClasses.known.taxes,
                        ...categorizedClasses.unknown,
                      ];
                      const allExpanded = allCategories.every(
                        (cat) => expandedOfficePLCategories[cat]
                      );
                      const newState = {};
                      allCategories.forEach((cat) => {
                        newState[cat] = !allExpanded;
                      });
                      setExpandedOfficePLCategories(newState);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                  >
                    {(() => {
                      const allCategories = [
                        ...categorizedClasses.known.revenue,
                        ...categorizedClasses.known.costOfSales,
                        ...categorizedClasses.known.operating,
                        ...categorizedClasses.known.financing,
                        ...categorizedClasses.known.taxes,
                        ...categorizedClasses.unknown,
                      ];
                      const allExpanded = allCategories.every(
                        (cat) => expandedOfficePLCategories[cat]
                      );
                      return allExpanded ? "Collapse All" : "Expand All";
                    })()}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-gray-100 z-20">
                          Line Item
                        </th>
                        {dashboardData.offices.map((office) => (
                          <th
                            key={office}
                            className="px-4 py-3 text-right font-semibold min-w-[150px]"
                          >
                            {office}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right font-semibold bg-indigo-100 min-w-[150px] sticky right-0 z-20">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Revenue Section */}
                      <tr className="bg-indigo-100 font-bold border-b-2">
                        <td className="px-4 py-3 sticky left-0 bg-indigo-100 z-10">
                          Total Revenue
                        </td>
                        {dashboardData.offices.map((office) => {
                          const officeData = dashboardData.plData.filter(
                            (row) => row[dashboardData.officeColumn] === office
                          );
                          const revenue =
                            categorizedClasses.known.revenue.reduce(
                              (sum, cat) => {
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === cat
                                );
                                return (
                                  sum +
                                  catData.reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              },
                              0
                            );
                          return (
                            <td key={office} className="px-4 py-3 text-right">
                              <span
                                className={revenue < 0 ? "text-red-600" : ""}
                              >
                                {formatCurrency(revenue)}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right bg-indigo-200 sticky right-0 z-10">
                          <span>
                            {formatCurrency(getRevenueCategoriesTotal())}
                          </span>
                        </td>
                      </tr>

                      {categorizedClasses.known.revenue.map((category) => {
                        if (!classifiedData[category]) return null;
                        const isExpanded = expandedOfficePLCategories[category];
                        return (
                          <React.Fragment key={category}>
                            <tr
                              className="bg-blue-50 border-b hover:bg-blue-100 cursor-pointer group"
                              onClick={() =>
                                setExpandedOfficePLCategories((prev) => ({
                                  ...prev,
                                  [category]: !prev[category],
                                }))
                              }
                            >
                              <td className="px-4 py-2 pl-8 sticky left-0 bg-blue-50 group-hover:bg-blue-100 z-10 font-medium">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 inline mr-2" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 inline mr-2" />
                                )}
                                {category}
                              </td>
                              {dashboardData.offices.map((office) => {
                                const officeData = dashboardData.plData.filter(
                                  (row) =>
                                    row[dashboardData.officeColumn] === office
                                );
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === category
                                );
                                const ytdTotal = catData.reduce(
                                  (sum, row) =>
                                    sum +
                                    dashboardData.months.reduce(
                                      (monthSum, month) =>
                                        monthSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    ),
                                  0
                                );
                                return (
                                  <td
                                    key={office}
                                    className="px-4 py-2 text-right"
                                  >
                                    <span
                                      className={
                                        ytdTotal < 0 ? "text-red-600" : ""
                                      }
                                    >
                                      {formatCurrency(ytdTotal)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2 text-right bg-blue-100 group-hover:bg-blue-200 sticky right-0 z-10 font-medium">
                                <span>
                                  {formatCurrency(
                                    classifiedData[category].reduce(
                                      (sum, row) =>
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        ),
                                      0
                                    )
                                  )}
                                </span>
                              </td>
                            </tr>
                            {isExpanded &&
                              (() => {
                                const uniqueLineItems = [
                                  ...new Set(
                                    classifiedData[category].map(
                                      (row) => row[dashboardData.accountColumn]
                                    )
                                  ),
                                ];
                                return uniqueLineItems.map((lineItem, idx) => {
                                  return (
                                    <tr
                                      key={`${category}-${idx}`}
                                      className="border-b bg-white text-xs hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-2 pl-16 sticky left-0 bg-white hover:bg-gray-50 z-10 text-gray-700 italic">
                                        {lineItem}
                                      </td>
                                      {dashboardData.offices.map((office) => {
                                        const officeRow =
                                          dashboardData.plData.find(
                                            (r) =>
                                              r[dashboardData.officeColumn] ===
                                                office &&
                                              r[dashboardData.accountColumn] ===
                                                lineItem &&
                                              dashboardData.classifications[
                                                r[dashboardData.accountColumn]
                                              ] === category
                                          );
                                        const ytdTotal = officeRow
                                          ? dashboardData.months.reduce(
                                              (sum, month) =>
                                                sum +
                                                parseValue(
                                                  officeRow[month.columnName]
                                                ),
                                              0
                                            )
                                          : 0;
                                        return (
                                          <td
                                            key={office}
                                            className="px-4 py-2 text-right text-gray-700"
                                          >
                                            <span
                                              className={
                                                ytdTotal < 0
                                                  ? "text-red-600"
                                                  : ""
                                              }
                                            >
                                              {formatCurrency(ytdTotal)}
                                            </span>
                                          </td>
                                        );
                                      })}
                                      <td className="px-4 py-2 text-right bg-gray-50 sticky right-0 z-10 text-gray-700">
                                        <span>
                                          {formatCurrency(
                                            dashboardData.offices.reduce(
                                              (sum, office) => {
                                                const officeRow =
                                                  dashboardData.plData.find(
                                                    (r) =>
                                                      r[
                                                        dashboardData
                                                          .officeColumn
                                                      ] === office &&
                                                      r[
                                                        dashboardData
                                                          .accountColumn
                                                      ] === lineItem &&
                                                      dashboardData
                                                        .classifications[
                                                        r[
                                                          dashboardData
                                                            .accountColumn
                                                        ]
                                                      ] === category
                                                  );
                                                return (
                                                  sum +
                                                  (officeRow
                                                    ? dashboardData.months.reduce(
                                                        (monthSum, month) =>
                                                          monthSum +
                                                          parseValue(
                                                            officeRow[
                                                              month.columnName
                                                            ]
                                                          ),
                                                        0
                                                      )
                                                    : 0)
                                                );
                                              },
                                              0
                                            )
                                          )}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                          </React.Fragment>
                        );
                      })}

                      {/* Cost of Sales Section */}
                      <tr className="bg-red-100 font-bold border-b-2">
                        <td className="px-4 py-3 sticky left-0 bg-red-100 z-10">
                          Total Cost of Sales
                        </td>
                        {dashboardData.offices.map((office) => {
                          const officeData = dashboardData.plData.filter(
                            (row) => row[dashboardData.officeColumn] === office
                          );
                          const cos =
                            categorizedClasses.known.costOfSales.reduce(
                              (sum, cat) => {
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === cat
                                );
                                return (
                                  sum +
                                  catData.reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              },
                              0
                            );
                          return (
                            <td key={office} className="px-4 py-3 text-right">
                              <span className={cos < 0 ? "text-red-600" : ""}>
                                {formatCurrency(cos)}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right bg-red-200 sticky right-0 z-10">
                          <span>{formatCurrency(getCostOfSalesTotal())}</span>
                        </td>
                      </tr>

                      {categorizedClasses.known.costOfSales.map((category) => {
                        if (!classifiedData[category]) return null;
                        const isExpanded = expandedOfficePLCategories[category];
                        return (
                          <React.Fragment key={category}>
                            <tr
                              className="bg-red-50 border-b hover:bg-red-100 cursor-pointer group"
                              onClick={() =>
                                setExpandedOfficePLCategories((prev) => ({
                                  ...prev,
                                  [category]: !prev[category],
                                }))
                              }
                            >
                              <td className="px-4 py-2 pl-8 sticky left-0 bg-red-50 group-hover:bg-red-100 z-10 font-medium">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 inline mr-2" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 inline mr-2" />
                                )}
                                {category}
                              </td>
                              {dashboardData.offices.map((office) => {
                                const officeData = dashboardData.plData.filter(
                                  (row) =>
                                    row[dashboardData.officeColumn] === office
                                );
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === category
                                );
                                const ytdTotal = catData.reduce(
                                  (sum, row) =>
                                    sum +
                                    dashboardData.months.reduce(
                                      (monthSum, month) =>
                                        monthSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    ),
                                  0
                                );
                                return (
                                  <td
                                    key={office}
                                    className="px-4 py-2 text-right"
                                  >
                                    <span
                                      className={
                                        ytdTotal < 0 ? "text-red-600" : ""
                                      }
                                    >
                                      {formatCurrency(ytdTotal)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2 text-right bg-red-100 group-hover:bg-red-200 sticky right-0 z-10 font-medium">
                                <span>
                                  {formatCurrency(
                                    classifiedData[category].reduce(
                                      (sum, row) =>
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        ),
                                      0
                                    )
                                  )}
                                </span>
                              </td>
                            </tr>
                            {isExpanded &&
                              (() => {
                                const uniqueLineItems = [
                                  ...new Set(
                                    classifiedData[category].map(
                                      (row) => row[dashboardData.accountColumn]
                                    )
                                  ),
                                ];
                                return uniqueLineItems.map((lineItem, idx) => {
                                  return (
                                    <tr
                                      key={`${category}-${idx}`}
                                      className="border-b bg-white text-xs hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-2 pl-16 sticky left-0 bg-white hover:bg-gray-50 z-10 text-gray-700 italic">
                                        {lineItem}
                                      </td>
                                      {dashboardData.offices.map((office) => {
                                        const officeRow =
                                          dashboardData.plData.find(
                                            (r) =>
                                              r[dashboardData.officeColumn] ===
                                                office &&
                                              r[dashboardData.accountColumn] ===
                                                lineItem &&
                                              dashboardData.classifications[
                                                r[dashboardData.accountColumn]
                                              ] === category
                                          );
                                        const ytdTotal = officeRow
                                          ? dashboardData.months.reduce(
                                              (sum, month) =>
                                                sum +
                                                parseValue(
                                                  officeRow[month.columnName]
                                                ),
                                              0
                                            )
                                          : 0;
                                        return (
                                          <td
                                            key={office}
                                            className="px-4 py-2 text-right text-gray-700"
                                          >
                                            <span
                                              className={
                                                ytdTotal < 0
                                                  ? "text-red-600"
                                                  : ""
                                              }
                                            >
                                              {formatCurrency(ytdTotal)}
                                            </span>
                                          </td>
                                        );
                                      })}
                                      <td className="px-4 py-2 text-right bg-gray-50 sticky right-0 z-10 text-gray-700">
                                        <span>
                                          {formatCurrency(
                                            dashboardData.offices.reduce(
                                              (sum, office) => {
                                                const officeRow =
                                                  dashboardData.plData.find(
                                                    (r) =>
                                                      r[
                                                        dashboardData
                                                          .officeColumn
                                                      ] === office &&
                                                      r[
                                                        dashboardData
                                                          .accountColumn
                                                      ] === lineItem &&
                                                      dashboardData
                                                        .classifications[
                                                        r[
                                                          dashboardData
                                                            .accountColumn
                                                        ]
                                                      ] === category
                                                  );
                                                return (
                                                  sum +
                                                  (officeRow
                                                    ? dashboardData.months.reduce(
                                                        (monthSum, month) =>
                                                          monthSum +
                                                          parseValue(
                                                            officeRow[
                                                              month.columnName
                                                            ]
                                                          ),
                                                        0
                                                      )
                                                    : 0)
                                                );
                                              },
                                              0
                                            )
                                          )}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                          </React.Fragment>
                        );
                      })}

                      {/* Gross Profit */}
                      <tr className="bg-green-100 font-bold border-b-2">
                        <td className="px-4 py-3 sticky left-0 bg-green-100 z-10">
                          Gross Profit
                        </td>
                        {dashboardData.offices.map((office) => {
                          const officeData = dashboardData.plData.filter(
                            (row) => row[dashboardData.officeColumn] === office
                          );
                          const revenue =
                            categorizedClasses.known.revenue.reduce(
                              (sum, cat) => {
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === cat
                                );
                                return (
                                  sum +
                                  catData.reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              },
                              0
                            );
                          const cos =
                            categorizedClasses.known.costOfSales.reduce(
                              (sum, cat) => {
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === cat
                                );
                                return (
                                  sum +
                                  catData.reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              },
                              0
                            );
                          const grossProfit = revenue + cos;
                          return (
                            <td key={office} className="px-4 py-3 text-right">
                              <span
                                className={
                                  grossProfit < 0 ? "text-red-600" : ""
                                }
                              >
                                {formatCurrency(grossProfit)}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right bg-green-200 sticky right-0 z-10">
                          <span
                            className={
                              getRevenueCategoriesTotal() +
                                getCostOfSalesTotal() <
                              0
                                ? "text-red-600"
                                : ""
                            }
                          >
                            {formatCurrency(
                              getRevenueCategoriesTotal() +
                                getCostOfSalesTotal()
                            )}
                          </span>
                        </td>
                      </tr>

                      {/* Operating Expenses Header */}
                      <tr className="bg-orange-100 font-bold border-t-2">
                        <td className="px-4 py-3 sticky left-0 bg-orange-100 z-10">
                          Operating Expenses
                        </td>
                        <td colSpan={dashboardData.offices.length + 1}></td>
                      </tr>

                      {categorizedClasses.known.operating
                        .filter((c) => c !== "Depreciation")
                        .map((category) => {
                          if (!classifiedData[category]) return null;
                          const isExpanded =
                            expandedOfficePLCategories[category];
                          return (
                            <React.Fragment key={category}>
                              <tr
                                className="bg-orange-50 border-b hover:bg-orange-100 cursor-pointer group"
                                onClick={() =>
                                  setExpandedOfficePLCategories((prev) => ({
                                    ...prev,
                                    [category]: !prev[category],
                                  }))
                                }
                              >
                                <td className="px-4 py-2 pl-8 sticky left-0 bg-orange-50 group-hover:bg-orange-100 z-10 font-medium">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 inline mr-2" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 inline mr-2" />
                                  )}
                                  {category}
                                </td>
                                {dashboardData.offices.map((office) => {
                                  const officeData =
                                    dashboardData.plData.filter(
                                      (row) =>
                                        row[dashboardData.officeColumn] ===
                                        office
                                    );
                                  const catData = officeData.filter(
                                    (row) =>
                                      dashboardData.classifications[
                                        row[dashboardData.accountColumn]
                                      ] === category
                                  );
                                  const ytdTotal = catData.reduce(
                                    (sum, row) =>
                                      sum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  );
                                  return (
                                    <td
                                      key={office}
                                      className="px-4 py-2 text-right"
                                    >
                                      <span
                                        className={
                                          ytdTotal < 0 ? "text-red-600" : ""
                                        }
                                      >
                                        {formatCurrency(ytdTotal)}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td className="px-4 py-2 text-right bg-orange-100 group-hover:bg-orange-200 sticky right-0 z-10 font-medium">
                                  <span>
                                    {formatCurrency(
                                      classifiedData[category].reduce(
                                        (sum, row) =>
                                          sum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          ),
                                        0
                                      )
                                    )}
                                  </span>
                                </td>
                              </tr>
                              {isExpanded &&
                                (() => {
                                  const uniqueLineItems = [
                                    ...new Set(
                                      classifiedData[category].map(
                                        (row) =>
                                          row[dashboardData.accountColumn]
                                      )
                                    ),
                                  ];
                                  return uniqueLineItems.map(
                                    (lineItem, idx) => {
                                      return (
                                        <tr
                                          key={`${category}-${idx}`}
                                          className="border-b bg-white text-xs hover:bg-gray-50"
                                        >
                                          <td className="px-4 py-2 pl-16 sticky left-0 bg-white hover:bg-gray-50 z-10 text-gray-700 italic">
                                            {lineItem}
                                          </td>
                                          {dashboardData.offices.map(
                                            (office) => {
                                              const officeRow =
                                                dashboardData.plData.find(
                                                  (r) =>
                                                    r[
                                                      dashboardData.officeColumn
                                                    ] === office &&
                                                    r[
                                                      dashboardData
                                                        .accountColumn
                                                    ] === lineItem &&
                                                    dashboardData
                                                      .classifications[
                                                      r[
                                                        dashboardData
                                                          .accountColumn
                                                      ]
                                                    ] === category
                                                );
                                              const ytdTotal = officeRow
                                                ? dashboardData.months.reduce(
                                                    (sum, month) =>
                                                      sum +
                                                      parseValue(
                                                        officeRow[
                                                          month.columnName
                                                        ]
                                                      ),
                                                    0
                                                  )
                                                : 0;
                                              return (
                                                <td
                                                  key={office}
                                                  className="px-4 py-2 text-right text-gray-700"
                                                >
                                                  <span
                                                    className={
                                                      ytdTotal < 0
                                                        ? "text-red-600"
                                                        : ""
                                                    }
                                                  >
                                                    {formatCurrency(ytdTotal)}
                                                  </span>
                                                </td>
                                              );
                                            }
                                          )}
                                          <td className="px-4 py-2 text-right bg-gray-50 sticky right-0 z-10 text-gray-700">
                                            <span>
                                              {formatCurrency(
                                                dashboardData.offices.reduce(
                                                  (sum, office) => {
                                                    const officeRow =
                                                      dashboardData.plData.find(
                                                        (r) =>
                                                          r[
                                                            dashboardData
                                                              .officeColumn
                                                          ] === office &&
                                                          r[
                                                            dashboardData
                                                              .accountColumn
                                                          ] === lineItem &&
                                                          dashboardData
                                                            .classifications[
                                                            r[
                                                              dashboardData
                                                                .accountColumn
                                                            ]
                                                          ] === category
                                                      );
                                                    return (
                                                      sum +
                                                      (officeRow
                                                        ? dashboardData.months.reduce(
                                                            (monthSum, month) =>
                                                              monthSum +
                                                              parseValue(
                                                                officeRow[
                                                                  month
                                                                    .columnName
                                                                ]
                                                              ),
                                                            0
                                                          )
                                                        : 0)
                                                    );
                                                  },
                                                  0
                                                )
                                              )}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    }
                                  );
                                })()}
                            </React.Fragment>
                          );
                        })}

                      {/* EBITDA */}
                      <tr className="bg-teal-100 font-bold border-b-2">
                        <td className="px-4 py-3 sticky left-0 bg-teal-100 z-10">
                          EBITDA
                        </td>
                        {dashboardData.offices.map((office) => {
                          const officeData = dashboardData.plData.filter(
                            (row) => row[dashboardData.officeColumn] === office
                          );
                          const revenue =
                            categorizedClasses.known.revenue.reduce(
                              (sum, cat) => {
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === cat
                                );
                                return (
                                  sum +
                                  catData.reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              },
                              0
                            );
                          const cos =
                            categorizedClasses.known.costOfSales.reduce(
                              (sum, cat) => {
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === cat
                                );
                                return (
                                  sum +
                                  catData.reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              },
                              0
                            );
                          const operating = categorizedClasses.known.operating
                            .filter((c) => c !== "Depreciation")
                            .reduce((sum, cat) => {
                              const catData = officeData.filter(
                                (row) =>
                                  dashboardData.classifications[
                                    row[dashboardData.accountColumn]
                                  ] === cat
                              );
                              return (
                                sum +
                                catData.reduce(
                                  (catSum, row) =>
                                    catSum +
                                    dashboardData.months.reduce(
                                      (monthSum, month) =>
                                        monthSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    ),
                                  0
                                )
                              );
                            }, 0);
                          const ebitda = revenue + cos + operating;
                          return (
                            <td key={office} className="px-4 py-3 text-right">
                              <span
                                className={ebitda < 0 ? "text-red-600" : ""}
                              >
                                {formatCurrency(ebitda)}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right bg-teal-200 sticky right-0 z-10">
                          <span
                            className={
                              getRevenueCategoriesTotal() +
                                getCostOfSalesTotal() +
                                getCategoriesTotal(
                                  categorizedClasses.known.operating.filter(
                                    (c) => c !== "Depreciation"
                                  )
                                ) <
                              0
                                ? "text-red-600"
                                : ""
                            }
                          >
                            {formatCurrency(
                              getRevenueCategoriesTotal() +
                                getCostOfSalesTotal() +
                                getCategoriesTotal(
                                  categorizedClasses.known.operating.filter(
                                    (c) => c !== "Depreciation"
                                  )
                                )
                            )}
                          </span>
                        </td>
                      </tr>

                      {/* Depreciation */}
                      {categorizedClasses.known.operating.includes(
                        "Depreciation"
                      ) &&
                        classifiedData["Depreciation"] && (
                          <React.Fragment>
                            <tr
                              className="bg-orange-50 border-b hover:bg-orange-100 cursor-pointer group"
                              onClick={() =>
                                setExpandedOfficePLCategories((prev) => ({
                                  ...prev,
                                  Depreciation: !prev["Depreciation"],
                                }))
                              }
                            >
                              <td className="px-4 py-2 pl-8 sticky left-0 bg-orange-50 group-hover:bg-orange-100 z-10 font-medium">
                                {expandedOfficePLCategories["Depreciation"] ? (
                                  <ChevronDown className="w-4 h-4 inline mr-2" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 inline mr-2" />
                                )}
                                Depreciation
                              </td>
                              {dashboardData.offices.map((office) => {
                                const officeData = dashboardData.plData.filter(
                                  (row) =>
                                    row[dashboardData.officeColumn] === office
                                );
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === "Depreciation"
                                );
                                const ytdTotal = catData.reduce(
                                  (sum, row) =>
                                    sum +
                                    dashboardData.months.reduce(
                                      (monthSum, month) =>
                                        monthSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    ),
                                  0
                                );
                                return (
                                  <td
                                    key={office}
                                    className="px-4 py-2 text-right"
                                  >
                                    <span
                                      className={
                                        ytdTotal < 0 ? "text-red-600" : ""
                                      }
                                    >
                                      {formatCurrency(ytdTotal)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2 text-right bg-orange-100 group-hover:bg-orange-200 sticky right-0 z-10 font-medium">
                                <span>
                                  {formatCurrency(
                                    classifiedData["Depreciation"].reduce(
                                      (sum, row) =>
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        ),
                                      0
                                    )
                                  )}
                                </span>
                              </td>
                            </tr>
                            {expandedOfficePLCategories["Depreciation"] &&
                              (() => {
                                const uniqueLineItems = [
                                  ...new Set(
                                    classifiedData["Depreciation"].map(
                                      (row) => row[dashboardData.accountColumn]
                                    )
                                  ),
                                ];
                                return uniqueLineItems.map((lineItem, idx) => {
                                  return (
                                    <tr
                                      key={`Depreciation-${idx}`}
                                      className="border-b bg-white text-xs hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-2 pl-16 sticky left-0 bg-white hover:bg-gray-50 z-10 text-gray-700 italic">
                                        {lineItem}
                                      </td>
                                      {dashboardData.offices.map((office) => {
                                        const officeRow =
                                          dashboardData.plData.find(
                                            (r) =>
                                              r[dashboardData.officeColumn] ===
                                                office &&
                                              r[dashboardData.accountColumn] ===
                                                lineItem &&
                                              dashboardData.classifications[
                                                r[dashboardData.accountColumn]
                                              ] === "Depreciation"
                                          );
                                        const ytdTotal = officeRow
                                          ? dashboardData.months.reduce(
                                              (sum, month) =>
                                                sum +
                                                parseValue(
                                                  officeRow[month.columnName]
                                                ),
                                              0
                                            )
                                          : 0;
                                        return (
                                          <td
                                            key={office}
                                            className="px-4 py-2 text-right text-gray-700"
                                          >
                                            <span
                                              className={
                                                ytdTotal < 0
                                                  ? "text-red-600"
                                                  : ""
                                              }
                                            >
                                              {formatCurrency(ytdTotal)}
                                            </span>
                                          </td>
                                        );
                                      })}
                                      <td className="px-4 py-2 text-right bg-gray-50 sticky right-0 z-10 text-gray-700">
                                        <span>
                                          {formatCurrency(
                                            dashboardData.offices.reduce(
                                              (sum, office) => {
                                                const officeRow =
                                                  dashboardData.plData.find(
                                                    (r) =>
                                                      r[
                                                        dashboardData
                                                          .officeColumn
                                                      ] === office &&
                                                      r[
                                                        dashboardData
                                                          .accountColumn
                                                      ] === lineItem &&
                                                      dashboardData
                                                        .classifications[
                                                        r[
                                                          dashboardData
                                                            .accountColumn
                                                        ]
                                                      ] === "Depreciation"
                                                  );
                                                return (
                                                  sum +
                                                  (officeRow
                                                    ? dashboardData.months.reduce(
                                                        (monthSum, month) =>
                                                          monthSum +
                                                          parseValue(
                                                            officeRow[
                                                              month.columnName
                                                            ]
                                                          ),
                                                        0
                                                      )
                                                    : 0)
                                                );
                                              },
                                              0
                                            )
                                          )}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                          </React.Fragment>
                        )}

                      {/* Financing */}
                      {categorizedClasses.known.financing.map((category) => {
                        if (!classifiedData[category]) return null;
                        const isExpanded = expandedOfficePLCategories[category];
                        return (
                          <React.Fragment key={category}>
                            <tr
                              className="bg-pink-50 border-b hover:bg-pink-100 cursor-pointer group"
                              onClick={() =>
                                setExpandedOfficePLCategories((prev) => ({
                                  ...prev,
                                  [category]: !prev[category],
                                }))
                              }
                            >
                              <td className="px-4 py-2 pl-8 sticky left-0 bg-pink-50 group-hover:bg-pink-100 z-10 font-medium">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 inline mr-2" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 inline mr-2" />
                                )}
                                {category}
                              </td>
                              {dashboardData.offices.map((office) => {
                                const officeData = dashboardData.plData.filter(
                                  (row) =>
                                    row[dashboardData.officeColumn] === office
                                );
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === category
                                );
                                const ytdTotal = catData.reduce(
                                  (sum, row) =>
                                    sum +
                                    dashboardData.months.reduce(
                                      (monthSum, month) =>
                                        monthSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    ),
                                  0
                                );
                                return (
                                  <td
                                    key={office}
                                    className="px-4 py-2 text-right"
                                  >
                                    <span
                                      className={
                                        ytdTotal < 0 ? "text-red-600" : ""
                                      }
                                    >
                                      {formatCurrency(ytdTotal)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2 text-right bg-pink-100 group-hover:bg-pink-200 sticky right-0 z-10 font-medium">
                                <span>
                                  {formatCurrency(
                                    classifiedData[category].reduce(
                                      (sum, row) =>
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        ),
                                      0
                                    )
                                  )}
                                </span>
                              </td>
                            </tr>
                            {isExpanded &&
                              (() => {
                                const uniqueLineItems = [
                                  ...new Set(
                                    classifiedData[category].map(
                                      (row) => row[dashboardData.accountColumn]
                                    )
                                  ),
                                ];
                                return uniqueLineItems.map((lineItem, idx) => {
                                  return (
                                    <tr
                                      key={`${category}-${idx}`}
                                      className="border-b bg-white text-xs hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-2 pl-16 sticky left-0 bg-white hover:bg-gray-50 z-10 text-gray-700 italic">
                                        {lineItem}
                                      </td>
                                      {dashboardData.offices.map((office) => {
                                        const officeRow =
                                          dashboardData.plData.find(
                                            (r) =>
                                              r[dashboardData.officeColumn] ===
                                                office &&
                                              r[dashboardData.accountColumn] ===
                                                lineItem &&
                                              dashboardData.classifications[
                                                r[dashboardData.accountColumn]
                                              ] === category
                                          );
                                        const ytdTotal = officeRow
                                          ? dashboardData.months.reduce(
                                              (sum, month) =>
                                                sum +
                                                parseValue(
                                                  officeRow[month.columnName]
                                                ),
                                              0
                                            )
                                          : 0;
                                        return (
                                          <td
                                            key={office}
                                            className="px-4 py-2 text-right text-gray-700"
                                          >
                                            <span
                                              className={
                                                ytdTotal < 0
                                                  ? "text-red-600"
                                                  : ""
                                              }
                                            >
                                              {formatCurrency(ytdTotal)}
                                            </span>
                                          </td>
                                        );
                                      })}
                                      <td className="px-4 py-2 text-right bg-gray-50 sticky right-0 z-10 text-gray-700">
                                        <span>
                                          {formatCurrency(
                                            dashboardData.offices.reduce(
                                              (sum, office) => {
                                                const officeRow =
                                                  dashboardData.plData.find(
                                                    (r) =>
                                                      r[
                                                        dashboardData
                                                          .officeColumn
                                                      ] === office &&
                                                      r[
                                                        dashboardData
                                                          .accountColumn
                                                      ] === lineItem &&
                                                      dashboardData
                                                        .classifications[
                                                        r[
                                                          dashboardData
                                                            .accountColumn
                                                        ]
                                                      ] === category
                                                  );
                                                return (
                                                  sum +
                                                  (officeRow
                                                    ? dashboardData.months.reduce(
                                                        (monthSum, month) =>
                                                          monthSum +
                                                          parseValue(
                                                            officeRow[
                                                              month.columnName
                                                            ]
                                                          ),
                                                        0
                                                      )
                                                    : 0)
                                                );
                                              },
                                              0
                                            )
                                          )}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                          </React.Fragment>
                        );
                      })}

                      {/* Taxes */}
                      {categorizedClasses.known.taxes.map((category) => {
                        if (!classifiedData[category]) return null;
                        const isExpanded = expandedOfficePLCategories[category];
                        return (
                          <React.Fragment key={category}>
                            <tr
                              className="bg-yellow-50 border-b hover:bg-yellow-100 cursor-pointer group"
                              onClick={() =>
                                setExpandedOfficePLCategories((prev) => ({
                                  ...prev,
                                  [category]: !prev[category],
                                }))
                              }
                            >
                              <td className="px-4 py-2 pl-8 sticky left-0 bg-yellow-50 group-hover:bg-yellow-100 z-10 font-medium">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 inline mr-2" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 inline mr-2" />
                                )}
                                {category}
                              </td>
                              {dashboardData.offices.map((office) => {
                                const officeData = dashboardData.plData.filter(
                                  (row) =>
                                    row[dashboardData.officeColumn] === office
                                );
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === category
                                );
                                const ytdTotal = catData.reduce(
                                  (sum, row) =>
                                    sum +
                                    dashboardData.months.reduce(
                                      (monthSum, month) =>
                                        monthSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    ),
                                  0
                                );
                                return (
                                  <td
                                    key={office}
                                    className="px-4 py-2 text-right"
                                  >
                                    <span
                                      className={
                                        ytdTotal < 0 ? "text-red-600" : ""
                                      }
                                    >
                                      {formatCurrency(ytdTotal)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2 text-right bg-yellow-100 group-hover:bg-yellow-200 sticky right-0 z-10 font-medium">
                                <span>
                                  {formatCurrency(
                                    classifiedData[category].reduce(
                                      (sum, row) =>
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        ),
                                      0
                                    )
                                  )}
                                </span>
                              </td>
                            </tr>
                            {isExpanded &&
                              (() => {
                                const uniqueLineItems = [
                                  ...new Set(
                                    classifiedData[category].map(
                                      (row) => row[dashboardData.accountColumn]
                                    )
                                  ),
                                ];
                                return uniqueLineItems.map((lineItem, idx) => {
                                  return (
                                    <tr
                                      key={`${category}-${idx}`}
                                      className="border-b bg-white text-xs hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-2 pl-16 sticky left-0 bg-white hover:bg-gray-50 z-10 text-gray-700 italic">
                                        {lineItem}
                                      </td>
                                      {dashboardData.offices.map((office) => {
                                        const officeRow =
                                          dashboardData.plData.find(
                                            (r) =>
                                              r[dashboardData.officeColumn] ===
                                                office &&
                                              r[dashboardData.accountColumn] ===
                                                lineItem &&
                                              dashboardData.classifications[
                                                r[dashboardData.accountColumn]
                                              ] === category
                                          );
                                        const ytdTotal = officeRow
                                          ? dashboardData.months.reduce(
                                              (sum, month) =>
                                                sum +
                                                parseValue(
                                                  officeRow[month.columnName]
                                                ),
                                              0
                                            )
                                          : 0;
                                        return (
                                          <td
                                            key={office}
                                            className="px-4 py-2 text-right text-gray-700"
                                          >
                                            <span
                                              className={
                                                ytdTotal < 0
                                                  ? "text-red-600"
                                                  : ""
                                              }
                                            >
                                              {formatCurrency(ytdTotal)}
                                            </span>
                                          </td>
                                        );
                                      })}
                                      <td className="px-4 py-2 text-right bg-gray-50 sticky right-0 z-10 text-gray-700">
                                        <span>
                                          {formatCurrency(
                                            dashboardData.offices.reduce(
                                              (sum, office) => {
                                                const officeRow =
                                                  dashboardData.plData.find(
                                                    (r) =>
                                                      r[
                                                        dashboardData
                                                          .officeColumn
                                                      ] === office &&
                                                      r[
                                                        dashboardData
                                                          .accountColumn
                                                      ] === lineItem &&
                                                      dashboardData
                                                        .classifications[
                                                        r[
                                                          dashboardData
                                                            .accountColumn
                                                        ]
                                                      ] === category
                                                  );
                                                return (
                                                  sum +
                                                  (officeRow
                                                    ? dashboardData.months.reduce(
                                                        (monthSum, month) =>
                                                          monthSum +
                                                          parseValue(
                                                            officeRow[
                                                              month.columnName
                                                            ]
                                                          ),
                                                        0
                                                      )
                                                    : 0)
                                                );
                                              },
                                              0
                                            )
                                          )}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                          </React.Fragment>
                        );
                      })}

                      {/* Net Profit */}
                      <tr className="bg-indigo-200 font-bold border-t-4 border-b-4">
                        <td className="px-4 py-3 sticky left-0 bg-indigo-200 z-10">
                          Net Profit
                        </td>
                        {dashboardData.offices.map((office) => {
                          const officeData = dashboardData.plData.filter(
                            (row) => row[dashboardData.officeColumn] === office
                          );
                          const revenue =
                            categorizedClasses.known.revenue.reduce(
                              (sum, cat) => {
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === cat
                                );
                                return (
                                  sum +
                                  catData.reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              },
                              0
                            );
                          const cos =
                            categorizedClasses.known.costOfSales.reduce(
                              (sum, cat) => {
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === cat
                                );
                                return (
                                  sum +
                                  catData.reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              },
                              0
                            );
                          const operating =
                            categorizedClasses.known.operating.reduce(
                              (sum, cat) => {
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === cat
                                );
                                return (
                                  sum +
                                  catData.reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              },
                              0
                            );
                          const financing =
                            categorizedClasses.known.financing.reduce(
                              (sum, cat) => {
                                const catData = officeData.filter(
                                  (row) =>
                                    dashboardData.classifications[
                                      row[dashboardData.accountColumn]
                                    ] === cat
                                );
                                return (
                                  sum +
                                  catData.reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              },
                              0
                            );
                          const taxes = categorizedClasses.known.taxes.reduce(
                            (sum, cat) => {
                              const catData = officeData.filter(
                                (row) =>
                                  dashboardData.classifications[
                                    row[dashboardData.accountColumn]
                                  ] === cat
                              );
                              return (
                                sum +
                                catData.reduce(
                                  (catSum, row) =>
                                    catSum +
                                    dashboardData.months.reduce(
                                      (monthSum, month) =>
                                        monthSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    ),
                                  0
                                )
                              );
                            },
                            0
                          );
                          const unknown = categorizedClasses.unknown.reduce(
                            (sum, cat) => {
                              const catData = officeData.filter(
                                (row) =>
                                  dashboardData.classifications[
                                    row[dashboardData.accountColumn]
                                  ] === cat
                              );
                              return (
                                sum +
                                catData.reduce(
                                  (catSum, row) =>
                                    catSum +
                                    dashboardData.months.reduce(
                                      (monthSum, month) =>
                                        monthSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    ),
                                  0
                                )
                              );
                            },
                            0
                          );
                          const netProfit =
                            revenue +
                            cos +
                            operating +
                            financing +
                            taxes +
                            unknown;
                          return (
                            <td key={office} className="px-4 py-3 text-right">
                              <span
                                className={
                                  netProfit < 0
                                    ? "text-red-600"
                                    : "text-green-700"
                                }
                              >
                                {formatCurrency(netProfit)}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right bg-indigo-300 sticky right-0 z-10">
                          <span
                            className={
                              getRevenueCategoriesTotal() +
                                getCostOfSalesTotal() +
                                getCategoriesTotal(
                                  categorizedClasses.known.operating
                                ) +
                                getCategoriesTotal(
                                  categorizedClasses.known.financing
                                ) +
                                getCategoriesTotal(
                                  categorizedClasses.known.taxes
                                ) +
                                getCategoriesTotal(categorizedClasses.unknown) <
                              0
                                ? "text-red-600"
                                : "text-green-700"
                            }
                          >
                            {formatCurrency(
                              getRevenueCategoriesTotal() +
                                getCostOfSalesTotal() +
                                getCategoriesTotal(
                                  categorizedClasses.known.operating
                                ) +
                                getCategoriesTotal(
                                  categorizedClasses.known.financing
                                ) +
                                getCategoriesTotal(
                                  categorizedClasses.known.taxes
                                ) +
                                getCategoriesTotal(categorizedClasses.unknown)
                            )}
                          </span>
                        </td>
                      </tr>

                      {/* Unknown Categories */}
                      {categorizedClasses.unknown.length > 0 && (
                        <>
                          <tr className="bg-gray-200 font-bold border-t-2">
                            <td
                              className="px-4 py-3 sticky left-0 bg-gray-200 z-10"
                              colSpan={dashboardData.offices.length + 2}
                            >
                              Other Categories (Not Pre-defined)
                            </td>
                          </tr>
                          {categorizedClasses.unknown.map((category) => {
                            if (!classifiedData[category]) return null;
                            return (
                              <tr
                                key={category}
                                className="bg-gray-50 border-b"
                              >
                                <td className="px-4 py-2 pl-8 sticky left-0 bg-gray-50 z-10">
                                  {category}
                                </td>
                                {dashboardData.offices.map((office) => {
                                  const officeData =
                                    dashboardData.plData.filter(
                                      (row) =>
                                        row[dashboardData.officeColumn] ===
                                        office
                                    );
                                  const catData = officeData.filter(
                                    (row) =>
                                      dashboardData.classifications[
                                        row[dashboardData.accountColumn]
                                      ] === category
                                  );
                                  const ytdTotal = catData.reduce(
                                    (sum, row) =>
                                      sum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  );
                                  return (
                                    <td
                                      key={office}
                                      className="px-4 py-2 text-right"
                                    >
                                      <span
                                        className={
                                          ytdTotal < 0 ? "text-red-600" : ""
                                        }
                                      >
                                        {formatCurrency(ytdTotal)}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td className="px-4 py-2 text-right bg-gray-100 sticky right-0 z-10">
                                  <span>
                                    {formatCurrency(
                                      classifiedData[category].reduce(
                                        (sum, row) =>
                                          sum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          ),
                                        0
                                      )
                                    )}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {(dashboardData || cashflowData || pipelineData) && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-200">
                <h3 className="text-lg font-semibold mb-4">
                  Filter Analytics by Office
                </h3>
                <div className="max-w-md">
                  <select
                    value={selectedAnalyticsOffice}
                    onChange={(e) => setSelectedAnalyticsOffice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="all">All Offices</option>
                    {(() => {
                      const allOffices = new Set();
                      if (dashboardData && dashboardData.offices) {
                        dashboardData.offices.forEach((office) =>
                          allOffices.add(office)
                        );
                      }
                      if (cashflowData && cashflowData.offices) {
                        cashflowData.offices.forEach((office) =>
                          allOffices.add(office)
                        );
                      }
                      if (pipelineData && pipelineData.offices) {
                        pipelineData.offices.forEach((office) =>
                          allOffices.add(office)
                        );
                      }
                      return Array.from(allOffices)
                        .sort()
                        .map((office) => (
                          <option key={office} value={office}>
                            {office}
                          </option>
                        ));
                    })()}
                  </select>
                </div>
              </div>
            )}

            {dashboardData && classifiedData && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                  P&L Analytics
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={dashboardData.months.map((month) => ({
                          month: month.displayName,
                          revenue: getRevenueCategoriesTotal(month),
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tickFormatter={formatAxisCurrency} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#4F46E5"
                          fill="#818CF8"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Profitability Over Time
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={dashboardData.months.map((month) => {
                          const revenue = getRevenueCategoriesTotal(month);
                          const cos = getCostOfSalesTotal(month);
                          const operating = categorizedClasses
                            ? getCategoriesTotal(
                                categorizedClasses.known.operating,
                                month
                              )
                            : 0;
                          const grossProfit = revenue + cos;
                          const netProfit =
                            revenue +
                            cos +
                            operating +
                            (categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.known.financing,
                                  month
                                )
                              : 0) +
                            (categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.known.taxes,
                                  month
                                )
                              : 0) +
                            (categorizedClasses
                              ? getCategoriesTotal(
                                  categorizedClasses.unknown,
                                  month
                                )
                              : 0);
                          return {
                            month: month.displayName,
                            "Gross Profit": grossProfit,
                            "Net Profit": netProfit,
                          };
                        })}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tickFormatter={formatAxisCurrency} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Gross Profit"
                          stroke="#10B981"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="Net Profit"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Revenue vs Total Expenses
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={dashboardData.months.map((month) => {
                          const revenue = getRevenueCategoriesTotal(month);
                          const expenses = Math.abs(
                            getCostOfSalesTotal(month) +
                              (categorizedClasses
                                ? getCategoriesTotal(
                                    categorizedClasses.known.operating,
                                    month
                                  )
                                : 0)
                          );
                          return {
                            month: month.displayName,
                            Revenue: revenue,
                            Expenses: expenses,
                          };
                        })}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tickFormatter={formatAxisCurrency} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="Revenue" fill="#4F46E5" />
                        <Bar dataKey="Expenses" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      YTD Expense Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Cost of Sales",
                              value: Math.abs(getCostOfSalesTotal()),
                            },
                            {
                              name: "Operating",
                              value: Math.abs(
                                categorizedClasses
                                  ? getCategoriesTotal(
                                      categorizedClasses.known.operating
                                    )
                                  : 0
                              ),
                            },
                            {
                              name: "Financing",
                              value: Math.abs(
                                categorizedClasses
                                  ? getCategoriesTotal(
                                      categorizedClasses.known.financing
                                    )
                                  : 0
                              ),
                            },
                            {
                              name: "Taxes",
                              value: Math.abs(
                                categorizedClasses
                                  ? getCategoriesTotal(
                                      categorizedClasses.known.taxes
                                    )
                                  : 0
                              ),
                            },
                          ].filter((item) => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label
                        >
                          {[
                            { color: "#EF4444" },
                            { color: "#F59E0B" },
                            { color: "#8B5CF6" },
                            { color: "#10B981" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {cashflowData && cashflowByType && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  Cashflow Analytics
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Inflow vs Outflow Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={cashflowData.months.map((month) => ({
                          month: month.displayName,
                          Inflow: getCashflowTotal("Inflow", month),
                          Outflow: Math.abs(getCashflowTotal("Outflow", month)),
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={formatAxisCurrency} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="Inflow"
                          stroke="#10B981"
                          fill="#6EE7B7"
                        />
                        <Area
                          type="monotone"
                          dataKey="Outflow"
                          stroke="#EF4444"
                          fill="#FCA5A5"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Cash Balance Over Time
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={cashflowData.months.map((month, idx) => {
                          let balance = openingBalance;
                          for (let i = 0; i <= idx; i++) {
                            const inflow = getCashflowTotal(
                              "Inflow",
                              cashflowData.months[i]
                            );
                            const outflow = getCashflowTotal(
                              "Outflow",
                              cashflowData.months[i]
                            );
                            balance = balance + inflow - outflow;
                          }

                          let projectedBalance = balance;
                          let projectedWithWon = balance;
                          if (pipelineData && pipelineData.months) {
                            const pipelineMonth = pipelineData.months.find(
                              (m) => m.columnName === month.columnName
                            );
                            if (pipelineMonth) {
                              const pipelineRevenue = pipelineData.pipelineItems
                                .filter(
                                  (item) =>
                                    (selectedAnalyticsOffice === "all" ||
                                      item.Office ===
                                        selectedAnalyticsOffice) &&
                                    (item.Stage.toLowerCase() ===
                                      "negotiation" ||
                                      item.Stage.toLowerCase() === "proposal")
                                )
                                .reduce(
                                  (sum, item) =>
                                    sum +
                                    parseValue(item[pipelineMonth.columnName]),
                                  0
                                );
                              projectedBalance = balance + pipelineRevenue;

                              const wonRevenue = pipelineData.pipelineItems
                                .filter(
                                  (item) =>
                                    (selectedAnalyticsOffice === "all" ||
                                      item.Office ===
                                        selectedAnalyticsOffice) &&
                                    item.Stage.toLowerCase() === "won"
                                )
                                .reduce(
                                  (sum, item) =>
                                    sum +
                                    parseValue(item[pipelineMonth.columnName]),
                                  0
                                );
                              projectedWithWon =
                                balance + pipelineRevenue + wonRevenue;
                            }
                          }

                          return {
                            month: month.displayName,
                            balance: balance,
                            projected: projectedBalance,
                            withWon: projectedWithWon,
                          };
                        })}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={formatAxisCurrency} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="balance"
                          stroke="#8B5CF6"
                          strokeWidth={3}
                          name="Actual Balance"
                        />
                        <Line
                          type="monotone"
                          dataKey="projected"
                          stroke="#10B981"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="+ Negotiation/Proposal"
                        />
                        <Line
                          type="monotone"
                          dataKey="withWon"
                          stroke="#F59E0B"
                          strokeWidth={2}
                          strokeDasharray="3 3"
                          name="+ Won Deals"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {pipelineData && pipelineByStage && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  Pipeline Analytics
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Pipeline Funnel by Stage
                    </h3>
                    <div className="flex flex-col items-center gap-3 py-4">
                      {pipelineData.stages
                        .filter((stage) => stage.toLowerCase() !== "lost")
                        .map((stage, idx, filteredStages) => {
                          const stageValue = getPipelineStageTotal(stage);
                          const maxValue = Math.max(
                            ...pipelineData.stages
                              .filter((s) => s.toLowerCase() !== "lost")
                              .map((s) => getPipelineStageTotal(s))
                          );
                          const widthPercent =
                            maxValue > 0 ? (stageValue / maxValue) * 100 : 0;
                          const colors = [
                            "#4F46E5",
                            "#8B5CF6",
                            "#10B981",
                            "#F59E0B",
                            "#EF4444",
                            "#EC4899",
                          ];
                          const color = colors[idx % 6];

                          return (
                            <div
                              key={stage}
                              className="w-full flex flex-col items-center"
                            >
                              <div
                                className="relative rounded-lg shadow-md transition-all hover:shadow-lg cursor-pointer"
                                style={{
                                  width: `${Math.max(widthPercent, 20)}%`,
                                  backgroundColor: color,
                                  padding: "16px 12px",
                                  minWidth: "200px",
                                }}
                                title={`${stage}: ${formatCurrency(
                                  stageValue
                                )}`}
                              >
                                <div className="text-white text-center">
                                  <div className="font-bold text-sm">
                                    {stage}
                                  </div>
                                  <div className="text-xs mt-1 opacity-90">
                                    {pipelineByStage[stage].length}{" "}
                                    opportunities
                                  </div>
                                  <div className="font-semibold mt-1">
                                    {formatCurrency(stageValue)}
                                  </div>
                                </div>
                              </div>
                              {idx < filteredStages.length - 1 && (
                                <div className="text-gray-400 text-2xl my-1">
                                  ↓
                                </div>
                              )}
                            </div>
                          );
                        })}

                      <div className="mt-4 pt-4 border-t border-gray-300 w-full text-center">
                        <div className="text-sm text-gray-600">
                          Total Pipeline Value
                        </div>
                        <div className="text-2xl font-bold text-indigo-700">
                          {formatCurrency(
                            pipelineData.stages
                              .filter((stage) => stage.toLowerCase() !== "lost")
                              .reduce(
                                (sum, stage) =>
                                  sum + getPipelineStageTotal(stage),
                                0
                              )
                          )}
                        </div>
                        <div className="text-sm text-green-600 font-semibold mt-1">
                          Weighted:{" "}
                          {formatCurrency(
                            pipelineData.stages
                              .filter((stage) => stage.toLowerCase() !== "lost")
                              .reduce(
                                (sum, stage) =>
                                  sum + getPipelineStageTotal(stage, true),
                                0
                              )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Opportunity Count by Stage
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pipelineData.stages.map((stage) => ({
                            name: stage,
                            value: pipelineByStage[stage].length,
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label
                        >
                          {pipelineData.stages.map((stage, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={
                                [
                                  "#4F46E5",
                                  "#8B5CF6",
                                  "#10B981",
                                  "#F59E0B",
                                  "#EF4444",
                                  "#EC4899",
                                ][idx % 6]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {pipelineData.months && pipelineData.months.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 lg:col-span-2">
                      <h3 className="text-lg font-semibold mb-4">
                        Monthly Revenue Forecast
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={pipelineData.months.map((month) => {
                            const monthTotal = pipelineData.pipelineItems
                              .filter(
                                (item) =>
                                  (selectedAnalyticsOffice === "all" ||
                                    item.Office === selectedAnalyticsOffice) &&
                                  item.Stage.toLowerCase().trim() !== "lost"
                              )
                              .reduce(
                                (sum, item) =>
                                  sum + parseValue(item[month.columnName]),
                                0
                              );
                            return {
                              month: month.displayName,
                              forecast: monthTotal,
                            };
                          })}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={formatAxisCurrency} />
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Bar dataKey="forecast" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!dashboardData && !cashflowData && !pipelineData && (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No Data Available
                </h3>
                <p className="text-gray-500">
                  Upload data in the P&L, Cashflow, or Pipeline tabs to see
                  analytics
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "sankey" && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">
                📋 CSV Format Requirements:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>
                  • <strong>Category:</strong> Type of transaction (e.g.,
                  Revenue, Salaries, Rent)
                </li>
                <li>
                  • <strong>Contact:</strong> Who the money came from (inflow)
                  or went to (outflow)
                </li>
                <li>
                  • <strong>Debit (Source):</strong> Inflow amounts (money
                  coming in) - for SGD file
                </li>
                <li>
                  • <strong>Credit (Source):</strong> Outflow amounts (money
                  going out) - for SGD file
                </li>
                <li>
                  • <strong>Debit (SGD) & Credit (SGD):</strong> SGD equivalent
                  values - for USD file
                </li>
                <li>
                  • <strong>Opening Balance:</strong> Row 2 contains opening
                  balance (Debit = positive, Credit = negative)
                </li>
              </ul>
              <p className="text-xs text-blue-700 mt-3 italic">
                The analysis will show: Opening Balance + Inflows on the left,
                Total Available in the middle, Outflows by category on the
                right, and detailed breakdowns on the far right.
              </p>
              <p className="text-xs text-blue-700 mt-2 font-semibold">
                💡 Upload both SGD and USD files to see the Combined Cashflow
                Analysis (all values in SGD).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* SGD Upload Section */}
              <div
                className={`bg-white rounded-lg shadow p-4 border-2 ${
                  sgdSankeyFile ? "border-green-400" : "border-gray-200"
                }`}
              >
                <h3 className="text-sm font-semibold mb-3">
                  Upload SGD Cashflow CSV
                </h3>
                {!sgdSankeyFile ? (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleSgdSankeyFileUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 text-center hover:bg-indigo-50">
                      <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">
                        Click to Upload SGD CSV
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {sgdSankeyFile.name}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSgdSankeyFile(null);
                        setSgdSankeyData(null);
                      }}
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                )}

                {sgdSankeyStatus && (
                  <div
                    className={`rounded-lg p-2 mt-2 flex items-center gap-2 ${
                      sgdSankeyStatus.type === "success"
                        ? "bg-green-50 border border-green-200"
                        : sgdSankeyStatus.type === "error"
                        ? "bg-red-50 border border-red-200"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    {sgdSankeyStatus.type === "success" && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {sgdSankeyStatus.type === "error" && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    {sgdSankeyStatus.type === "info" && (
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    )}
                    <p className="text-xs font-medium flex-1">
                      {sgdSankeyStatus.message}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleProcessSankey("SGD")}
                  disabled={processingSgdSankey || !sgdSankeyFile}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:bg-gray-300 mt-3 transition-colors"
                >
                  {processingSgdSankey ? "Processing..." : "Process SGD Data"}
                </button>

                {sgdSankeyData && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      SGD Opening Balance
                    </label>
                    <input
                      type="number"
                      value={sgdOpeningBalance}
                      onChange={(e) =>
                        setSgdOpeningBalance(parseFloat(e.target.value) || 0)
                      }
                      placeholder="Enter SGD opening balance"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* USD Upload Section */}
              <div
                className={`bg-white rounded-lg shadow p-4 border-2 ${
                  usdSankeyFile ? "border-green-400" : "border-gray-200"
                }`}
              >
                <h3 className="text-sm font-semibold mb-3">
                  Upload USD Cashflow CSV
                </h3>
                {!usdSankeyFile ? (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleUsdSankeyFileUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 text-center hover:bg-indigo-50">
                      <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-600">
                        Click to Upload USD CSV
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {usdSankeyFile.name}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setUsdSankeyFile(null);
                        setUsdSankeyData(null);
                      }}
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                )}

                {usdSankeyStatus && (
                  <div
                    className={`rounded-lg p-2 mt-2 flex items-center gap-2 ${
                      usdSankeyStatus.type === "success"
                        ? "bg-green-50 border border-green-200"
                        : usdSankeyStatus.type === "error"
                        ? "bg-red-50 border border-red-200"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    {usdSankeyStatus.type === "success" && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {usdSankeyStatus.type === "error" && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    {usdSankeyStatus.type === "info" && (
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    )}
                    <p className="text-xs font-medium flex-1">
                      {usdSankeyStatus.message}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleProcessSankey("USD")}
                  disabled={processingUsdSankey || !usdSankeyFile}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:bg-gray-300 mt-3 transition-colors"
                >
                  {processingUsdSankey ? "Processing..." : "Process USD Data"}
                </button>

                {usdSankeyData && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      USD Opening Balance
                    </label>
                    <input
                      type="number"
                      value={usdOpeningBalance}
                      onChange={(e) =>
                        setUsdOpeningBalance(parseFloat(e.target.value) || 0)
                      }
                      placeholder="Enter USD opening balance"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SGD Tabular Cashflow */}
            {sgdSankeyData &&
              (() => {
                const totalInflow = sgdSankeyData.cashflowItems
                  .filter((item) => item.Type === "Inflow")
                  .reduce((sum, item) => sum + item.Amount, 0);

                const totalOutflow = sgdSankeyData.cashflowItems
                  .filter((item) => item.Type === "Outflow")
                  .reduce((sum, item) => sum + item.Amount, 0);

                const closingBalance =
                  sgdOpeningBalance + totalInflow - totalOutflow;
                const totalAvailable = sgdOpeningBalance + totalInflow;

                // Group inflows by category
                const inflowsByCategory = {};
                sgdSankeyData.cashflowItems
                  .filter((item) => item.Type === "Inflow")
                  .forEach((item) => {
                    if (!inflowsByCategory[item.Category]) {
                      inflowsByCategory[item.Category] = [];
                    }
                    inflowsByCategory[item.Category].push(item);
                  });

                // Group outflows by category
                const outflowsByCategory = {};
                sgdSankeyData.cashflowItems
                  .filter((item) => item.Type === "Outflow")
                  .forEach((item) => {
                    if (!outflowsByCategory[item.Category]) {
                      outflowsByCategory[item.Category] = [];
                    }
                    outflowsByCategory[item.Category].push(item);
                  });

                return (
                  <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-200">
                    <h2 className="text-lg font-bold mb-6 text-green-700 pb-3 border-b-2 border-green-200">
                      SGD Cashflow Analysis
                    </h2>

                    <div className="grid grid-cols-12 gap-6 items-start">
                      {/* Column 1: Opening Balance & Inflows */}
                      <div className="col-span-3 space-y-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-3 text-white">
                          <h3 className="text-[10px] font-bold mb-1 uppercase tracking-wider opacity-90">
                            Opening Balance
                          </h3>
                          <p className="text-base font-bold">
                            {formatCurrency(sgdOpeningBalance)}
                          </p>
                        </div>

                        <div className="space-y-2 mt-4">
                          <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider pb-1 border-b border-gray-300">
                            Cash Inflows
                          </h3>
                          {Object.entries(inflowsByCategory).map(
                            ([category, items]) => {
                              const categoryTotal = items.reduce(
                                (sum, item) => sum + item.Amount,
                                0
                              );
                              const percentage =
                                totalInflow > 0
                                  ? (
                                      (categoryTotal / totalInflow) *
                                      100
                                    ).toFixed(1)
                                  : 0;
                              return (
                                <div
                                  key={category}
                                  className="bg-blue-50 rounded-lg p-2 border border-blue-200 hover:shadow-md transition-shadow"
                                >
                                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">
                                    {category}
                                  </div>
                                  <div className="flex items-baseline justify-between gap-2">
                                    <div className="text-sm font-bold text-blue-900">
                                      {formatCurrency(categoryTotal)}
                                    </div>
                                    <div className="text-[10px] text-blue-600 font-semibold">
                                      {percentage}%
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Column 2: Total Inflows */}
                      <div className="col-span-2 flex flex-col items-center justify-center py-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-2xl p-4 text-white text-center w-full">
                          <h3 className="text-[10px] font-bold mb-2 uppercase tracking-wider opacity-90">
                            Total Inflows
                          </h3>
                          <p className="text-xl font-bold">
                            {formatCurrency(totalAvailable)}
                          </p>
                        </div>
                        <div className="my-4">
                          <div className="text-3xl text-red-500 font-bold animate-pulse">
                            →
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Outflows with arrows to detailed breakdown */}
                      <div className="col-span-7 space-y-4">
                        <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider pb-1 border-b border-gray-300">
                          Cash Outflows → Detailed Breakdown
                        </h3>
                        {Object.entries(outflowsByCategory).map(
                          ([category, items]) => {
                            const categoryTotal = items.reduce(
                              (sum, item) => sum + item.Amount,
                              0
                            );
                            const percentage =
                              totalAvailable > 0
                                ? (
                                    (categoryTotal / totalAvailable) *
                                    100
                                  ).toFixed(1)
                                : 0;

                            // Group by contact and sum amounts
                            const contactTotals = {};
                            items.forEach((item) => {
                              if (!contactTotals[item.Contact]) {
                                contactTotals[item.Contact] = 0;
                              }
                              contactTotals[item.Contact] += item.Amount;
                            });

                            return (
                              <div
                                key={category}
                                className="flex items-start gap-3"
                              >
                                {/* Outflow Summary */}
                                <div className="flex-shrink-0 w-64 bg-green-50 rounded-lg p-2 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
                                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                                    {category}
                                  </div>
                                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                                    {formatCurrency(categoryTotal)}
                                  </div>
                                  <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                                    {percentage}%
                                  </div>
                                </div>

                                {/* Curved Arrow */}
                                <div className="flex-shrink-0 flex items-center justify-center pt-4">
                                  <svg
                                    width="40"
                                    height="40"
                                    viewBox="0 0 40 40"
                                    className="text-green-500"
                                  >
                                    <path
                                      d="M 5 20 Q 20 20, 30 20"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      fill="none"
                                      markerEnd="url(#arrowhead)"
                                    />
                                    <defs>
                                      <marker
                                        id="arrowhead"
                                        markerWidth="10"
                                        markerHeight="10"
                                        refX="9"
                                        refY="3"
                                        orient="auto"
                                      >
                                        <polygon
                                          points="0 0, 10 3, 0 6"
                                          fill="currentColor"
                                        />
                                      </marker>
                                    </defs>
                                  </svg>
                                </div>

                                {/* Detailed Breakdown */}
                                <div className="flex-1">
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(contactTotals).map(
                                      ([contact, total], idx) => {
                                        const contactPercentage =
                                          categoryTotal > 0
                                            ? (
                                                (total / categoryTotal) *
                                                100
                                              ).toFixed(1)
                                            : 0;
                                        return (
                                          <div
                                            key={`${category}-${idx}`}
                                            className="bg-white rounded-lg p-2 border border-gray-200 hover:border-gray-300 hover:shadow transition-all"
                                          >
                                            <div className="text-[10px] text-gray-600 mb-0.5">
                                              {contact}
                                            </div>
                                            <div className="text-xs font-bold text-gray-900">
                                              {formatCurrency(total)}
                                            </div>
                                            <div className="text-[9px] text-gray-500 mt-0.5">
                                              {contactPercentage}%
                                            </div>
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Bottom Summary */}
                    <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-4 border-2 border-green-300">
                        <h3 className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1">
                          Total Inflows
                        </h3>
                        <p className="text-lg font-bold text-green-900">
                          {formatCurrency(totalInflow)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-4 border-2 border-red-300">
                        <h3 className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">
                          Total Outflows
                        </h3>
                        <p className="text-lg font-bold text-red-900">
                          {formatCurrency(totalOutflow)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-4 border-2 border-blue-300">
                        <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">
                          Net Change
                        </h3>
                        <p
                          className={`text-lg font-bold ${
                            totalInflow - totalOutflow >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {formatCurrency(totalInflow - totalOutflow)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-4 border-2 border-purple-300">
                        <h3 className="text-[10px] font-bold text-purple-700 uppercase tracking-wide mb-1">
                          Closing Balance
                        </h3>
                        <p className="text-lg font-bold text-purple-900">
                          {formatCurrency(closingBalance)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* USD Tabular Cashflow */}
            {usdSankeyData &&
              (() => {
                const totalInflow = usdSankeyData.cashflowItems
                  .filter((item) => item.Type === "Inflow")
                  .reduce((sum, item) => sum + item.Amount, 0);

                const totalOutflow = usdSankeyData.cashflowItems
                  .filter((item) => item.Type === "Outflow")
                  .reduce((sum, item) => sum + item.Amount, 0);

                const closingBalance =
                  usdOpeningBalance + totalInflow - totalOutflow;
                const totalAvailable = usdOpeningBalance + totalInflow;

                // Group inflows by category
                const inflowsByCategory = {};
                usdSankeyData.cashflowItems
                  .filter((item) => item.Type === "Inflow")
                  .forEach((item) => {
                    if (!inflowsByCategory[item.Category]) {
                      inflowsByCategory[item.Category] = [];
                    }
                    inflowsByCategory[item.Category].push(item);
                  });

                // Group outflows by category
                const outflowsByCategory = {};
                usdSankeyData.cashflowItems
                  .filter((item) => item.Type === "Outflow")
                  .forEach((item) => {
                    if (!outflowsByCategory[item.Category]) {
                      outflowsByCategory[item.Category] = [];
                    }
                    outflowsByCategory[item.Category].push(item);
                  });

                return (
                  <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-200">
                    <h2 className="text-lg font-bold mb-6 text-blue-700 pb-3 border-b-2 border-blue-200">
                      USD Cashflow Analysis
                    </h2>

                    <div className="grid grid-cols-12 gap-6 items-start">
                      {/* Column 1: Opening Balance & Inflows */}
                      <div className="col-span-3 space-y-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-3 text-white">
                          <h3 className="text-[10px] font-bold mb-1 uppercase tracking-wider opacity-90">
                            Opening Balance
                          </h3>
                          <p className="text-base font-bold">
                            {formatCurrency(usdOpeningBalance)}
                          </p>
                        </div>

                        <div className="space-y-2 mt-4">
                          <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider pb-1 border-b border-gray-300">
                            Cash Inflows
                          </h3>
                          {Object.entries(inflowsByCategory).map(
                            ([category, items]) => {
                              const categoryTotal = items.reduce(
                                (sum, item) => sum + item.Amount,
                                0
                              );
                              const percentage =
                                totalInflow > 0
                                  ? (
                                      (categoryTotal / totalInflow) *
                                      100
                                    ).toFixed(1)
                                  : 0;
                              return (
                                <div
                                  key={category}
                                  className="bg-blue-50 rounded-lg p-2 border border-blue-200 hover:shadow-md transition-shadow"
                                >
                                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">
                                    {category}
                                  </div>
                                  <div className="flex items-baseline justify-between gap-2">
                                    <div className="text-sm font-bold text-blue-900">
                                      {formatCurrency(categoryTotal)}
                                    </div>
                                    <div className="text-[10px] text-blue-600 font-semibold">
                                      {percentage}%
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Column 2: Total Inflows */}
                      <div className="col-span-2 flex flex-col items-center justify-center py-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-2xl p-4 text-white text-center w-full">
                          <h3 className="text-[10px] font-bold mb-2 uppercase tracking-wider opacity-90">
                            Total Inflows
                          </h3>
                          <p className="text-xl font-bold">
                            {formatCurrency(totalAvailable)}
                          </p>
                        </div>
                        <div className="my-4">
                          <div className="text-3xl text-red-500 font-bold animate-pulse">
                            →
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Outflows with arrows to detailed breakdown */}
                      <div className="col-span-7 space-y-4">
                        <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider pb-1 border-b border-gray-300">
                          Cash Outflows → Detailed Breakdown
                        </h3>
                        {Object.entries(outflowsByCategory).map(
                          ([category, items]) => {
                            const categoryTotal = items.reduce(
                              (sum, item) => sum + item.Amount,
                              0
                            );
                            const percentage =
                              totalAvailable > 0
                                ? (
                                    (categoryTotal / totalAvailable) *
                                    100
                                  ).toFixed(1)
                                : 0;

                            // Group by contact and sum amounts
                            const contactTotals = {};
                            items.forEach((item) => {
                              if (!contactTotals[item.Contact]) {
                                contactTotals[item.Contact] = 0;
                              }
                              contactTotals[item.Contact] += item.Amount;
                            });

                            return (
                              <div
                                key={category}
                                className="flex items-start gap-3"
                              >
                                {/* Outflow Summary */}
                                <div className="flex-shrink-0 w-64 bg-green-50 rounded-lg p-2 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
                                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                                    {category}
                                  </div>
                                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                                    {formatCurrency(categoryTotal)}
                                  </div>
                                  <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                                    {percentage}%
                                  </div>
                                </div>

                                {/* Curved Arrow */}
                                <div className="flex-shrink-0 flex items-center justify-center pt-4">
                                  <svg
                                    width="40"
                                    height="40"
                                    viewBox="0 0 40 40"
                                    className="text-green-500"
                                  >
                                    <path
                                      d="M 5 20 Q 20 20, 30 20"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      fill="none"
                                      markerEnd="url(#arrowhead-usd)"
                                    />
                                    <defs>
                                      <marker
                                        id="arrowhead-usd"
                                        markerWidth="10"
                                        markerHeight="10"
                                        refX="9"
                                        refY="3"
                                        orient="auto"
                                      >
                                        <polygon
                                          points="0 0, 10 3, 0 6"
                                          fill="currentColor"
                                        />
                                      </marker>
                                    </defs>
                                  </svg>
                                </div>

                                {/* Detailed Breakdown */}
                                <div className="flex-1">
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(contactTotals).map(
                                      ([contact, total], idx) => {
                                        const contactPercentage =
                                          categoryTotal > 0
                                            ? (
                                                (total / categoryTotal) *
                                                100
                                              ).toFixed(1)
                                            : 0;
                                        return (
                                          <div
                                            key={`${category}-${idx}`}
                                            className="bg-white rounded-lg p-2 border border-gray-200 hover:border-gray-300 hover:shadow transition-all"
                                          >
                                            <div className="text-[10px] text-gray-600 mb-0.5">
                                              {contact}
                                            </div>
                                            <div className="text-xs font-bold text-gray-900">
                                              {formatCurrency(total)}
                                            </div>
                                            <div className="text-[9px] text-gray-500 mt-0.5">
                                              {contactPercentage}%
                                            </div>
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Bottom Summary */}
                    <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-4 border-2 border-green-300">
                        <h3 className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1">
                          Total Inflows
                        </h3>
                        <p className="text-lg font-bold text-green-900">
                          {formatCurrency(totalInflow)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-4 border-2 border-red-300">
                        <h3 className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">
                          Total Outflows
                        </h3>
                        <p className="text-lg font-bold text-red-900">
                          {formatCurrency(totalOutflow)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-4 border-2 border-blue-300">
                        <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">
                          Net Change
                        </h3>
                        <p
                          className={`text-lg font-bold ${
                            totalInflow - totalOutflow >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {formatCurrency(totalInflow - totalOutflow)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-4 border-2 border-purple-300">
                        <h3 className="text-[10px] font-bold text-purple-700 uppercase tracking-wide mb-1">
                          Closing Balance
                        </h3>
                        <p className="text-lg font-bold text-purple-900">
                          {formatCurrency(closingBalance)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Combined Cashflow Analysis */}
            {sgdSankeyData &&
              usdSankeyData &&
              (() => {
                // Combine SGD data with USD SGD equivalents
                const combinedItems = [
                  ...sgdSankeyData.cashflowItems,
                  ...(usdSankeyData.cashflowItemsSgd || []),
                ];

                const combinedOpeningBalance =
                  sgdOpeningBalance + (usdSankeyData.openingBalanceSgd || 0);

                const totalInflow = combinedItems
                  .filter((item) => item.Type === "Inflow")
                  .reduce((sum, item) => sum + item.Amount, 0);

                const totalOutflow = combinedItems
                  .filter((item) => item.Type === "Outflow")
                  .reduce((sum, item) => sum + item.Amount, 0);

                const closingBalance =
                  combinedOpeningBalance + totalInflow - totalOutflow;
                const totalAvailable = combinedOpeningBalance + totalInflow;

                // Group inflows by category
                const inflowsByCategory = {};
                combinedItems
                  .filter((item) => item.Type === "Inflow")
                  .forEach((item) => {
                    if (!inflowsByCategory[item.Category]) {
                      inflowsByCategory[item.Category] = [];
                    }
                    inflowsByCategory[item.Category].push(item);
                  });

                // Group outflows by category
                const outflowsByCategory = {};
                combinedItems
                  .filter((item) => item.Type === "Outflow")
                  .forEach((item) => {
                    if (!outflowsByCategory[item.Category]) {
                      outflowsByCategory[item.Category] = [];
                    }
                    outflowsByCategory[item.Category].push(item);
                  });

                return (
                  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                    <h2 className="text-lg font-bold mb-6 text-purple-700 pb-3 border-b-2 border-purple-200">
                      Combined Cashflow Analysis (SGD)
                    </h2>

                    <div className="grid grid-cols-12 gap-6 items-start">
                      {/* Column 1: Opening Balance & Inflows */}
                      <div className="col-span-3 space-y-3">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-3 text-white">
                          <h3 className="text-[10px] font-bold mb-1 uppercase tracking-wider opacity-90">
                            Opening Balance
                          </h3>
                          <p className="text-base font-bold">
                            {formatCurrency(combinedOpeningBalance)}
                          </p>
                        </div>

                        <div className="space-y-2 mt-4">
                          <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider pb-1 border-b border-gray-300">
                            Cash Inflows
                          </h3>
                          {Object.entries(inflowsByCategory).map(
                            ([category, items]) => {
                              const categoryTotal = items.reduce(
                                (sum, item) => sum + item.Amount,
                                0
                              );
                              const percentage =
                                totalInflow > 0
                                  ? (
                                      (categoryTotal / totalInflow) *
                                      100
                                    ).toFixed(1)
                                  : 0;
                              return (
                                <div
                                  key={category}
                                  className="bg-purple-50 rounded-lg p-2 border border-purple-200 hover:shadow-md transition-shadow"
                                >
                                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">
                                    {category}
                                  </div>
                                  <div className="flex items-baseline justify-between gap-2">
                                    <div className="text-sm font-bold text-purple-900">
                                      {formatCurrency(categoryTotal)}
                                    </div>
                                    <div className="text-[10px] text-purple-600 font-semibold">
                                      {percentage}%
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Column 2: Total Inflows */}
                      <div className="col-span-2 flex flex-col items-center justify-center py-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-2xl p-4 text-white text-center w-full">
                          <h3 className="text-[10px] font-bold mb-2 uppercase tracking-wider opacity-90">
                            Total Inflows
                          </h3>
                          <p className="text-xl font-bold">
                            {formatCurrency(totalAvailable)}
                          </p>
                        </div>
                        <div className="my-4">
                          <div className="text-3xl text-red-500 font-bold animate-pulse">
                            →
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Outflows with arrows to detailed breakdown */}
                      <div className="col-span-7 space-y-4">
                        <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider pb-1 border-b border-gray-300">
                          Cash Outflows → Detailed Breakdown
                        </h3>
                        {Object.entries(outflowsByCategory).map(
                          ([category, items]) => {
                            const categoryTotal = items.reduce(
                              (sum, item) => sum + item.Amount,
                              0
                            );
                            const percentage =
                              totalAvailable > 0
                                ? (
                                    (categoryTotal / totalAvailable) *
                                    100
                                  ).toFixed(1)
                                : 0;

                            // Group by contact and sum amounts
                            const contactTotals = {};
                            items.forEach((item) => {
                              if (!contactTotals[item.Contact]) {
                                contactTotals[item.Contact] = 0;
                              }
                              contactTotals[item.Contact] += item.Amount;
                            });

                            return (
                              <div
                                key={category}
                                className="flex items-start gap-3"
                              >
                                {/* Outflow Summary */}
                                <div className="flex-shrink-0 w-64 bg-green-50 rounded-lg p-2 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
                                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                                    {category}
                                  </div>
                                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                                    {formatCurrency(categoryTotal)}
                                  </div>
                                  <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                                    {percentage}%
                                  </div>
                                </div>

                                {/* Curved Arrow */}
                                <div className="flex-shrink-0 flex items-center justify-center pt-4">
                                  <svg
                                    width="40"
                                    height="40"
                                    viewBox="0 0 40 40"
                                    className="text-green-500"
                                  >
                                    <path
                                      d="M 5 20 Q 20 20, 30 20"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      fill="none"
                                      markerEnd="url(#arrowhead-combined)"
                                    />
                                    <defs>
                                      <marker
                                        id="arrowhead-combined"
                                        markerWidth="10"
                                        markerHeight="10"
                                        refX="9"
                                        refY="3"
                                        orient="auto"
                                      >
                                        <polygon
                                          points="0 0, 10 3, 0 6"
                                          fill="currentColor"
                                        />
                                      </marker>
                                    </defs>
                                  </svg>
                                </div>

                                {/* Detailed Breakdown */}
                                <div className="flex-1">
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(contactTotals).map(
                                      ([contact, total], idx) => {
                                        const contactPercentage =
                                          categoryTotal > 0
                                            ? (
                                                (total / categoryTotal) *
                                                100
                                              ).toFixed(1)
                                            : 0;
                                        return (
                                          <div
                                            key={`${category}-${idx}`}
                                            className="bg-white rounded-lg p-2 border border-gray-200 hover:border-gray-300 hover:shadow transition-all"
                                          >
                                            <div className="text-[10px] text-gray-600 mb-0.5">
                                              {contact}
                                            </div>
                                            <div className="text-xs font-bold text-gray-900">
                                              {formatCurrency(total)}
                                            </div>
                                            <div className="text-[9px] text-gray-500 mt-0.5">
                                              {contactPercentage}%
                                            </div>
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Bottom Summary */}
                    <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-4 border-2 border-green-300">
                        <h3 className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1">
                          Total Inflows
                        </h3>
                        <p className="text-lg font-bold text-green-900">
                          {formatCurrency(totalInflow)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-4 border-2 border-red-300">
                        <h3 className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-1">
                          Total Outflows
                        </h3>
                        <p className="text-lg font-bold text-red-900">
                          {formatCurrency(totalOutflow)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-4 border-2 border-blue-300">
                        <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">
                          Net Change
                        </h3>
                        <p
                          className={`text-lg font-bold ${
                            totalInflow - totalOutflow >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {formatCurrency(totalInflow - totalOutflow)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-4 border-2 border-purple-300">
                        <h3 className="text-[10px] font-bold text-purple-700 uppercase tracking-wide mb-1">
                          Closing Balance
                        </h3>
                        <p className="text-lg font-bold text-purple-900">
                          {formatCurrency(closingBalance)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {!sgdSankeyData && !usdSankeyData && (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No Cashflow Data Available
                </h3>
                <p className="text-gray-500">
                  Upload SGD and/or USD cashflow data to see detailed cashflow
                  analysis with visual breakdowns
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  💡 Upload both SGD and USD files to see the Combined Cashflow
                  Analysis
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
