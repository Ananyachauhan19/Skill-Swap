import React, { useState, useEffect } from "react";
import api from "../../lib/api";

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
        const res = await api.get("/api/user/devices");
        const list = res?.data?.devices || [];
        setDevices(list);
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
      await api.post(`/api/user/devices/${id}/logout`);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError("Failed to logout from device.");
    }
  };

  const handleLogoutAll = async () => {
    setError("");
    try {
      await api.post("/api/user/devices/logout-all");
      setDevices((prev) => prev.filter((d) => d.current));
    } catch (err) {
      setError("Failed to logout from all devices.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center pt-16 sm:pt-20">
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
                  <span className="text-xs text-gray-500">Last active: {d.lastActive ? new Date(d.lastActive).toLocaleString() : 'Unknown'}</span>
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
