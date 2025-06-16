
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle, XCircle, Activity, TrendingUp, Filter, RefreshCw, Calendar as CalendarIcon, AlertTriangle, Database, FileText, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ValidationRecord {
  test_case_id: string;
  domain: string;
  stage: string;
  test_case_validation_status: string;
  executed_at: string;
  error_message?: string;
}

interface DashboardStats {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  successRate: number;
  errorRate: number;
  byDomain: Record<string, number>;
  byStage: Record<string, number>;
  recentExecutions: number;
}

const COLORS = {
  gas: "#FF6B35",
  electric: "#4ECDC4", 
  land: "#45B7D1",
  passed: "#10B981",
  failed: "#EF4444",
  create: "#3B82F6",
  update: "#F59E0B",
  delete: "#EF4444",
  primary: "#1E40AF",
  secondary: "#64748B"
};

const STAGE_COLORS = {
  create: "#10B981",
  update: "#F59E0B", 
  delete: "#EF4444"
};

export function Dashboard() {
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: validationData = [], isLoading, refetch } = useQuery<ValidationRecord[]>({
    queryKey: ["/api/validation-csv", refreshKey],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/validation-csv");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 120000, // Auto-refresh every 2 minutes
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  // Get unique values for filters
  const uniqueDomains = useMemo(() => {
    if (!Array.isArray(validationData)) return [];
    const domains = [...new Set(validationData.map(item => item.domain))].filter(Boolean);
    return domains.sort();
  }, [validationData]);

  const uniqueStages = useMemo(() => {
    if (!Array.isArray(validationData)) return [];
    const stages = [...new Set(validationData.map(item => item.stage))].filter(Boolean);
    return stages.sort();
  }, [validationData]);

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (!Array.isArray(validationData)) return [];
    return validationData.filter(item => {
      if (selectedDomain !== "all" && item.domain !== selectedDomain) return false;
      if (selectedStage !== "all" && item.stage !== selectedStage) return false;
      if (selectedStatus !== "all" && item.test_case_validation_status !== selectedStatus) return false;
      
      if (fromDate || toDate) {
        const itemDate = new Date(item.executed_at);
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
      }
      
      return true;
    });
  }, [validationData, selectedDomain, selectedStage, selectedStatus, fromDate, toDate]);

  // Calculate comprehensive stats
  const stats: DashboardStats = useMemo(() => {
    const totalTests = filteredData.length;
    const passedTests = filteredData.filter(item => item.test_case_validation_status === "passed").length;
    const failedTests = filteredData.filter(item => item.test_case_validation_status === "failed").length;
    
    const byDomain = filteredData.reduce((acc, item) => {
      acc[item.domain] = (acc[item.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byStage = filteredData.reduce((acc, item) => {
      acc[item.stage] = (acc[item.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent executions (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentExecutions = filteredData.filter(item => 
      new Date(item.executed_at) >= yesterday
    ).length;
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
      errorRate: totalTests > 0 ? Math.round((failedTests / totalTests) * 100) : 0,
      byDomain,
      byStage,
      recentExecutions
    };
  }, [filteredData]);

  // Chart data
  const domainStageData = useMemo(() => {
    const result: any[] = [];
    uniqueDomains.forEach(domain => {
      const domainData = filteredData.filter(item => item.domain === domain);
      const data: any = { domain };
      
      uniqueStages.forEach(stage => {
        const stageCount = domainData.filter(item => item.stage === stage).length;
        data[stage] = stageCount;
      });
      
      result.push(data);
    });
    return result;
  }, [filteredData, uniqueDomains, uniqueStages]);

  const statusDistributionData = useMemo(() => {
    const passed = filteredData.filter(item => item.test_case_validation_status === "passed").length;
    const failed = filteredData.filter(item => item.test_case_validation_status === "failed").length;
    
    return [
      { name: "Passed", value: passed, color: COLORS.passed },
      { name: "Failed", value: failed, color: COLORS.failed }
    ];
  }, [filteredData]);

  const domainDistributionData = useMemo(() => {
    return Object.entries(stats.byDomain).map(([domain, count]) => ({
      name: domain.charAt(0).toUpperCase() + domain.slice(1),
      value: count,
      color: COLORS[domain as keyof typeof COLORS] || COLORS.secondary
    }));
  }, [stats.byDomain]);

  // Timeline data (last 7 days)
  const timelineData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayData = filteredData.filter(item => {
        const itemDate = new Date(item.executed_at);
        return itemDate.toDateString() === date.toDateString();
      });

      return {
        date: format(date, "MMM dd"),
        passed: dayData.filter(item => item.test_case_validation_status === "passed").length,
        failed: dayData.filter(item => item.test_case_validation_status === "failed").length,
        total: dayData.length
      };
    });
  }, [filteredData]);

  // Recent executions with pagination
  const { paginatedExecutions, totalPages, totalExecutions } = useMemo(() => {
    const sortedData = [...filteredData]
      .sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime());
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, endIndex);
    
    return {
      paginatedExecutions: paginatedData,
      totalPages: Math.ceil(sortedData.length / itemsPerPage),
      totalExecutions: sortedData.length
    };
  }, [filteredData, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDomain, selectedStage, selectedStatus, fromDate, toDate]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getStatusBadge = (status: string) => {
    const isPass = status === "passed";
    return (
      <Badge 
        variant={isPass ? "default" : "destructive"} 
        className={cn(
          "flex items-center gap-1 px-2 py-1",
          isPass ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"
        )}
      >
        {isPass ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getDomainBadge = (domain: string) => {
    const colorClass = {
      gas: "bg-orange-100 text-orange-800",
      electric: "bg-teal-100 text-teal-800",
      land: "bg-blue-100 text-blue-800"
    }[domain] || "bg-gray-100 text-gray-800";
    
    return (
      <Badge className={colorClass}>
        {domain.toUpperCase()}
      </Badge>
    );
  };

  const getStageBadge = (stage: string) => {
    const colorClass = {
      create: "bg-green-100 text-green-800",
      update: "bg-yellow-100 text-yellow-800",
      delete: "bg-red-100 text-red-800"
    }[stage] || "bg-gray-100 text-gray-800";
    
    return (
      <Badge className={colorClass}>
        {stage.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <div className="text-xl font-semibold text-slate-700">Loading Dashboard...</div>
          <div className="text-sm text-slate-500 mt-2">Fetching validation data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-auto">
      <div className="max-w-full mx-auto p-6 space-y-6 min-w-[1200px]">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Test Execution Dashboard</h1>
            <p className="text-slate-600">Real-time monitoring and analytics for Duke Energy validation tests</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <Activity className="w-4 h-4" />
              <span>Auto-refresh: 30s</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filters & Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Domain</label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Domains" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Domains</SelectItem>
                    {uniqueDomains.map(domain => (
                      <SelectItem key={domain} value={domain}>
                        {domain.charAt(0).toUpperCase() + domain.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Stage</label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {uniqueStages.map(stage => (
                      <SelectItem key={stage} value={stage}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedDomain("all");
                    setSelectedStage("all");
                    setSelectedStatus("all");
                    setFromDate(undefined);
                    setToDate(undefined);
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Passed Tests</p>
                  <p className="text-3xl font-bold">{stats.passedTests}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Failed Tests</p>
                  <p className="text-3xl font-bold">{stats.failedTests}</p>
                </div>
                <XCircle className="w-12 h-12 text-red-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Tests</p>
                  <p className="text-3xl font-bold">{stats.totalTests}</p>
                </div>
                <Activity className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold">{stats.successRate}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Error Rate</p>
                  <p className="text-3xl font-bold">{stats.errorRate}%</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Recent (24h)</p>
                  <p className="text-3xl font-bold">{stats.recentExecutions}</p>
                </div>
                <Clock className="w-12 h-12 text-teal-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Domain vs Stage Analysis */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Domain vs Stage Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={domainStageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="domain" />
                  <YAxis />
                  <Tooltip />
                  {uniqueStages.map(stage => (
                    <Bar 
                      key={stage} 
                      dataKey={stage} 
                      fill={STAGE_COLORS[stage as keyof typeof STAGE_COLORS] || COLORS.secondary}
                      name={stage.charAt(0).toUpperCase() + stage.slice(1)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Status Distribution */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Test Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Timeline Trend */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                7-Day Execution Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="failed" 
                    stroke={COLORS.failed} 
                    fill={COLORS.failed}
                    name="Failed"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="passed" 
                    stroke={COLORS.passed} 
                    fill={COLORS.passed}
                    name="Passed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Domain Distribution */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Domain Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={domainDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {domainDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Executions Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Test Executions
              </div>
              <div className="text-sm font-normal text-slate-600">
                {totalExecutions > 0 && (
                  <span>
                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalExecutions)} of {totalExecutions} results
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700">Test Case ID</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Domain</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Stage</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Status</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Executed</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Error Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExecutions.map((execution, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-sm">{execution.test_case_id}</td>
                        <td className="p-3">{getDomainBadge(execution.domain)}</td>
                        <td className="p-3">{getStageBadge(execution.stage)}</td>
                        <td className="p-3">{getStatusBadge(execution.test_case_validation_status)}</td>
                        <td className="p-3 text-sm text-slate-600">{formatTime(execution.executed_at)}</td>
                        <td className="p-3 text-sm">
                          {execution.error_message ? (
                            <span className="text-red-600 font-medium">{execution.error_message}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {paginatedExecutions.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium">No test executions found</p>
                    <p className="text-sm">Try adjusting your filters to see more results</p>
                  </div>
                )}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
