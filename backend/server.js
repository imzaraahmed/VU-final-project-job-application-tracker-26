const express = require("express");
const cors = require("cors");
require("dotenv").config();


const jobApplications = require("./routes/jobapplications");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


app.use("/api/jobApplications", jobApplications);
app.use("/api/jobapplications", jobApplications);

app.get("/", (req, res) => {
  res.send("Job Application Tracker API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});