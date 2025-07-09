import React, { useState, useEffect } from "react";

// Backend functions:
// async function fetchDevices() {
//   return fetch('/api/user/devices').then(res => res.json());
// }
// async function logoutDevice(id) {
//   return fetch(`/api/user/devices/${id}/logout`, { method: 'POST' });
// }
// async function logoutAllDevices() {
//   return fetch('/api/user/devices/logout-all', { method: 'POST' });
// }

const dummyDevices = [
  {
    id: 1,
    device: "Chrome on Windows",
    location: "Delhi, India",
    lastActive: "2025-07-07 10:30 AM",
    current: true,
  },
  {
    id: 2,
    device: "Safari on iPhone",
    location: "Mumbai, India",
    lastActive: "2025-07-06 09:15 PM",
    current: false,
  },
  {
    id: 3,
    device: "Edge on MacBook",
    location: "Bangalore, India",
    lastActive: "2025-07-05 02:10 PM",
    current: false,
  },
];

const ActiveDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch devices from backend
    async function loadDevices() {
      setLoading(true);
      setError("");
      try {
        // const data = await fetchDevices();
        // setDevices(data);
        setDevices(dummyDevices); // Remove this line when backend is ready
      } catch (err) {
        setError("Failed to load devices.");
      } finally {
        setLoading(false);
      }
    }
    loadDevices();
  }, []);

  const handleLogoutDevice = async (id) => {
    setError("");
    try {
      // await logoutDevice(id);
      setDevices(devices.filter((d) => d.id !== id));
    } catch (err) {
      setError("Failed to logout from device.");
    }
  };

  const handleLogoutAll = async () => {
    setError("");
    try {
      // await logoutAllDevices();
      setDevices([]);
    } catch (err) {
      setError("Failed to logout from all devices.");
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-2xl font-semibold text-blue-900 text-center mb-6">Active Devices / Login Activity</h2>
        {error && <div className="text-red-600 text-sm mb-4 text-center">{error}</div>}
        <ul className="flex flex-col gap-4 mb-6">
          {loading ? (
            <li className="text-center text-blue-600 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </li>
          ) : devices.length === 0 ? (
            <li className="text-center text-blue-600">No active devices.</li>
          ) : (
            devices.map((d) => (
              <li key={d.id} className={`flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-lg border ${d.current ? 'border-blue-400 bg-blue-50' : 'border-blue-100 bg-blue-50'}`}>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-blue-900">{d.device}</span>
                  <span className="text-xs text-blue-600">{d.location}</span>
                  <span className="text-xs text-blue-600">Last active: {d.lastActive}</span>
                  {d.current && <span className="text-xs text-green-600 font-semibold">Current Device</span>}
                </div>
                {!d.current && (
                  <button
                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 transition duration-200"
                    onClick={() => handleLogoutDevice(d.id)}
                  >
                    Logout
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
        <button
          className="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold shadow hover:bg-red-700 transition duration-200 disabled:bg-red-400"
          onClick={handleLogoutAll}
          disabled={loading || devices.length === 0}
        >
          Logout from All Devices
        </button>
      </div>
    </div>
  );
};

export default ActiveDevices;