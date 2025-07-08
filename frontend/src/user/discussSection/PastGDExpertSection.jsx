import React, { useEffect, useState } from 'react';

const getProfilePic = (profilePic, name) => {
  if (profilePic) return profilePic;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=DBEAFE&color=1E40AF&bold=true`;
};

const PastGDExpertSection = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/api/group-discussions/past-experts')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => setExperts(data))
      .catch(err => setError('Could not load past experts.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="w-full flex flex-col items-center py-12 bg-blue-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-5xl">
        <h4 className="text-xl sm:text-2xl font-bold text-blue-800 mb-6 text-center">Past Experts Who Led Group Discussions</h4>
        {loading ? (
          <div className="text-blue-700 text-lg font-semibold py-12">Loading...</div>
        ) : error ? (
          <div className="text-red-600 text-lg font-semibold py-12">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {experts.length === 0 ? (
              <div className="col-span-full text-gray-500 text-center">No data found</div>
            ) : (
              experts.map((expert, idx) => (
                <div key={idx} className="flex flex-col items-center bg-white rounded-lg shadow p-4 gap-2 border border-blue-100">
                  <img
                    src={getProfilePic(expert.profilePic, expert.name)}
                    alt={expert.name}
                    className="w-14 h-14 rounded-full object-cover border border-blue-200 mb-2"
                  />
                  <div className="font-semibold text-blue-900 text-base text-center">{expert.name}</div>
                  <div className="text-xs text-gray-600 mt-1 text-center">{expert.miniBio}</div>
                  <div className="text-xs text-gray-700 mt-2 text-center font-medium bg-blue-50 rounded p-2 border border-blue-100">{expert.description}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PastGDExpertSection;
