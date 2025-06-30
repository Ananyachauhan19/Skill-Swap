import React from "react";

const CertificatesSection = ({ certificates, setCertificates, editMode, onAddClick, onSave, onCancel, autoFocus }) => {
  
  const certArray = Array.isArray(certificates) ? certificates : [];
  // If empty and in edit mode, show a single entry but always update parent state
  React.useEffect(() => {
    if (editMode && certArray.length === 0) {
      setCertificates([{ name: '', issuer: '', year: '', file: null, fileName: '', description: '' }]);
    }
    // eslint-disable-next-line
  }, [editMode]);

  const handleChange = (e, idx) => {
    const { name, value } = e.target;
    setCertificates(certArray.map((cert, i) => i === idx ? { ...cert, [name]: value } : cert));
  };
  const handleAdd = () => setCertificates([...certArray, { name: '', issuer: '', year: '', file: null, fileName: '', description: '' }]);
  const handleRemove = idx => setCertificates(certArray.filter((_, i) => i !== idx));
  const handleFile = (e, idx) => {
    const file = e.target.files[0];
    setCertificates(certArray.map((cert, i) => i === idx ? { ...cert, file, fileName: file ? file.name : '', } : cert));
  };

  return (
    <div className="mb-6 group relative">
      <label className="block font-semibold mb-1">Additional Certificates</label>
      {editMode ? (
        <>
          {certArray.map((cert, idx) => (
            <div key={idx} className="flex flex-col gap-2 mb-4 border border-gray-200 rounded-lg p-3">
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  name="name"
                  placeholder="Certificate Name"
                  value={cert.name || ''}
                  onChange={e => handleChange(e, idx)}
                  className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                  autoFocus={autoFocus && idx === 0}
                />
                <input
                  type="text"
                  name="issuer"
                  placeholder="Issuer/Organization"
                  value={cert.issuer || ''}
                  onChange={e => handleChange(e, idx)}
                  className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                />
                <input
                  type="text"
                  name="year"
                  placeholder="Year"
                  value={cert.year || ''}
                  onChange={e => handleChange(e, idx)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-24"
                />
                <button type="button" onClick={() => handleRemove(idx)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
              </div>
              <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <span className="text-blue-500">📄</span> Upload PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={e => handleFile(e, idx)}
                  />
                </label>
                {cert.fileName && <span className="text-xs text-green-600 ml-2">{cert.fileName}</span>}
              </div>
              <textarea
                name="description"
                placeholder="Description (optional)"
                value={cert.description || ''}
                onChange={e => handleChange(e, idx)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full min-h-[40px]"
                maxLength={500}
              />
            </div>
          ))}
          <button type="button" onClick={handleAdd} className="text-blue-600 underline text-sm hover:text-blue-800 mb-2">+ Add Certificate</button>
          <div className="flex gap-2 mt-2">
            <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md font-medium hover:bg-blue-700 border" onClick={onSave} type="button">Save</button>
            <button className="text-sm bg-gray-100 hover:bg-gray-200 border px-3 py-1 rounded-md font-medium" onClick={onCancel} type="button">Cancel</button>
          </div>
        </>
      ) : (
        <div className="w-full px-1 py-2 text-gray-700 text-base">
          {(!certArray || certArray.length === 0) ? (
            <button className="text-blue-600 underline text-sm hover:text-blue-800 p-0 m-0 bg-transparent border-none outline-none" onClick={onAddClick} type="button">+ Add Certificate</button>
          ) : (
            <ul className="space-y-3">
              {certArray.map((cert, idx) => (
                <li key={idx} className="border-b border-gray-100 pb-2">
                  <div>
                    <span className="font-medium">{cert.name}</span> from <span className="font-medium">{cert.issuer}</span> <span className="text-gray-500">({cert.year})</span>
                    {cert.fileName && <span className="ml-2 text-xs text-green-600">📄 {cert.fileName}</span>}
                  </div>
                  {cert.description && <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{cert.description}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificatesSection;
