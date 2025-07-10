import React, { useState } from "react";
import Sidebar from "./privateProfile/Sidebar";

const PrivateProfile = () => {
  // You can add your profile content here
  return (
    <div className="min-h-screen flex py-8 bg-blue-50">
      <Sidebar />
    </div>
  );
};

export default PrivateProfile;
