import React, { useState } from "react";
import SideBarPublic from "./publicProfile/SideBarPublic";


const PrivateProfile = () => {
  return (
    <div className="min-h-screen flex py-8 bg-blue-50">
      <SideBarPublic/>
    </div>
  );
};

export default PrivateProfile;
