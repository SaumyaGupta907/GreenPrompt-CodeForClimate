import { useState } from "react";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import GlobalMap from "./pages/GlobalMap.jsx";
import LiveRouting from "./pages/LiveRouting.jsx";
import Receipts from "./pages/Receipts.jsx";
import Scheduler from "./pages/Scheduler.jsx";
import EndUserView from "./pages/EndUserView.jsx";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [view, setView] = useState("admin");

  return (
    <Layout page={page} setPage={setPage} view={view} setView={setView}>
      {view === "enduser" ? (
        <EndUserView />
      ) : (
        <>
          {page === "dashboard" && <Dashboard />}
          {page === "map" && <GlobalMap />}
          {page === "routing" && <LiveRouting />}
          {page === "receipts" && <Receipts />}
          {page === "scheduler" && <Scheduler />}
        </>
      )}
    </Layout>
  );
}
