import React from 'react';
import { Brain, FileText, Loader2 } from 'lucide-react';

const LEVELS = ['l1_l2', 'l2_l3', 'l3_l4', 'l4_l5', 'l5_s1'];
const CONDITIONS = [
  { id: 'spinal_canal_stenosis', label: 'Spinal Canal Stenosis' },
  { id: 'left_neural_foraminal_narrowing', label: 'Left Neural Foraminal Narrowing' },
  { id: 'right_neural_foraminal_narrowing', label: 'Right Neural Foraminal Narrowing' },
  { id: 'left_subarticular_stenosis', label: 'Left Subarticular Stenosis' },
  { id: 'right_subarticular_stenosis', label: 'Right Subarticular Stenosis' }
];

const formatLevel = (level) => level.toUpperCase().replace('_', '-');

const GradeBadge = ({ grade }) => {
  if (!grade) return <span className="badge badge-unknown">N/A</span>;
  
  let className = "badge badge-unknown";
  if (grade === "Normal/Mild") className = "badge badge-normal";
  if (grade === "Moderate") className = "badge badge-moderate";
  if (grade === "Severe") className = "badge badge-severe";
  
  return <span className={className}>{grade}</span>;
}

export default function GradingPanel({ patient, onGradeCase, isGrading, aiResult }) {
  if (!patient) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3>Select a patient to view details</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="topbar">
        <div className="patient-header-info">
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>Patient {patient.study_id}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {patient.series.length} MRI Series • {patient.coordinates.length} Annotated Coordinates
            </div>
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => onGradeCase(patient)}
          disabled={isGrading}
        >
          {isGrading ? (
            <><Loader2 className="spinner" size={18} /> Grading...</>
          ) : (
            <><Brain size={18} /> AI Grade Case</>
          )}
        </button>
      </div>

      <div className="panel-grid">
        
        {aiResult && aiResult.explanation && (
          <div style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-primary)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
              <Brain size={20} /> AI Synthesis
            </div>
            <p style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>{aiResult.explanation}</p>
          </div>
        )}

        {LEVELS.map(level => (
          <div key={level} className="level-section">
            <div className="level-header">Level {formatLevel(level)}</div>
            
            <div className="condition-row" style={{ background: 'rgba(0,0,0,0.3)', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div className="cond-name">Condition</div>
              <div className="cond-value">Ground Truth (CSV)</div>
              <div className="cond-ai">AI Second Opinion</div>
            </div>

            {CONDITIONS.map(cond => {
              const key = `${cond.id}_${level}`;
              const groundTruth = patient.conditions[key];
              const aiGrade = aiResult ? aiResult.grades[key] : null;

              return (
                <div key={key} className="condition-row">
                  <div className="cond-name">{cond.label}</div>
                  <div className="cond-value">
                    <GradeBadge grade={groundTruth} />
                  </div>
                  <div className="cond-ai">
                    {isGrading ? (
                      <div className="ai-loading"><Loader2 className="spinner" size={14}/> processing...</div>
                    ) : (
                      <GradeBadge grade={aiGrade} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
