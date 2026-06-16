import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import Layout from "@/components/Layout";
import { Outlet } from "react-router-dom";

const ModulesContext = React.createContext({});
export const useModules = () => React.useContext(ModulesContext);

export default function AppShell() {
  const [modules, setModules] = useState({});

  useEffect(() => {
    api.get("/config/modules").then((r) => setModules(r.data || {})).catch(() => {});
  }, []);

  return (
    <ModulesContext.Provider value={{ modules, setModules }}>
      <Layout modules={modules}>
        <Outlet />
      </Layout>
    </ModulesContext.Provider>
  );
}
