import React, { useState } from "react";
import SideBarPublic from "./publicProfile/SideBarPublic";
import { useParams } from "react-router-dom";

const PublicProfile = () => {
  const { username } = useParams();
  return (
    <div className="min-h-screen flex py-8 bg-blue-50">
      <SideBarPublic username={username} />
    </div>
  );
};

export default PublicProfile;
