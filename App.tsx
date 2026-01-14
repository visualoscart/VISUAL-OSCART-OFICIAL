
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Layout from './components/Layout';
import Dashboard from './screens/Dashboard';
import Projects from './screens/Projects';
import ValidationFlow from './screens/ValidationFlow';
import Achievements from './screens/Achievements';
import Calendar from './screens/Calendar';
import Team from './screens/Team';
import ProjectDetail from './screens/ProjectDetail';
import Login from './screens/Login';
import AdminDashboard from './screens/AdminDashboard';

const App: React.FC = () => {
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/projects" element={<Layout><Projects /></Layout>} />
          <Route path="/projects/:id" element={<Layout><ProjectDetail /></Layout>} />
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
