import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { useWeather } from '../../context/WeatherContext'
import { formatTemp } from '../../utils/weatherUtils'

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card text-sm py-2 px-3 shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === 'Rainfall (mm)' ? `${p.value} mm` : formatTemp(p.value, unit)}
        </p>
      ))}
    </div>
  )
}

export default function HistoricalChart() {
  const { historical, unit } = useWeather()
  if (!historical?.length) return null

  const data = historical.map(d => ({
    date:     new Date(d.date * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    'Max Temp':  Math.round(d.temp.max),
    'Min Temp':  Math.round(d.temp.min),
    'Rainfall (mm)': d.rain || 0,
  }))

  return (
    <div className="card animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">7-Day Historical Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="temp" tick={{ fontSize: 11 }} unit={unit === 'metric' ? '°C' : '°F'} />
          <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 11 }} unit="mm" />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend />
          <Line yAxisId="temp" type="monotone" dataKey="Max Temp" stroke="#f97316" strokeWidth={2} dot={false} />
          <Line yAxisId="temp" type="monotone" dataKey="Min Temp" stroke="#60a5fa" strokeWidth={2} dot={false} />
          <Bar  yAxisId="rain" dataKey="Rainfall (mm)" fill="#93c5fd" radius={[4,4,0,0]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
