'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function TestChartPage() {
  // 数据 [1,2,3,4,5] 转换为图表格式
  const data = [
    { name: '点1', value: 1 },
    { name: '点2', value: 2 },
    { name: '点3', value: 3 },
    { name: '点4', value: 4 },
    { name: '点5', value: 5 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">折线图测试</h1>
        <p className="text-gray-600 mb-4">显示数据: [1, 2, 3, 4, 5]</p>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">折线图</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">关于 MCP Chart Server</h3>
          <p className="text-blue-800 text-sm">
            MCP Chart Server 需要在 <strong>Cursor 的 AI 对话界面</strong>中使用。
            在 Cursor 的聊天窗口中输入："帮我生成一个折线图，显示数据 [1,2,3,4,5]"
            MCP 服务器会自动生成图表图片。
          </p>
        </div>
      </div>
    </div>
  );
}

