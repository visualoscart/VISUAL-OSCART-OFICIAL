
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import Layout from './components/Layout';
import Dashboard from './screens/Dashboard';
import Projects from './screens/Projects';
import ValidationFlow from './screens/ValidationFlow';
import Achievements from './screens/Achievements';
import Calendar from './screens/Calendar';
import Team from './screens/Team';
import ProjectDetail from './screens/ProjectDetail';
import Campaigns from './screens/Campaigns';
import Performance from './screens/Performance';
import Strategy from './screens/Strategy';
import Login from './screens/Login';
import AdminDashboard from './screens/AdminDashboard';

const FaviconUpdater: React.FC = () => {
  const { studioLogo } = useProjects();

  useEffect(() => {
    if (studioLogo) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = studioLogo;
    }
  }, [studioLogo]);

  return null;
};

const App: React.FC = () => {
  return (
    <ProjectProvider>
      <FaviconUpdater />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/projects" element={<Layout><Projects /></Layout>} />
          <Route path="/projects/:id" element={<Layout><ProjectDetail /></Layout>} />
          <Route path="/strategy" element={<Layout><Strategy /></Layout>} />
          <Route path="/campaigns" element={<Layout><Campaigns /></Layout>} />
          <Route path="/performance" element={<Layout><Performance /></Layout>} />
          <Route path="/validation" element={<Layout><ValidationFlow /></Layout>} />
          <Route path="/calendar" element={<Layout><Calendar /></Layout>} />
          <Route path="/users" element={<Layout><Team /></Layout>} />
          <Route path="/achievements" element={<Layout><Achievements /></Layout>} />
          <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
        </Routes>
      </Router>
    </ProjectProvider>
  );
};

export default App;
