import React from 'react';
import { Activity } from 'lucide-react';

export default function CaseBrowser({ patients, selectedPatientId, onSelectPatient }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Patient Cases</h2>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Sorted by Severity (High to Low)
        </div>
      </div>
      
      <div className="patient-list">
        {patients.map(p => (
          <div 
            key={p.study_id}
            className={`patient-card ${selectedPatientId === p.study_id ? 'active' : ''}`}
            onClick={() => onSelectPatient(p.study_id)}
          >
            <div>
              <div className="patient-id">ID: {p.study_id}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {p.coordinates.length} coords | {p.series.length} series
              </div>
            </div>
            
            {p.severityScore > 0 && (
              <div className="patient-severity-badge">
                <Activity size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }}/>
                {p.severityScore} Sev/Mod
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
