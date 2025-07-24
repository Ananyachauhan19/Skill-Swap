import React from "react";
import SideBarPublic from "./publicProfile/SideBarPublic";
import { useParams } from "react-router-dom";
import PageNotFound from "../components/PageNotFound";

const PublicProfile = () => {
  const { username } = useParams();
  const [notFound, setNotFound] = React.useState(false);

  return (
    <div className="min-h-screen flex py-8 bg-blue-50">
      {notFound
        ? <PageNotFound />
        : <SideBarPublic username={username} setNotFound={setNotFound} />}
    </div>
  );
};

export default PublicProfile;
