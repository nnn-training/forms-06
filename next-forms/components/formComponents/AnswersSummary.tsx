'use client';

import dynamic from 'next/dynamic';
import {
  Pie,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  Bar,
  LabelList,
  Sector,
  PieSectorShapeProps
} from 'recharts';
import type { Summary } from '@/app/forms/[formId]/responses/page';

export default function AnswersSummary({ summary }: { summary: Summary }) {
  if (summary.totalAnswers === 0) {
    return (
      <p className="block my-1 p-1.5 w-full text-sm text-gray-900 bg-gray-100 rounded-lg">
        回答がありません
      </p>
    );
  }

  switch (summary.questionType) {
    case 'radiobutton': {
      const pieChartData = summary.choiceCounts;
      const PieChart = dynamic(
        () => import('recharts').then((recharts) => recharts.PieChart),
        {
          ssr: false,
        },
      );
      const pieColor = (props: PieSectorShapeProps) => {
        const index = props.index ?? 0;
        const hue = (index * 360) / Math.max(pieChartData.length, 1);
        const fill = `hsl(${hue}, 90%, 50%)`;
        return <Sector {...props} fill={fill} />;
      };
      return (
        <PieChart width={400} height={400} className="m-auto">
          <Pie
            data={pieChartData}
            cx="50%"
            cy="50%"
            outerRadius={120}
            dataKey="value"
            nameKey="choice"
            label
            shape={pieColor}
          >
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      );
    }

    case 'checkboxes': {
      const barChartData = summary.choiceCounts;
      const BarChart = dynamic(
        () => import('recharts').then((recharts) => recharts.BarChart),
        {
          ssr: false,
        },
      );
      const ticks = Math.max(...barChartData.map((data) => data.value)) + 2;
      return (
        <BarChart
          width={600}
          height={200}
          layout="vertical"
          data={barChartData}
          className="m-auto"
          barSize={20}
        >
          <XAxis
            dataKey="value"
            type="number"
            tickCount={ticks}
            allowDecimals={false}
          />
          <YAxis
            className="text-sm"
            dataKey="choice"
            type="category"
            width={100}
          />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8">
            <LabelList dataKey="value" position="right" fill="black" />
          </Bar>
        </BarChart>
      );
    }

    case 'text':
    case 'paragraph': {
      return (
        <>
          <ul>
            {summary.textAnswers.map((answer, key) => (
              <li
                key={key}
                className="block my-1 p-1.5 w-full text-sm text-gray-900 bg-gray-100 rounded-lg whitespace-pre-wrap"
              >
                {answer}
              </li>
            ))}
          </ul>
        </>
      );
    }
  }
}