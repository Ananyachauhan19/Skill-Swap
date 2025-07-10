import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement
);

const Analytics = () => {
  const [videos, setVideos] = useState([]);
  const [skillmates, setSkillmates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // const fetchAnalytics = async () => {
    //   setLoading(true);
    //   setError(null);
    //   try {
    //     const resVideos = await fetch("/api/videos");
    //     if (!resVideos.ok) throw new Error("Failed to fetch videos");
    //     const videosData = await resVideos.json();
    //     setVideos(videosData);
    //     const resSkillmates = await fetch("/api/skillmates/count");
    //     if (!resSkillmates.ok) throw new Error("Failed to fetch skillmates count");
    //     const skillmatesData = await resSkillmates.json();
    //     setSkillmates(skillmatesData.count || 0);
    //   } catch (err) {
    //     setError(err.message);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchAnalytics();
    // --- Static data for development/demo ---
    setLoading(true);
    setTimeout(() => {
      setVideos([
        {
          id: 1,
          title: "React Basics",
          isLive: true,
          scheduledTime: null,
          views: 120,
          likes: 30,
          dislikes: 2,
          uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 2,
          title: "Node.js Advanced",
          isLive: false,
          scheduledTime: new Date(Date.now() + 86400000).toISOString(),
          views: 80,
          likes: 20,
          dislikes: 1,
          uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: 3,
          title: "CSS Flexbox",
          isLive: false,
          scheduledTime: null,
          views: 200,
          likes: 50,
          dislikes: 3,
          uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
      ]);
      setSkillmates(12);
      setLoading(false);
    }, 0);
  }, []);

  const liveCount = videos.filter((v) => v.isLive).length;
  const scheduledCount = videos.filter((v) => v.scheduledTime).length;
  const uploadedCount = videos.length;

  const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);
  const totalDislikes = videos.reduce((sum, v) => sum + (v.dislikes || 0), 0);

  const viewsData = {
    labels: videos.map((v) => v.title),
    datasets: [
      {
        label: "Views",
        data: videos.map((v) => v.views),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const likeDislikeData = {
    labels: ["Likes", "Dislikes"],
    datasets: [
      {
        data: [totalLikes, totalDislikes],
        backgroundColor: ["#10b981", "#ef4444"],
      },
    ],
  };

  const visibilityData = {
    labels: ["Live", "Scheduled", "Normal Uploads"],
    datasets: [
      {
        data: [liveCount, scheduledCount, uploadedCount - liveCount - scheduledCount],
        backgroundColor: ["#6366f1", "#facc15", "#9ca3af"],
      },
    ],
  };

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded shadow text-center min-w-[120px]">
          <p className="text-xl font-semibold">{liveCount}</p>
          <p className="text-gray-600">Live Sessions</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow text-center min-w-[120px]">
          <p className="text-xl font-semibold">{uploadedCount}</p>
          <p className="text-gray-600">Uploaded Videos</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded shadow text-center min-w-[120px]">
          <p className="text-xl font-semibold">{skillmates}</p>
          <p className="text-gray-600">SkillMates</p>
        </div>
      </div>

      {/* Views Chart */}
      <div className="bg-white p-4 rounded shadow w-full overflow-x-auto">
        <h2 className="text-lg font-semibold mb-2">Video Views</h2>
        <div className="min-w-[300px] max-w-full">
          <Bar data={viewsData} options={{responsive: true, maintainAspectRatio: false, aspectRatio: 2}} height={200} />
        </div>
      </div>

      {/* Likes vs Dislikes */}
      <div className="bg-white p-4 rounded shadow w-full max-w-full">
        <h2 className="text-lg font-semibold mb-2">Likes vs Dislikes</h2>
        <div className="min-w-[200px] max-w-full flex justify-center">
          <Pie data={likeDislikeData} options={{responsive: true, maintainAspectRatio: false, aspectRatio: 1}} height={180} />
        </div>
      </div>

      {/* Video Type Distribution */}
      <div className="bg-white p-4 rounded shadow w-full max-w-full">
        <h2 className="text-lg font-semibold mb-2">Video Type</h2>
        <div className="min-w-[200px] max-w-full flex justify-center">
          <Pie data={visibilityData} options={{responsive: true, maintainAspectRatio: false, aspectRatio: 1}} height={180} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
