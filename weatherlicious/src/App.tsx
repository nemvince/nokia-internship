import './App.css'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  Search,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Eye,
  Droplets,
  Thermometer,
  MapPin,
  Loader2,
} from "lucide-react"

interface WeatherData {
  name: string
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
  }
  visibility: number
}

interface ForecastData {
  list: Array<{
    dt: number
    main: {
      temp: number
      humidity: number
    }
    weather: Array<{
      main: string
      description: string
    }>
    dt_txt: string
  }>
}

const API_KEY = "1b674e648abac0f8546ed6824e2e2fd3"

export default function WeatherApp() {
  const [city, setCity] = useState("Budapest")
  const [searchCity, setSearchCity] = useState("")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isCelsius, setIsCelsius] = useState(true)

  const fetchWeatherData = async (cityName: string) => {
    setLoading(true)

    try {
      // Current weather
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`,
      )

      if (!weatherResponse.ok) {
        throw new Error("City not found")
      }

      const weather = await weatherResponse.json()
      setWeatherData(weather)

      // 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`,
      )

      const forecast = await forecastResponse.json()
      setForecastData(forecast)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch weather data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeatherData(city)
  }, [city])

  const handleSearch = () => {
    if (searchCity.trim()) {
      setCity(searchCity.trim())
      setSearchCity("")
    }
  }

  const convertTemp = (temp: number) => {
    return isCelsius ? temp : (temp * 9) / 5 + 32
  }

  const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case "clear":
        return <Sun className="w-16 h-16 text-yellow-500 animate-pulse" />
      case "clouds":
        return <Cloud className="w-16 h-16 text-white animate-pulse" />
      case "rain":
        return <CloudRain className="w-16 h-16 text-blue-500 animate-pulse" />
      case "snow":
        return <CloudSnow className="w-16 h-16 text-blue-200 animate-pulse" />
      case "thunderstorm":
        return <CloudLightning className="w-16 h-16 text-purple-500 animate-pulse" />
      default:
        return <Sun className="w-16 h-16 text-yellow-500" />
    }
  }

  const formatForecastData = () => {
    if (!forecastData) return []

    return forecastData.list.slice(0, 8).map((item) => ({
      time: new Date(item.dt * 1000).toLocaleDateString("en-US", {
        weekday: "short",
        hour: "2-digit",
      }),
      temp: Math.round(convertTemp(item.main.temp)),
      humidity: item.main.humidity,
    }))
  }

  const getDailyForecast = () => {
    if (!forecastData) return []

    const dailyData: { [key: string]: { temps: number[]; humidity: number[]; weather: string } } = {}

    forecastData.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString()
      if (!dailyData[date]) {
        dailyData[date] = { temps: [], humidity: [], weather: item.weather[0].main }
      }
      dailyData[date].temps.push(item.main.temp)
      dailyData[date].humidity.push(item.main.humidity)
    })

    return Object.entries(dailyData)
      .slice(0, 5)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        maxTemp: Math.round(convertTemp(Math.max(...data.temps))),
        minTemp: Math.round(convertTemp(Math.min(...data.temps))),
        avgHumidity: Math.round(data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length),
        weather: data.weather,
      }))
  }

  return (
    <>
      <div className="grow bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">Weatherlicious</h1>

            <div className="flex gap-2 max-w-md mx-auto">
              <Input
                placeholder="Enter city name..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-black/20 text-white dark backdrop-blur-sm"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1">
                <Button
                  variant={isCelsius ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsCelsius(true)}
                  className="text-white"
                >
                  °C
                </Button>
                <Button
                  variant={!isCelsius ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setIsCelsius(false)}
                  className="text-white"
                >
                  °F
                </Button>
              </div>
            </div>
          </div>

          {weatherData && (
            <>
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <MapPin className="w-6 h-6" />
                    {weatherData.name}
                  </CardTitle>
                  <CardDescription className="text-white/80">{weatherData.weather[0].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">{getWeatherIcon(weatherData.weather[0].main)}</div>
                    <div className="text-center">
                      <div className="text-6xl font-bold">{Math.round(convertTemp(weatherData.main.temp))}°</div>
                      <div className="text-xl opacity-80">
                        Feels like {Math.round(convertTemp(weatherData.main.feels_like))}°
                      </div>
                    </div>
                  </div>

                  {/* Weather Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <Wind className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm opacity-80">Wind</div>
                      <div className="font-semibold">{weatherData.wind.speed} m/s</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <Droplets className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm opacity-80">Humidity</div>
                      <div className="font-semibold">{weatherData.main.humidity}%</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <Thermometer className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm opacity-80">Pressure</div>
                      <div className="font-semibold">{weatherData.main.pressure} hPa</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <Eye className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm opacity-80">Visibility</div>
                      <div className="font-semibold">{(weatherData.visibility / 1000).toFixed(1)} km</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Forecast */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Weather Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="hourly" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/20">
                      <TabsTrigger
                        value="hourly"
                        className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
                      >
                        Hourly
                      </TabsTrigger>
                      <TabsTrigger
                        value="daily"
                        className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
                      >
                        5-Day
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="hourly" className="space-y-4">
                      <ChartContainer
                        config={{
                          temp: {
                            label: `Temperature (°${isCelsius ? "C" : "F"})`,
                            color: "hsl(var(--chart-1))",
                          },
                        }}
                        className="h-[300px] w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={formatForecastData()}>
                            <XAxis
                              dataKey="time"
                              tick={{ fill: "white", fontSize: 12, color: "white" }}
                              axisLine={{ stroke: "white" }}
                              tickLine={{ stroke: "white" }}
                            />
                            <YAxis
                              tick={{ fill: "white", fontSize: 12, color: "white" }}
                              axisLine={{ stroke: "white" }}
                              tickLine={{ stroke: "white" }}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                              type="monotone"
                              dataKey="temp"
                              stroke="#ffffff"
                              strokeWidth={3}
                              dot={{ fill: "#ffffff", strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </TabsContent>

                    <TabsContent value="daily" className="space-y-4">
                      <div className="grid gap-3">
                        {getDailyForecast().map((day, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              {getWeatherIcon(day.weather)}
                              <div>
                                <div className="font-semibold text-white">{day.date}</div>
                                <div className="text-sm text-white/80">Humidity: {day.avgHumidity}%</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-white">
                                {day.maxTemp}° / {day.minTemp}°
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
      <div className="dark">
        <Toaster position='top-center' />
      </div>
    </>
  )
}
