import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import CaseBrowser from './components/CaseBrowser';
import GradingPanel from './components/GradingPanel';
import { processDatasets } from './services/dataProcessor';
import { gradePatientCase } from './services/gemini';

function App() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [isProcessingData, setIsProcessingData] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  
  // Store AI results by patient ID
  const [aiResults, setAiResults] = useState({});
  const [globalError, setGlobalError] = useState(null);

  const handleFilesProcessed = async (files) => {
    setIsProcessingData(true);
    setGlobalError(null);
    try {
      const processedPatients = await processDatasets(files);
      setPatients(processedPatients);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setIsProcessingData(false);
    }
  };

  const handleGradeCase = async (patient) => {
    setIsGrading(true);
    try {
      const result = await gradePatientCase(patient);
      setAiResults(prev => ({
        ...prev,
        [patient.study_id]: result
      }));
    } catch (err) {
      alert("Error generating grading: " + err.message);
    } finally {
      setIsGrading(false);
    }
  };

  if (patients.length === 0) {
    return (
      <>
        {globalError && (
          <div style={{ background: '#ef4444', color: '#fff', padding: '1rem', textAlign: 'center', position: 'absolute', top: 0, width: '100%', zIndex: 50 }}>
            Error processing datasets: {globalError}
          </div>
        )}
        <FileUpload onFilesProcessed={handleFilesProcessed} isProcessing={isProcessingData} />
      </>
    );
  }

  const selectedPatient = patients.find(p => p.study_id === selectedPatientId);

  return (
    <div className="app-container">
      <CaseBrowser 
        patients={patients} 
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId} 
      />
      
      <GradingPanel 
        patient={selectedPatient}
        onGradeCase={handleGradeCase}
        isGrading={isGrading}
        aiResult={aiResults[selectedPatientId]}
      />
    </div>
  );
}

export default App;
