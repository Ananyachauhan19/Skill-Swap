import React, { useMemo } from 'react';
import { Building2, Users } from 'lucide-react';

const CollegeAssignmentPage = ({ institutes = [], selectedInstitute = null }) => {
  const rows = useMemo(() => {
    return (institutes || []).map((inst) => ({
      id: inst._id,
      name: inst.instituteName,
      instituteId: inst.instituteId,
      type: inst.instituteType,
      studentsCount: inst.studentsCount || 0,
      isSelected: selectedInstitute?._id === inst._id
    }));
  }, [institutes, selectedInstitute?._id]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">College Assignment</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">Your assigned colleges</h1>
        <p className="mt-2 text-sm text-slate-600">
          This page shows the colleges currently assigned to your campus ambassador account.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-900">Assigned Colleges</p>
          <p className="text-[11px] text-slate-500">{rows.length} total</p>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Building2 className="mx-auto text-slate-300" size={36} />
            <p className="mt-2 text-sm text-slate-700 font-semibold">No colleges assigned</p>
            <p className="mt-1 text-xs text-slate-600">If this looks wrong, contact your admin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    College
                  </th>
                  <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="px-4 py-2 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Students
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {rows.map((row) => (
                  <tr key={row.id} className={row.isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3 text-xs text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building2 size={14} className="text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{row.name}</p>
                          {row.isSelected && (
                            <p className="text-[11px] text-slate-500">Selected</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row.instituteId}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 capitalize">{row.type}</td>
                    <td className="px-4 py-3 text-xs text-slate-900 text-right">
                      <span className="inline-flex items-center gap-1 justify-end">
                        <Users size={12} className="text-slate-500" />
                        <span className="font-semibold">{Number(row.studentsCount).toLocaleString()}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeAssignmentPage;
