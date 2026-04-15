import React, { useState } from 'react';
import { UploadCloud, FileType, CheckCircle, Loader2 } from 'lucide-react';

export default function FileUpload({ onFilesProcessed, isProcessing }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleProcess = () => {
    onFilesProcessed(files);
  };

  // allow manual selection via input
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  return (
    <div className="upload-container">
      <div 
        className={`upload-card ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <UploadCloud className="upload-icon" />
        <h2 className="upload-title">Initialize Workspace</h2>
        <p className="upload-desc">
          Drag and drop the required Kaggle files here: <br/>
          <code>train.csv</code>, <code>train_series_descriptions.csv</code>, and<br/>
          <code>train_label_coordinates.zip (or .csv)</code>
        </p>

        <input 
          type="file" 
          multiple 
          onChange={handleChange} 
          style={{ display: 'none' }} 
          id="file-upload" 
        />
        <label htmlFor="file-upload" className="btn" style={{ cursor: 'pointer', marginBottom: '1rem' }}>
          Select Files Manually
        </label>

        {files.length > 0 && (
          <div className="file-status-list">
            {files.map((file, i) => (
              <div key={i} className="file-status-item">
                <FileType className="file-icon file-loaded" />
                <span>{file.name}</span>
              </div>
            ))}
          </div>
        )}

        <button 
          className="btn btn-primary" 
          onClick={handleProcess}
          disabled={files.length === 0 || isProcessing}
          style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
        >
          {isProcessing ? (
            <><Loader2 className="spinner" size={20} /> Processing Data...</>
          ) : (
            <><CheckCircle size={20} /> Load Datasets</>
          )}
        </button>
      </div>
    </div>
  );
}
