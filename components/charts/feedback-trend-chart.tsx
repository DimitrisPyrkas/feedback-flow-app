"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface TrendData {
  date: string;  
  count: number; 
}

export function FeedbackTrendChart({ data }: { data: TrendData[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

