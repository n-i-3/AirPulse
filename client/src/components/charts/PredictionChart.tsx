'use client';

import {
    Area,
    AreaChart,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const data = [
    { time: '00:00', aqi: 120, predicted: 120, range: [110, 130] },
    { time: '02:00', aqi: 135, predicted: 135, range: [125, 145] },
    { time: '04:00', aqi: 150, predicted: 150, range: [140, 160] },
    { time: '06:00', aqi: 180, predicted: 180, range: [170, 190] },
    { time: '08:00', aqi: 250, predicted: 250, range: [240, 260] },
    { time: '10:00', aqi: 280, predicted: 280, range: [270, 290] },
    { time: '12:00', aqi: 260, predicted: 260, range: [250, 270] },
    { time: '14:00', aqi: 240, predicted: 240, range: [230, 250] },
    { time: '16:00', aqi: null, predicted: 230, range: [210, 250] }, // Forecast starts
    { time: '18:00', aqi: null, predicted: 220, range: [190, 250] },
    { time: '20:00', aqi: null, predicted: 210, range: [170, 250] },
    { time: '22:00', aqi: null, predicted: 200, range: [150, 250] },
    { time: '00:00', aqi: null, predicted: 190, range: [130, 250] },
];

interface PredictionChartProps {
    currentAqi: number;
}

export function PredictionChart({ currentAqi }: PredictionChartProps) {
    // Regenerate data based on currentAqi (Pseudo-simulation for demo)
    const dynamicData = data.map(d => {
        if (d.aqi !== null) return d; // Historical stays same (mock)
        // Adjust prediction curve relative to currentAqi
        const timeOffset = parseInt(d.time.split(':')[0]) - 16;
        const trend = Math.sin(timeOffset) * 20;
        const predictedVal = currentAqi + trend;
        return {
            ...d,
            predicted: Math.round(predictedVal),
            range: [Math.round(predictedVal - 20), Math.round(predictedVal + 20)]
        };
    });

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dynamicData}>
                    <defs>
                        <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="#666"
                        tick={{ fill: '#666', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="#666"
                        tick={{ fill: '#666', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                        itemStyle={{ fontSize: 12 }}
                    />
                    {/* Confidence Interval (Simulated) */}
                    <Area
                        type="monotone"
                        dataKey="range"
                        stroke="none"
                        fill="#8b5cf6"
                        fillOpacity={0.1}
                    />
                    {/* Historical Data */}
                    <Area
                        type="monotone"
                        dataKey="aqi"
                        stroke="#10b981"
                        fill="url(#colorAqi)"
                        strokeWidth={2}
                    />
                    {/* Prediction Line */}
                    <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#8b5cf6"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                        animateNewValues={true}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
