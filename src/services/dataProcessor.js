import Papa from 'papaparse';
import JSZip from 'jszip';

export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const parseZipFile = async (zipFile, expectedFileName) => {
  const zip = await JSZip.loadAsync(zipFile);
  
  // Find the file that matches the expected name (might be inside a folder)
  const files = Object.keys(zip.files);
  const targetFileKey = files.find(f => f.endsWith(expectedFileName));
  
  if (!targetFileKey) {
    throw new Error(`Could not find ${expectedFileName} inside the zip file.`);
  }

  const csvString = await zip.files[targetFileKey].async('string');
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err)
    });
  });
};

export const processDatasets = async (files) => {
  let trainData = null;
  let seriesData = null;
  let coordsData = null;

  for (const file of files) {
    if (file.name.includes('train.csv')) {
      trainData = await parseCSV(file);
    } else if (file.name.includes('series_descriptions.csv')) {
      seriesData = await parseCSV(file);
    } else if (file.name.includes('train_label_coordinates') && file.name.endsWith('.csv')) {
      coordsData = await parseCSV(file);
    } else if (file.name.includes('train_label_coordinates') && file.name.endsWith('.zip')) {
      coordsData = await parseZipFile(file, 'train_label_coordinates.csv');
    } else if (file.name.endsWith('.zip')) {
      // Try to see if this zip contains coordinates
      try {
        coordsData = await parseZipFile(file, 'train_label_coordinates.csv');
      } catch (e) {
        // Not the coordinates file
      }
    }
  }

  if (!trainData) throw new Error("Missing train.csv");
  if (!seriesData) throw new Error("Missing series_descriptions.csv (you uploaded " + files.map(f => f.name).join(', ') + ")");
  if (!coordsData) throw new Error("Missing train_label_coordinates.csv (or .zip)");

  const patients = new Map();

  // 1. Process Train Data
  for (const row of trainData) {
    const studyId = row.study_id;
    if (!studyId) continue;
    
    let severityScore = 0;
    const conditions = {};

    Object.keys(row).forEach(key => {
      if (key !== 'study_id') {
        const val = row[key];
        conditions[key] = val;
        if (val === 'Moderate' || val === 'Severe') {
          severityScore++;
        }
      }
    });

    patients.set(studyId, {
      study_id: studyId,
      severityScore,
      conditions,
      series: [],
      coordinates: []
    });
  }

  // 2. Attach Series
  for (const row of seriesData) {
    const studyId = row.study_id;
    if (patients.has(studyId)) {
      patients.get(studyId).series.push({
        series_id: row.series_id,
        description: row.series_description
      });
    }
  }

  // 3. Attach Coordinates
  for (const row of coordsData) {
    const studyId = row.study_id;
    if (patients.has(studyId)) {
      patients.get(studyId).coordinates.push({
        series_id: row.series_id,
        instance_number: row.instance_number,
        condition: row.condition,
        level: row.level,
        x: row.x,
        y: row.y
      });
    }
  }

  // Convert to array and sort by highest severity first
  const patientsArray = Array.from(patients.values());
  patientsArray.sort((a, b) => b.severityScore - a.severityScore);

  return patientsArray;
};
