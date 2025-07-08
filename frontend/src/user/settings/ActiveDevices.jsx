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
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Active Devices / Login Activity</h2>
        {error && <div className="text-red-600 text-sm mb-2 text-center">{error}</div>}
        <ul className="flex flex-col gap-4 mb-6">
          {loading ? (
            <li className="text-center text-gray-500">Loading...</li>
          ) : devices.length === 0 ? (
            <li className="text-center text-gray-500">No active devices.</li>
          ) : (
            devices.map((d) => (
              <li key={d.id} className={`flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-lg border ${d.current ? 'border-blue-400 bg-blue-50' : 'border-blue-100 bg-gray-50'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-semibold text-blue-900">{d.device}</span>
                  <span className="text-xs text-gray-500">{d.location}</span>
                  <span className="text-xs text-gray-500">Last active: {d.lastActive}</span>
                  {d.current && <span className="text-xs text-green-600 font-semibold">Current Device</span>}
                </div>
                {!d.current && (
                  <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs" onClick={() => handleLogoutDevice(d.id)}>
                    Logout
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
        <button className="bg-red-600 text-white py-2 rounded hover:bg-red-700 transition w-full font-semibold" onClick={handleLogoutAll} disabled={loading || devices.length === 0}>
          Logout from All Devices
        </button>
      </div>
    </div>
  );
};

export default ActiveDevices;
