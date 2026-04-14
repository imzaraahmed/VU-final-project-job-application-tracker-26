import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

type JobApplication = {
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  available_start_date: string
  employment_status: string
    id?: number
}

interface ApplicantsResponse {
  data: JobApplication[];
  message: string;
  total: number;
}

export default function JobApplicationPage() {
  const [applicants, setApplicants] = useState<JobApplication[]>([]);


useEffect(() => {
  const fetchApplicants = async () => {
    try {
      const res = await axios.get<ApplicantsResponse>("http://localhost:5000/api/jobapplications");
       setApplicants(res.data.data);
       console.log("Applicants:", res.data);
    } catch (err) {
      console.error("Failed to fetch applicants:", err);
    }
  };

  fetchApplicants();
}, []);


// DELETE function
  const handleDelete = async (id?: number) => {
    if (!id) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this applicant?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/jobapplications/${id}`);
      // Remove from state
      setApplicants((prev) => prev.filter((applicant) => applicant.id !== id));
      console.log(`Applicant with ID ${id} deleted successfully.`);
    } catch (err) {
      console.error(`Failed to delete applicant with ID ${id}:`, err);
    }
  };



  return (
    <div className="p-6">
              <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Job Application List</h1>

        </div>

      <Link to={`/addjobapplication`}>
      <Button>Add New Job Application</Button>
      </Link>
      </div>
      
    

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Employment Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {applicants.length > 0 ? (
              applicants.map((applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell>{applicant.id}</TableCell>
                  <TableCell>{applicant.first_name}</TableCell>
                  <TableCell>{applicant.email}</TableCell>
                  <TableCell>{applicant.phone}</TableCell>
                  <TableCell>{applicant.position}</TableCell>
                  <TableCell>{applicant.employment_status}</TableCell>
                  <TableCell className="flex justify-center gap-3">
                    <Link to={`/editjobapplication/${applicant.id}`}>
                      <Pencil className="w-4 h-4 cursor-pointer text-blue-600 hover:text-blue-800" />
                    </Link>
                    
                    <Trash2 className="w-4 h-4 cursor-pointer text-red-600 hover:text-red-800"
                    onClick={() => handleDelete(applicant.id)}
                    />
                    
                    </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No applicants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}