import { Routes, Route } from "react-router-dom";
import AppHeader from "./components/custom/AppHeader";

import DashboardPage from "./pages/Dashboard";
import ReminderPage from "./pages/Reminders";
import NotificationsPage from "./pages/Notifications";


import JobApplicationPage from "./pages/JobApplications";
import EditJobApplicationPage from "./pages/EditJobApplications";
import AddJobApplicationPage from "./pages/AddJobApplications";
import LoginPage from "./pages/Login";
import Joblist from "./pages/Joblist";
import Addjob from "./pages/Addjob";
import Editjob from "./pages/Editjob";
import Jobdetail from "./pages/Jobdetail";





function App() {
  return (
    <>

    <AppHeader/>

    <div className="container mx-auto p-6 px-20">


      <Routes>
        <Route path="/" element={<DashboardPage />} />

      <Route path="/jobapplications" element={<JobApplicationPage />} />
      <Route path="/addjobapplication" element={<AddJobApplicationPage />} />

      
 
      <Route path="/editjobapplication/:id" element={<EditJobApplicationPage />} />

        <Route path="/jobs" element={<Joblist />} />
        <Route path="/addjob" element={<Addjob />} />
        <Route path="/job/:id" element={<Jobdetail />} />
        <Route path="/editjob/:id" element={<Editjob />} />

        <Route path="/reminders" element={<ReminderPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        <Route path="/login" element={<LoginPage />} />

        
      </Routes>
</div>
    </>
  );
}

export default App;