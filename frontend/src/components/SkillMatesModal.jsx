import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSkillMates } from '../context/SkillMatesContext';

const SkillMatesModal = () => {
  const { isOpen, close, list, loading, error, remove } = useSkillMates();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const gotoProfile = (username) => {
    close();
    navigate(`/profile/${username}`);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[1000]" onClick={close} />
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-blue-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-blue-900">Your SkillMates</h2>
            <button onClick={close} className="p-2 rounded-md hover:bg-blue-50 text-blue-700">
              <X size={18} />
            </button>
          </div>
          {loading && (
            <div className="text-sm text-gray-500">Loading...</div>
          )}
          {error && (
            <div className="text-sm text-red-600 mb-2">{error}</div>
          )}
          {!loading && !error && (
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {list.length === 0 ? (
                <div className="text-gray-500 text-sm">No SkillMates yet.</div>
              ) : (
                <ul className="divide-y divide-blue-50">
                  {list.map((u) => (
                    <li key={u._id} className="py-3 flex items-center gap-3">
                      <button
                        onClick={() => gotoProfile(u.username)}
                        className="shrink-0"
                        title={u.username}
                      >
                        <img
                          src={u.profilePic || 'https://placehold.co/40x40?text=U'}
                          alt={u.username}
                          className="w-10 h-10 rounded-full object-cover border border-blue-100"
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => gotoProfile(u.username)}
                          className="block text-left text-blue-900 font-medium hover:underline truncate"
                        >
                          {u.firstName || ''} {u.lastName || ''}
                        </button>
                        <div className="text-gray-500 text-xs truncate">@{u.username}</div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await remove(u._id);
                          } catch (e) {
                            // surface error inside modal minimally
                            alert(e.message || 'Failed to remove');
                          }
                        }}
                        className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SkillMatesModal;
