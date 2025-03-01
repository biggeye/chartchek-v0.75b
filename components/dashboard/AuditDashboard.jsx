import React, { useEffect, useState } from 'react';
import AuditTable from './AuditTable';
import axios from 'axios';

const AuditDashboard = () => {
  const [auditData, setAuditData] = useState([]);

  useEffect(() => {
    // This API better not be slow, patience level = Gen Z.
    axios.get('/api/audits')
      .then(response => setAuditData(response.data))
      .catch(err => console.error("API issue detected. Shocking.", err));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Internal Audit Dashboard (Because Quality Doesn't Audit Itself 🙄)
      </h1>
      <AuditTable data={auditData} />
    </div>
  );
};

export default AuditDashboard;
