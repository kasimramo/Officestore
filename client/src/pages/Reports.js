import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Reports() {
    return (_jsxs("div", { className: "mx-auto container-max px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Reports & Analytics" }), _jsx("p", { className: "text-slate-600 mt-1", children: "Track spending, usage patterns, and organizational insights" })] }), _jsx("div", { className: "bg-white rounded-lg border border-slate-200 p-4 mb-6", children: _jsxs("div", { className: "flex flex-wrap gap-4 items-center", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium", children: "Last 30 Days" }), _jsx("button", { className: "px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium", children: "Last Quarter" }), _jsx("button", { className: "px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium", children: "Last Year" })] }), _jsx("button", { className: "ml-auto bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors", children: "Export Report" })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx(ReportCard, { title: "Total Spending", value: "$12,847", change: "+23%", trend: "up", description: "vs. last month" }), _jsx(ReportCard, { title: "Active Requests", value: "34", change: "-12%", trend: "down", description: "vs. last month" }), _jsx(ReportCard, { title: "Items Purchased", value: "156", change: "+8%", trend: "up", description: "vs. last month" }), _jsx(ReportCard, { title: "Avg. Request Time", value: "2.4 days", change: "-15%", trend: "down", description: "vs. last month" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white rounded-lg border border-slate-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900 mb-4", children: "Monthly Spending Trend" }), _jsx("div", { className: "h-64 bg-slate-50 rounded-md flex items-center justify-center", children: _jsx("span", { className: "text-slate-400", children: "\uD83D\uDCCA Chart Placeholder" }) })] }), _jsxs("div", { className: "bg-white rounded-lg border border-slate-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900 mb-4", children: "Spending by Category" }), _jsx("div", { className: "h-64 bg-slate-50 rounded-md flex items-center justify-center", children: _jsx("span", { className: "text-slate-400", children: "\uD83E\uDD67 Pie Chart Placeholder" }) })] })] }), _jsxs("div", { className: "bg-white rounded-lg border border-slate-200 overflow-hidden", children: [_jsx("div", { className: "px-6 py-4 border-b border-slate-200", children: _jsx("h3", { className: "text-lg font-semibold text-slate-900", children: "Top Categories This Month" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-slate-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Category" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Requests" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Total Spent" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Avg. per Request" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Change" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-200", children: categoryData.map((category, index) => (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-2xl mr-3", children: category.icon }), _jsx("span", { className: "text-sm font-medium text-slate-900", children: category.name })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-slate-900", children: category.requests }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium", children: ["$", category.totalSpent] }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-slate-900", children: ["$", category.avgPerRequest] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `text-sm font-medium ${category.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`, children: category.change }) })] }, index))) })] }) })] })] }));
}
function ReportCard({ title, value, change, trend, description }) {
    const changeColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
    return (_jsx("div", { className: "bg-white rounded-lg border border-slate-200 p-6", children: _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-slate-600", children: title }), _jsxs("div", { className: "flex items-baseline space-x-2", children: [_jsx("p", { className: "text-2xl font-bold text-slate-900", children: value }), _jsx("span", { className: `text-sm font-medium ${changeColor}`, children: change })] }), _jsx("p", { className: "text-xs text-slate-500", children: description })] }) }));
}
const categoryData = [
    {
        name: 'Office Supplies',
        icon: '📝',
        requests: 24,
        totalSpent: '1,247',
        avgPerRequest: '52.00',
        change: '+12%'
    },
    {
        name: 'Furniture',
        icon: '🪑',
        requests: 8,
        totalSpent: '3,456',
        avgPerRequest: '432.00',
        change: '+8%'
    },
    {
        name: 'Electronics',
        icon: '💻',
        requests: 15,
        totalSpent: '2,890',
        avgPerRequest: '192.67',
        change: '-5%'
    },
    {
        name: 'Kitchen Supplies',
        icon: '☕',
        requests: 12,
        totalSpent: '234',
        avgPerRequest: '19.50',
        change: '+15%'
    },
];
