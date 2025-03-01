import React from 'react';

const statusColors = {
  'pass': 'bg-green-100 text-green-800',
  'in progress': 'bg-yellow-100 text-yellow-800',
  'fail': 'bg-red-100 text-red-800'
};

const AuditTable = ({ data }) => {
  return (
    <table className="min-w-full bg-white border">
      <thead className="bg-gray-200 text-gray-600">
        <tr>
          <th className="py-2 px-4 border">Standard</th>
          <th className="py-2 px-4 border">Element of Performance</th>
          <th className="py-2 px-4 border">Audit Date</th>
          <th className="py-2 px-4 border">Status</th>
          <th className="py-2 px-4 border">Auditor's Snarky Notes</th>
        </tr>
      </thead>
      <tbody>
        {data.map((audit) => (
          <tr key={audit.audit_id}>
            <td className="py-2 px-4 border">{audit.standard_id}</td>
            <td className="py-2 px-4 border">{audit.ep_description}</td>
            <td className="py-2 px-4 border">{audit.audit_date}</td>
            <td className={`py-2 px-4 border ${statusColors[audit.status]}`}>
              {audit.status.toUpperCase()}
            </td>
            <td className="py-2 px-4 border">{audit.notes || "N/A (Someone got lazy.)"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AuditTable;
