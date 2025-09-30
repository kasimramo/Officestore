import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Requests() {
    return (_jsxs("div", { className: "mx-auto container-max px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "Requests" }), _jsx("p", { className: "text-slate-600 mt-1", children: "Track and manage procurement requests" })] }), _jsx("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors", children: "New Request" })] }), _jsx("div", { className: "bg-white rounded-lg border border-slate-200 p-4 mb-6", children: _jsxs("div", { className: "flex flex-wrap gap-4 items-center", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium", children: "All (12)" }), _jsx("button", { className: "px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium", children: "Pending (8)" }), _jsx("button", { className: "px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium", children: "Approved (3)" }), _jsx("button", { className: "px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium", children: "Fulfilled (1)" })] }), _jsx("div", { className: "flex-1 min-w-[200px]", children: _jsx("input", { placeholder: "Search requests...", className: "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" }) })] }) }), _jsx("div", { className: "bg-white rounded-lg border border-slate-200 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-slate-50 border-b border-slate-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Request ID" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Items" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Requester" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Date" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Total" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-200", children: requests.map((request) => (_jsx(RequestRow, { request: request }, request.id))) })] }) }) })] }));
}
function RequestRow({ request }) {
    const statusColors = {
        pending: 'bg-orange-100 text-orange-700',
        approved: 'bg-green-100 text-green-700',
        fulfilled: 'bg-blue-100 text-blue-700',
        rejected: 'bg-red-100 text-red-700'
    };
    return (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "text-sm font-medium text-slate-900", children: ["#", request.id] }) }), _jsxs("td", { className: "px-6 py-4", children: [_jsxs("div", { className: "text-sm text-slate-900", children: [request.items.length, " item(s)"] }), _jsxs("div", { className: "text-sm text-slate-500", children: [request.items[0]?.name, request.items.length > 1 && ` +${request.items.length - 1} more`] })] }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("div", { className: "text-sm text-slate-900", children: request.requester }), _jsx("div", { className: "text-sm text-slate-500", children: request.department })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status]}`, children: request.status.charAt(0).toUpperCase() + request.status.slice(1) }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-slate-500", children: request.date }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium", children: ["$", request.total] }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm", children: [_jsx("button", { className: "text-blue-600 hover:text-blue-700 font-medium mr-3", children: "View" }), request.status === 'pending' && (_jsx("button", { className: "text-green-600 hover:text-green-700 font-medium", children: "Approve" }))] })] }));
}
const requests = [
    {
        id: 'REQ-2024-001',
        items: [{ name: 'Wireless Mouse' }, { name: 'Keyboard' }],
        requester: 'Sarah Chen',
        department: 'Marketing',
        status: 'pending',
        date: '2024-01-15',
        total: '89.98'
    },
    {
        id: 'REQ-2024-002',
        items: [{ name: 'Office Chair' }],
        requester: 'John Doe',
        department: 'Engineering',
        status: 'approved',
        date: '2024-01-14',
        total: '299.99'
    },
    {
        id: 'REQ-2024-003',
        items: [{ name: 'Printer Paper' }, { name: 'Notebooks' }],
        requester: 'Mike Johnson',
        department: 'Operations',
        status: 'fulfilled',
        date: '2024-01-13',
        total: '28.98'
    },
    {
        id: 'REQ-2024-004',
        items: [{ name: 'Standing Desk' }],
        requester: 'Emily Davis',
        department: 'Design',
        status: 'pending',
        date: '2024-01-12',
        total: '199.99'
    },
];
