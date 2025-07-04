import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Download, Wifi, Clock, Search, SortAsc, SortDesc } from "lucide-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

interface Network {
  ssid: string
  signal: number
}

interface DataPoint {
  timestamp: string
  networks: Network[]
}

interface ChartDataPoint {
  timestamp: string
  time: string
  [key: string]: string | number | null
}

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#ff00ff",
  "#00ffff",
  "#ff0000",
  "#0000ff",
  "#ffff00",
]

export default function WiFiMonitor() {
  const [isAttempting, setIsAttempting] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [allData, setAllData] = useState<DataPoint[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [selectedNetworks, setSelectedNetworks] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<"ssid" | "signal">("signal")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [wsUrl, setWsUrl] = useState("ws://localhost:8000")

  const wsRef = useRef<WebSocket | null>(null)

  // Get latest networks data
  const getLatestNetworks = useCallback(() => {
    if (allData.length === 0) return []
    return allData[allData.length - 1].networks
  }, [allData])

  // Process chart data
  const processChartData = useCallback(() => {
    const chartPoints: ChartDataPoint[] = allData.map((dataPoint) => {
      const point: ChartDataPoint = {
        timestamp: dataPoint.timestamp,
        time: new Date(dataPoint.timestamp).toLocaleTimeString(),
      }

      selectedNetworks.forEach((ssid) => {
        const network = dataPoint.networks.find((n) => n.ssid === ssid)
        point[ssid] = network ? network.signal : null
      })

      return point
    })

    console.log('setting chart data', chartPoints)
    setChartData(chartPoints)
  }, [allData, selectedNetworks])

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    setIsAttempting(true)

    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        console.log("Connected to WebSocket")
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === "history") {
            setAllData(message.data)
            setLastUpdated(new Date().toISOString())
          } else if (message.type === "new_scan") {
            setAllData((prev) => [...prev, message.data])
            setLastUpdated(message.data.timestamp)
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        console.log("WebSocket connection closed")
      }

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error)
        setIsConnected(false)
      }
    } catch (error) {
      console.error("Error connecting to WebSocket:", error)
    } finally {
      setIsAttempting(false)
    }
  }, [wsUrl])

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (allData.length === 0) return

    const csvRows = []
    csvRows.push("Timestamp,SSID,Signal")

    allData.forEach((dataPoint) => {
      dataPoint.networks.forEach((network) => {
        csvRows.push(`${dataPoint.timestamp},${network.ssid || "Hidden"},${network.signal}`)
      })
    })

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `wifi-data-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, [allData])

  // Toggle network selection for chart
  const toggleNetworkSelection = (ssid: string) => {
    const newSelection = new Set(selectedNetworks)
    if (newSelection.has(ssid)) {
      newSelection.delete(ssid)
    } else {
      newSelection.add(ssid)
    }
    setSelectedNetworks(newSelection)
  }

  // Filter and sort networks
  const filteredAndSortedNetworks = getLatestNetworks()
    .filter((network) => (network.ssid || "Hidden").toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aValue = sortField === "ssid" ? a.ssid || "Hidden" : a.signal
      const bValue = sortField === "ssid" ? b.ssid || "Hidden" : b.signal

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  useEffect(() => {
    processChartData()
  }, [processChartData])

  useEffect(() => {
    return () => {
      disconnectWebSocket()
    }
  }, [disconnectWebSocket])

  useEffect(connectWebSocket, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 to-violet-200 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">WiFi Network Monitor</h1>
            <p className="text-muted-foreground">Real-time WiFi signal strength monitoring</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="WebSocket URL"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                className="w-48 bg-card/80"
              />
              <Button
                onClick={isConnected ? disconnectWebSocket : connectWebSocket}
                variant={isConnected ? "destructive" : "default"}
                disabled={isAttempting}
              >
                {isAttempting ? "Connecting..." : (isConnected ? "Disconnect" : "Connect")}
              </Button>
            </div>
            <Button onClick={exportToCSV} disabled={allData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Networks Detected</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getLatestNetworks().length}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Never"}
                {lastUpdated ? `, ${dayjs(lastUpdated).from(dayjs())}` : null}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Signal Strength Over Time</CardTitle>
            <CardDescription>
              Select networks below to display on the chart. Signal strength is measured in dBm.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis domain={[-100, -30]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(value) => `Time: ${value}`}
                    formatter={(value: any, name: string) => [`${value} dBm`, name]}
                  />
                  <Legend />
                  {Array.from(selectedNetworks).map((ssid, index) => (
                    <Line
                      key={ssid}
                      type="monotone"
                      dataKey={ssid}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Networks List */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Network List</CardTitle>
            <CardDescription>
              Search and sort detected networks. Check networks to display on the chart.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search networks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Select value={sortField} onValueChange={(value: "ssid" | "signal") => setSortField(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ssid">SSID</SelectItem>
                    <SelectItem value="signal">Signal</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                >
                  {sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Networks Grid */}
            <ScrollArea className="h-96">
              <div className="grid gap-2">
                {filteredAndSortedNetworks.map((network, index) => {
                  const ssid = network.ssid || "Hidden Network"
                  const isSelected = selectedNetworks.has(network.ssid)

                  return (
                    <div
                      key={`${ssid}-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleNetworkSelection(network.ssid)} />
                        <div>
                          <div className="font-medium">{ssid}</div>
                          <div className="text-sm text-gray-500">Signal: {network.signal} dBm</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            network.signal > -50 ? "default" : network.signal > -70 ? "secondary" : "destructive"
                          }
                        >
                          {network.signal > -50 ? "Excellent" : network.signal > -70 ? "Good" : "Weak"}
                        </Badge>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.max(0, Math.min(100, (network.signal + 100) * 2))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
