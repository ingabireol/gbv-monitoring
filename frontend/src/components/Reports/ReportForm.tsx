import React, { useState } from 'react';
import { useCreateReportMutation } from '../../store/api';

const ReportForm = () => {
  const [type, setType] = useState('GBV');
  const [description, setDescription] = useState('');
  const [victimName, setVictimName] = useState('');
  const [victimGender, setVictimGender] = useState('');
  const [victimAge, setVictimAge] = useState('');
  const [victimAddress, setVictimAddress] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [createReport, { isLoading, error }] = useCreateReportMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('type', type);
    formData.append('description', description);
    formData.append('victimName', victimName);
    formData.append('victimGender', victimGender);
    formData.append('victimAge', victimAge);
    formData.append('victimAddress', victimAddress);
    formData.append('incidentDate', incidentDate);
    formData.append('incidentLocation', victimAddress);
    if (files) {
      Array.from(files).forEach(file => formData.append('files', file));
    }
    await createReport(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={victimName} onChange={e => setVictimName(e.target.value)} placeholder="Victim Name" />
      <input value={victimGender} onChange={e => setVictimGender(e.target.value)} placeholder="Gender" />
      <input value={victimAge} onChange={e => setVictimAge(e.target.value)} placeholder="Age" />
      <input value={victimAddress} onChange={e => setVictimAddress(e.target.value)} placeholder="Address" />
      <input type="date" max={new Date().toISOString().slice(0, 10)} value={incidentDate} onChange={e => setIncidentDate(e.target.value)} />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="GBV">GBV</option>
        <option value="CA">CA</option>
        <option value="ANON">ANON</option>
      </select>
      <input type="file" multiple onChange={e => setFiles(e.target.files)} />
      <button type="submit" disabled={isLoading}>Submit Report</button>
      {error && <div>Submission failed</div>}
    </form>
  );
};

export default ReportForm;
