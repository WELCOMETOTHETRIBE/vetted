"use client"

import { useEffect, useRef, useState } from 'react'

// Advanced Progress Ring Component
export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className = "",
  showValue = true,
  label = ""
}: {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
  label?: string
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress)
    }, 100)
    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--surface-tertiary))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--brand-primary))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px hsl(var(--brand-primary) / 0.3))`
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <div className="text-2xl font-bold text-content-primary">
            {Math.round(animatedProgress)}%
          </div>
        )}
        {label && (
          <div className="text-sm text-content-secondary mt-1">
            {label}
          </div>
        )}
      </div>
    </div>
  )
}

// Interactive Bar Chart
export function InteractiveBarChart({
  data,
  className = "",
  height = 300
}: {
  data: Array<{ label: string; value: number; color?: string }>
  className?: string
  height?: number
}) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-end justify-between h-64 gap-2">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100
          const isHovered = hoveredBar === index

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center group cursor-pointer"
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Value label */}
              <div className={`text-sm font-medium mb-2 transition-all duration-300 ${
                isHovered ? 'text-content-primary scale-110' : 'text-content-secondary'
              }`}>
                {item.value}
              </div>

              {/* Bar */}
              <div className="w-full max-w-12 relative">
                <div
                  className={`w-full bg-gradient-to-t rounded-t-lg transition-all duration-500 ease-out ${
                    isHovered ? 'from-primary-400 to-primary-500' : 'from-primary-300 to-primary-400'
                  }`}
                  style={{
                    height: `${percentage}%`,
                    minHeight: '8px',
                    transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                    boxShadow: isHovered ? '0 4px 20px hsl(var(--brand-primary) / 0.3)' : 'none'
                  }}
                />

                {/* Hover effect */}
                {isHovered && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-surface-elevated px-2 py-1 rounded text-xs font-medium shadow-lg border border-surface-tertiary">
                    {item.label}: {item.value}
                  </div>
                )}
              </div>

              {/* X-axis label */}
              <div className="text-xs text-content-tertiary mt-2 text-center leading-tight">
                {item.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Animated Counter with Formatting
export function AnimatedCounter({
  value,
  duration = 2000,
  formatter = (val: number) => val.toLocaleString(),
  className = ""
}: {
  value: number
  duration?: number
  formatter?: (value: number) => string
  className?: string
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.floor(easeOutCubic * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, duration])

  return (
    <span className={className}>
      {formatter(displayValue)}
    </span>
  )
}

// Real-time Sparkline Chart
export function SparklineChart({
  data,
  width = 200,
  height = 60,
  color = "hsl(var(--brand-primary))",
  className = ""
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    if (data.length < 2) return

    const maxValue = Math.max(...data)
    const minValue = Math.min(...data)
    const range = maxValue - minValue || 1

    // Draw line
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()

    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - minValue) / range) * (height - 20) - 10

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Fill area under curve
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = `${color}20`
    ctx.fill()

    // Draw points
    ctx.fillStyle = color
    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - minValue) / range) * (height - 20) - 10

      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    })

  }, [data, width, height, color])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const index = Math.round((x / width) * (data.length - 1))

    if (index >= 0 && index < data.length) {
      const maxValue = Math.max(...data)
      const minValue = Math.min(...data)
      const range = maxValue - minValue || 1
      const y = height - ((data[index] - minValue) / range) * (height - 20) - 10

      setHoveredPoint({ x, y, value: data[index] })
    } else {
      setHoveredPoint(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair"
      />

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute bg-surface-elevated px-2 py-1 rounded text-xs font-medium shadow-lg border border-surface-tertiary pointer-events-none z-10"
          style={{
            left: hoveredPoint.x + 10,
            top: hoveredPoint.y - 30,
            transform: 'translateX(-50%)'
          }}
        >
          {hoveredPoint.value}
        </div>
      )}
    </div>
  )
}

// Heatmap Calendar Component
export function ActivityHeatmap({
  data,
  className = ""
}: {
  data: Array<{ date: string; value: number }>
  className?: string
}) {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; value: number; x: number; y: number } | null>(null)

  // Generate calendar grid
  const generateCalendar = () => {
    const today = new Date()
    const calendar = []

    // Generate 52 weeks
    for (let week = 0; week < 52; week++) {
      const weekData = []
      for (let day = 0; day < 7; day++) {
        const date = new Date(today)
        date.setDate(today.getDate() - (51 - week) * 7 - (6 - day))

        const dateStr = date.toISOString().split('T')[0]
        const dataPoint = data.find(d => d.date === dateStr)

        weekData.push({
          date: dateStr,
          value: dataPoint?.value || 0,
          day: date.getDay()
        })
      }
      calendar.push(weekData)
    }

    return calendar
  }

  const calendar = generateCalendar()
  const maxValue = Math.max(...data.map(d => d.value))

  const getIntensityColor = (value: number) => {
    const intensity = value / maxValue
    if (intensity === 0) return 'bg-surface-tertiary'
    if (intensity < 0.25) return 'bg-primary-200'
    if (intensity < 0.5) return 'bg-primary-300'
    if (intensity < 0.75) return 'bg-primary-400'
    return 'bg-primary-500'
  }

  return (
    <div className={`relative ${className}`}>
      <div className="grid grid-cols-53 gap-1">
        {/* Day labels */}
        <div className="col-span-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-3 text-xs text-content-tertiary leading-3">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {calendar.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary-400 hover:ring-opacity-50 ${getIntensityColor(day.value)}`}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setHoveredCell({
                    date: day.date,
                    value: day.value,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  })
                }}
                onMouseLeave={() => setHoveredCell(null)}
                title={`${day.date}: ${day.value} activities`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed bg-surface-elevated px-3 py-2 rounded-lg text-sm shadow-xl border border-surface-tertiary pointer-events-none z-50"
          style={{
            left: hoveredCell.x,
            top: hoveredCell.y,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="font-medium">{new Date(hoveredCell.date).toLocaleDateString()}</div>
          <div className="text-content-secondary">{hoveredCell.value} activities</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-xs text-content-tertiary">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-surface-tertiary"></div>
          <div className="w-3 h-3 rounded-sm bg-primary-200"></div>
          <div className="w-3 h-3 rounded-sm bg-primary-300"></div>
          <div className="w-3 h-3 rounded-sm bg-primary-400"></div>
          <div className="w-3 h-3 rounded-sm bg-primary-500"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

// Gauge Chart Component
export function GaugeChart({
  value,
  max = 100,
  size = 200,
  className = "",
  label = "",
  color = "hsl(var(--brand-primary))"
}: {
  value: number
  max?: number
  size?: number
  className?: string
  label?: string
  color?: string
}) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  const percentage = (animatedValue / max) * 100
  const angle = (percentage / 100) * 180 - 90 // -90 to +90 degrees
  const radius = size / 2 - 20

  // Calculate needle position
  const needleX = Math.cos((angle * Math.PI) / 180) * (radius * 0.8)
  const needleY = Math.sin((angle * Math.PI) / 180) * (radius * 0.8)

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size / 2 + 40} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${size/2 - radius} ${size/2} A ${radius} ${radius} 0 0 1 ${size/2 + radius} ${size/2}`}
          stroke="hsl(var(--surface-tertiary))"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />

        {/* Progress arc */}
        <path
          d={`M ${size/2 - radius} ${size/2} A ${radius} ${radius} 0 0 1 ${size/2 + radius} ${size/2}`}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * (radius * Math.PI)} ${radius * Math.PI * 2}`}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`
          }}
        />

        {/* Center dot */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r="8"
          fill={color}
          className="drop-shadow-lg"
        />

        {/* Needle */}
        <line
          x1={size / 2}
          y1={size / 2}
          x2={size / 2 + needleX}
          y2={size / 2 + needleY}
          stroke="hsl(var(--content-primary))"
          strokeWidth="3"
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out drop-shadow-sm"
        />
      </svg>

      {/* Value display */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
        <div className="text-3xl font-bold text-content-primary">
          {Math.round(percentage)}%
        </div>
        {label && (
          <div className="text-sm text-content-secondary mt-1">
            {label}
          </div>
        )}
      </div>
    </div>
  )
}

// Metric Card with Trend Indicator
export function MetricCard({
  title,
  value,
  previousValue,
  format = "number",
  suffix = "",
  icon,
  className = ""
}: {
  title: string
  value: number
  previousValue?: number
  format?: "number" | "currency" | "percentage"
  suffix?: string
  icon?: React.ReactNode
  className?: string
}) {
  const formatValue = (val: number) => {
    let formattedValue: string
    switch (format) {
      case "currency":
        formattedValue = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD"
        }).format(val)
        break
      case "percentage":
        formattedValue = `${val}%`
        break
      default:
        formattedValue = val.toLocaleString()
        break
    }
    return suffix ? `${formattedValue} ${suffix}` : formattedValue
  }

  const trend = previousValue ? ((value - previousValue) / previousValue) * 100 : 0
  const isPositive = trend >= 0

  return (
    <div className={`card-modern p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-content-secondary">{title}</h3>
        {icon && <div className="text-content-tertiary">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <div className="text-3xl font-bold text-content-primary">
          <AnimatedCounter value={value} formatter={formatValue} />
        </div>

        {previousValue && (
          <div className={`text-sm font-medium flex items-center gap-1 ${
            isPositive ? 'text-success-600' : 'text-error-600'
          }`}>
            <svg
              className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      {previousValue && (
        <div className="text-sm text-content-tertiary">
          vs {formatValue(previousValue)} last period
        </div>
      )}
    </div>
  )
}

// Network Graph Visualization (simplified)
export function NetworkGraph({
  nodes,
  connections,
  className = ""
}: {
  nodes: Array<{ id: string; label: string; x: number; y: number; size?: number }>
  connections: Array<{ from: string; to: string }>
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<typeof nodes[0] | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 800
    canvas.height = 600

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw connections
    ctx.strokeStyle = 'hsl(var(--surface-tertiary))'
    ctx.lineWidth = 2
    connections.forEach(({ from, to }) => {
      const fromNode = nodes.find(n => n.id === from)
      const toNode = nodes.find(n => n.id === to)

      if (fromNode && toNode) {
        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        ctx.lineTo(toNode.x, toNode.y)
        ctx.stroke()
      }
    })

    // Draw nodes
    nodes.forEach(node => {
      const size = node.size || 20
      const isHovered = hoveredNode?.id === node.id

      // Node circle
      ctx.fillStyle = isHovered ? 'hsl(var(--brand-primary))' : 'hsl(var(--brand-secondary))'
      ctx.beginPath()
      ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
      ctx.fill()

      // Node border
      ctx.strokeStyle = 'hsl(var(--surface-primary))'
      ctx.lineWidth = 2
      ctx.stroke()

      // Node label
      ctx.fillStyle = 'hsl(var(--content-primary))'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(node.label, node.x, node.y + size + 15)
    })

  }, [nodes, connections, hoveredNode])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const hovered = nodes.find(node => {
      const dx = x - node.x
      const dy = y - node.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance <= (node.size || 20)
    })

    setHoveredNode(hovered || null)
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        className="border border-surface-tertiary rounded-lg cursor-pointer"
      />

      {/* Tooltip */}
      {hoveredNode && (
        <div className="absolute bg-surface-elevated px-3 py-2 rounded-lg text-sm shadow-xl border border-surface-tertiary pointer-events-none z-10">
          <div className="font-medium">{hoveredNode.label}</div>
          <div className="text-content-secondary">Connections: {
            connections.filter(c => c.from === hoveredNode.id || c.to === hoveredNode.id).length
          }</div>
        </div>
      )}
    </div>
  )
}
