import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './state/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import Home from './pages/Home.jsx';
import CoreMission from './pages/CoreMission.jsx';
import WhyExists from './pages/WhyExists.jsx';
import ReadingList from './pages/ReadingList.jsx';
import Glossary from './pages/Glossary.jsx';
import Catalogue from './pages/Catalogue.jsx';
import ModuleDetail from './pages/ModuleDetail.jsx';
import Lesson from './pages/Lesson.jsx';
import QuizRunner from './pages/QuizRunner.jsx';
import Dashboard from './pages/Dashboard.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import NotFound from './pages/NotFound.jsx';
import './styles/global.css';
import './styles/components.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="welcome" element={<CoreMission />} />
            <Route path="welcome/why" element={<WhyExists />} />
            <Route path="mission" element={<CoreMission />} />
            <Route path="reading-list" element={<ReadingList />} />
            <Route path="glossary" element={<Glossary />} />
            <Route path="courses" element={<Catalogue />} />
            <Route path="courses/:moduleId" element={<ModuleDetail />} />
            <Route path="courses/:moduleId/lessons/:ml" element={<Lesson />} />
            <Route
              path="courses/:moduleId/quiz"
              element={
                <RequireAuth>
                  <QuizRunner />
                </RequireAuth>
              }
            />
            <Route
              path="dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route path="sign-in" element={<SignIn />} />
            <Route path="sign-up" element={<SignUp />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);