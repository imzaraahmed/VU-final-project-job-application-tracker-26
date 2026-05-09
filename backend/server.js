const express = require("express");
const cors = require("cors");
require("dotenv").config();


const jobApplications = require("./routes/jobapplications");
const jobs = require("./routes/jobs");
const reminders = require("./routes/reminders");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


/** Applicant signup/list/edit/login — backed by MySQL table `users` */
app.use("/api/jobApplications", jobApplications);
app.use("/api/jobapplications", jobApplications);
/** CRUD for job postings stored in schema `jat_v2` (see routes/jobs.js) */
app.use("/api/jobs", jobs);
/** CRUD for reminder records linked to users/jobs */
app.use("/api/reminders", reminders);

app.get("/", (req, res) => {
  res.send("Job Application Tracker API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});