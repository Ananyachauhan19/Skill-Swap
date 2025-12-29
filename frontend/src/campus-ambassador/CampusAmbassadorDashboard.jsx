import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Database, Gift, History, PencilLine, School, Upload, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CampusAmbassadorNavbar from './CampusAmbassadorNavbar';
import CollegeAssignmentPage from './CollegeAssignmentPage';
import AssessmentUpload from './AssessmentUpload';
import DistributeCoinsModal from './DistributeCoinsModal';
import ExcelUpload from './ExcelUpload';
import InstituteForm from './InstituteForm';
import InstituteRewardsDashboard from './InstituteRewardsDashboard';
import { useAuth } from '../context/AuthContext';
import { useCampusAmbassador } from '../context/CampusAmbassadorContext';

const SIDEBAR_WIDTH_STORAGE_KEY = 'ca.sidebar.width';
const SELECTED_INSTITUTE_ID_STORAGE_KEY = 'ca.institute.selectedId';
const ACTIVE_PAGE_STORAGE_KEY = 'ca.page.active';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const PAGES = {
  OVERVIEW: 'overview',
  UPLOAD_COLLEGE: 'upload_college',
  UPLOAD_TEST: 'upload_test',
  UPLOAD_STUDENTS: 'upload_students',
  DISTRIBUTE_COINS: 'distribute_coins',
  REWARDS_HISTORY: 'rewards_history',
  EDIT_DETAILS: 'edit_details',
  COLLEGE_ASSIGNMENT: 'college_assignment',
  DATABASE: 'database'
};

const DEFAULT_SIDEBAR_WIDTH = 304; // px
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 420;

const CampusAmbassadorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    institutes,
    selectedInstitute,
    setSelectedInstitute,
    loading,
    error,
    fetchInstitutes,
    createInstitute,
    updateInstitute
  } = useCampusAmbassador();

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
    if (!Number.isFinite(stored) || stored <= 0) return DEFAULT_SIDEBAR_WIDTH;
    return clamp(stored, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH);
  });
  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY) || PAGES.OVERVIEW;
  });

  const isSidebarWide = sidebarWidth >= 340;

  const sidebarRef = useRef(null);
  const resizingRef = useRef(false);

  const universityImage = useMemo(() => {
    return (
      selectedInstitute?.campusBackgroundImage ||
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80'
    );
  }, [selectedInstitute?.campusBackgroundImage]);

  // Check if campus ambassador needs to change password
  useEffect(() => {
    if (user && user.isFirstLogin) {
      navigate('/change-password', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    // Always start in the initial dashboard state (college list + welcome panel).
    // We intentionally do not restore the last selected institute on refresh.
    setSelectedInstitute(null);
    localStorage.removeItem(SELECTED_INSTITUTE_ID_STORAGE_KEY);
    setActivePage(PAGES.OVERVIEW);
    fetchInstitutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, String(activePage));
  }, [activePage]);


  // Sidebar resize handlers
  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!resizingRef.current) return;
      if (!sidebarRef.current) return;
      const sidebarLeft = sidebarRef.current.getBoundingClientRect().left;
      const nextWidth = event.clientX - sidebarLeft;
      setSidebarWidth(clamp(nextWidth, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH));
    };

    const handleMouseUp = () => {
      resizingRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleResizeStart = (event) => {
    event.preventDefault();
    resizingRef.current = true;
  };

  const handleInstituteSelect = (institute) => {
    setSelectedInstitute(institute);
    setActivePage(PAGES.OVERVIEW);
  };

  const menuItems = useMemo(
    () => [
      { key: PAGES.UPLOAD_STUDENTS, label: 'Upload Students', icon: Upload },
      { key: PAGES.DISTRIBUTE_COINS, label: 'Distribute Coins', icon: Gift },
      { key: PAGES.REWARDS_HISTORY, label: 'Rewards History', icon: History },
      { key: PAGES.EDIT_DETAILS, label: 'Edit Details', icon: PencilLine },
      { key: PAGES.DATABASE, label: 'Database', icon: Database }
    ],
    []
  );

  const showProfileHeader = Boolean(selectedInstitute) && activePage !== PAGES.COLLEGE_ASSIGNMENT;

  const handleUpdateInstitute = async (formData) => {
    if (!selectedInstitute?._id) return;
    await updateInstitute(selectedInstitute._id, formData);
    await fetchInstitutes();
  };

  return (
    <div className="h-screen bg-blue-50/40">
      <CampusAmbassadorNavbar
        onOpenCollegeAssignment={() => {
          setSelectedInstitute(null);
          setActivePage(PAGES.COLLEGE_ASSIGNMENT);
        }}
        onOpenUploadCollege={() => {
          setSelectedInstitute(null);
          setActivePage(PAGES.UPLOAD_COLLEGE);
        }}
        onOpenUploadTest={() => {
          setSelectedInstitute(null);
          setActivePage(PAGES.UPLOAD_TEST);
        }}
      />

      <div className="pt-[72px] h-full">
        <div className="h-full flex overflow-hidden">
          {/* Left Sidebar (Resizable + Scrollable) */}
          <aside
            ref={sidebarRef}
            className="relative h-full border-r border-blue-100 bg-white flex-shrink-0"
            style={{ width: sidebarWidth }}
          >
            <div className="h-full overflow-y-auto scrollbar-thin">
              {/* Sidebar Header */}
              <div className="px-4 py-4 border-b border-blue-100">
                <p className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
                  Campus Ambassador
                </p>
                <p
                  className={`mt-1 font-semibold text-blue-950 ${
                    isSidebarWide ? 'text-sm whitespace-normal break-words' : 'text-sm truncate'
                  }`}
                >
                  {user?.name || user?.fullName || 'Dashboard'}
                </p>
              </div>

              {/* Initial Login State: Only college list */}
              {!selectedInstitute ? (
                <div className="p-3">
                  <p className="px-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Assigned Colleges
                  </p>

                  <div className="mt-2 space-y-1">
                    {loading && institutes.length === 0 ? (
                      <div className="px-3 py-10 text-center text-xs text-slate-600">
                        Loading colleges...
                      </div>
                    ) : institutes.length === 0 ? (
                      <div className="px-3 py-10 text-center text-xs text-slate-600">
                        No colleges assigned yet.
                      </div>
                    ) : (
                      institutes.map((institute) => (
                        <button
                          key={institute._id}
                          onClick={() => handleInstituteSelect(institute)}
                          className="w-full text-left rounded-lg border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition px-3 py-2"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {institute.campusBackgroundImage ? (
                                <img
                                  src={institute.campusBackgroundImage}
                                  alt={institute.instituteName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Building2 size={16} className="text-blue-900" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className={`font-semibold text-blue-950 ${
                                  isSidebarWide
                                    ? 'text-sm whitespace-normal break-words leading-snug'
                                    : 'text-xs truncate'
                                }`}
                              >
                                {institute.instituteName}
                              </p>
                              <p
                                className={`text-[11px] text-slate-600 ${
                                  isSidebarWide ? 'whitespace-normal break-words' : 'truncate'
                                }`}
                              >
                                {institute.instituteId}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600">
                                <span className="inline-flex items-center gap-1">
                                  <Users size={12} />
                                  {institute.studentsCount || 0}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 capitalize">
                                  {institute.instituteType}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  {/* College-specific menu only (6 items) */}
                  <div className="px-1">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      {selectedInstitute.instituteName}
                    </p>
                    <p
                      className={`text-[11px] text-slate-500 ${isSidebarWide ? 'whitespace-normal break-words' : 'truncate'}`}
                    >
                      {selectedInstitute.instituteId}
                    </p>
                  </div>

                  <nav className="mt-3 space-y-1">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activePage === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setActivePage(item.key)}
                          className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition border ${
                            isActive
                              ? 'bg-blue-900 text-white border-blue-900'
                              : 'bg-white text-slate-700 border-transparent hover:border-blue-100 hover:bg-blue-50/50'
                          }`}
                        >
                          <Icon size={16} className={isActive ? 'text-white' : 'text-blue-900'} />
                          <span className="font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>

                </div>
              )}
            </div>

            {/* Resize Handle */}
            <div
              onMouseDown={handleResizeStart}
              className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent"
              aria-hidden="true"
            />
          </aside>

          {/* Right Content Area (Dynamic) */}
          <main className="flex-1 h-full overflow-hidden bg-blue-50/20">
            <div className="h-full overflow-y-auto scrollbar-thin">
              {error && (
                <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {activePage === PAGES.UPLOAD_COLLEGE ? (
                <div className="h-[calc(100vh-72px)] flex items-start justify-center px-6 py-6">
                  <div className="w-full max-w-3xl">
                    <InstituteForm
                      variant="page"
                      initialData={null}
                      onSubmit={createInstitute}
                      onClose={() => setActivePage(PAGES.OVERVIEW)}
                    />
                  </div>
                </div>
              ) : activePage === PAGES.UPLOAD_TEST ? (
                <div className="p-6">
                  <div className="rounded-2xl border border-blue-100 bg-white">
                    <div className="px-6 py-4 border-b border-blue-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Assessment</p>
                      <h2 className="mt-1 text-lg font-semibold text-blue-950">Upload Test</h2>
                      <p className="mt-1 text-xs text-slate-600">
                        Upload questions via Excel and assign to institutes.
                      </p>
                    </div>
                    <div className="p-6">
                      <AssessmentUpload
                        institutes={institutes}
                        onUploadSuccess={() => {
                          setActivePage(PAGES.OVERVIEW);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : activePage === PAGES.COLLEGE_ASSIGNMENT ? (
                <div className="p-6">
                  <CollegeAssignmentPage institutes={institutes} selectedInstitute={selectedInstitute} />
                </div>
              ) : !selectedInstitute ? (
                <div className="h-[calc(100vh-72px)] flex items-center justify-center px-6">
                  <div className="w-full max-w-3xl">
                    <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Welcome
                      </p>
                      <h1 className="mt-2 text-xl font-semibold text-blue-950">
                        {user?.name || user?.fullName || 'Campus Ambassador'}
                      </h1>
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                        This dashboard is your workspace to manage assigned colleges. Start by selecting a college
                        from the left sidebar. Once selected, the sidebar will switch to college-specific actions.
                      </p>

                      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                        <p className="text-xs font-semibold text-blue-950">About Campus Ambassador</p>
                        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                          Upload students, distribute coins, review rewards history, update college details, and manage
                          college assignments — all from one place.
                        </p>
                      </div>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                          <p className="text-xs font-semibold text-blue-950">1. Select a college</p>
                          <p className="mt-1 text-[11px] text-slate-600">Choose from your assigned list.</p>
                        </div>
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                          <p className="text-xs font-semibold text-blue-950">2. Use the menu</p>
                          <p className="mt-1 text-[11px] text-slate-600">Upload students, distribute coins, and more.</p>
                        </div>
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                          <p className="text-xs font-semibold text-blue-950">3. Review outcomes</p>
                          <p className="mt-1 text-[11px] text-slate-600">Track coin distributions and history.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {/* University Profile (Top) */}
                  {showProfileHeader && (
                    <section className="relative w-full overflow-hidden rounded-2xl border border-blue-100">
                      <div className="h-[330px] w-full">
                        <img
                          src={universityImage}
                          alt={selectedInstitute.instituteName}
                          className="h-full w-full object-cover object-top"
                        />
                      </div>

                      <div className="absolute inset-0 bg-black/30" />

                      {/* Glass overlay */}
                      <div className="absolute inset-0 flex items-end">
                        <div className="w-full bg-white/20 backdrop-blur-md border-t border-white/20 px-6 py-5">
                          <div className="overflow-hidden">
                            <div className="ca-marquee-ltr whitespace-nowrap">
                              <h2 className="text-2xl md:text-3xl font-semibold text-white">
                                {selectedInstitute.instituteName}
                              </h2>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-white/90">
                            {selectedInstitute.instituteId} · {selectedInstitute.instituteType}
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Stats Tabs */}
                  <section className="rounded-2xl border border-blue-100 bg-white">
                    <div className="px-4 py-3 border-b border-blue-100">
                      <div className="flex flex-wrap gap-2">
                        {[
                          {
                            key: 'gold',
                            label: 'Total Gold Coins',
                            value: selectedInstitute.totalGoldenAssigned || 0
                          },
                          {
                            key: 'silver',
                            label: 'Total Silver Coins',
                            value: selectedInstitute.totalSilverAssigned || 0
                          },
                          {
                            key: 'students',
                            label: 'Total Students',
                            value: selectedInstitute.studentsCount || 0
                          }
                        ].map((stat) => (
                          <div
                            key={stat.key}
                            className="px-3 py-2 rounded-lg border border-blue-100 bg-blue-50/50"
                          >
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                              {stat.label}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-blue-950">
                              {Number(stat.value).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4">
                      {activePage === PAGES.OVERVIEW && (
                        <div className="text-sm text-slate-600">
                          Select an action from the left menu to continue.
                        </div>
                      )}

                      {activePage === PAGES.UPLOAD_STUDENTS && (
                        <ExcelUpload
                          variant="page"
                          instituteId={selectedInstitute._id}
                          instituteName={selectedInstitute.instituteName}
                          instituteType={selectedInstitute.instituteType}
                          onClose={() => setActivePage(PAGES.OVERVIEW)}
                          onSuccess={async () => {
                            await fetchInstitutes();
                            setActivePage(PAGES.OVERVIEW);
                          }}
                        />
                      )}

                      {activePage === PAGES.DISTRIBUTE_COINS && (
                        <DistributeCoinsModal
                          variant="page"
                          institute={selectedInstitute}
                          onClose={() => setActivePage(PAGES.OVERVIEW)}
                          onSuccess={async () => {
                            await fetchInstitutes();
                            setActivePage(PAGES.OVERVIEW);
                          }}
                        />
                      )}

                      {activePage === PAGES.REWARDS_HISTORY && (
                        <InstituteRewardsDashboard
                          variant="page"
                          institute={selectedInstitute}
                          onClose={() => setActivePage(PAGES.OVERVIEW)}
                        />
                      )}

                      {activePage === PAGES.EDIT_DETAILS && (
                        <InstituteForm
                          variant="page"
                          initialData={selectedInstitute}
                          onSubmit={handleUpdateInstitute}
                          onClose={() => setActivePage(PAGES.OVERVIEW)}
                        />
                      )}

                      {activePage === PAGES.DATABASE && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                          <p className="text-xs font-semibold text-blue-950">Database</p>
                          <p className="mt-1 text-[11px] text-slate-600">
                            This section is reserved for future development.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

    </div>
  );
};

export default CampusAmbassadorDashboard;
