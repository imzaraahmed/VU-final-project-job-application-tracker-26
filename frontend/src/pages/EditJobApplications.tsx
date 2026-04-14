import { Button } from "@/components/ui/button"
import { Card, CardContent, } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Link, useNavigate, useParams } from "react-router-dom"

import axios from "axios"
import { useEffect, useState } from "react"

type JobApplication = {
  id?: number
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  available_start_date: string
  employment_status: string
  resume?: string // URL to resume file
}

export default function EditJobApplicationPage() {

  const { id } = useParams();
  const navigate = useNavigate()

  const [JobApplication, setJobApplication] = useState<JobApplication>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    available_start_date: "",
    employment_status: "",
    resume: ""
  })

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch existing profile
  useEffect(() => {
    const fetchJobApplicatione = async () => {
      try {
        const res = await axios.get<JobApplication[]>(
          `http://localhost:5000/api/jobapplications/${id}`
        )

        console.log("Fetched job application:", res.data[0])

        if (res.data.length > 0) {
          const data = res.data[0]

          setJobApplication({
            ...data,
            available_start_date: data.available_start_date
              ? data.available_start_date.split("T")[0]
              : ""
          })
        }
      } catch (err) {
        console.error("Failed to fetch job application:", err)
      }
    }

    fetchJobApplicatione()
  }, [])

  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setJobApplication((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle select change
  const handleSelectChange = (value: string) => {
    setJobApplication((prev) => ({
      ...prev,
      employment_status: value
    }))
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0])
    }
  }

  // Submit form
  const handleSubmit = async () => {
    try {
      setLoading(true)

      const formData = new FormData()
      formData.append("first_name", JobApplication.first_name)
      formData.append("last_name", JobApplication.last_name)
      formData.append("email", JobApplication.email)
      formData.append("phone", JobApplication.phone)
      formData.append("position", JobApplication.position)
      formData.append("available_start_date", JobApplication.available_start_date)
      formData.append("employment_status", JobApplication.employment_status)

      if (resumeFile) {
        formData.append("resume", resumeFile)
      }

      if (JobApplication.id) {
        await axios.put(
          `http://localhost:5000/api/jobapplications/${JobApplication.id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        )
      } else {
        await axios.post("http://localhost:5000/api/profileupload", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        })
      }

      navigate("/jobapplications")
    } catch (err) {
      console.error("Failed to save profile:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Edit Job Application</h1>
  
        </div>

        <div className="flex gap-4">
          <Link to="/jobapplications">
            <Button variant="outline">Cancel</Button>
          </Link>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </div>
      </div>

      {/* Personal Information Card */}
      <Card>


        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                name="first_name"
                value={JobApplication.first_name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                name="last_name"
                value={JobApplication.last_name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                name="email"
                value={JobApplication.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                name="phone"
                value={JobApplication.phone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Position Looking</Label>
              <Input
                name="position"
                value={JobApplication.position}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Available Start Date</Label>
              <Input
                type="date"
                name="available_start_date"
                value={JobApplication.available_start_date}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label className="mb-2">Employment Status</Label>
              <Select
                value={JobApplication.employment_status}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Employed">Employed</SelectItem>
                    <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                    <SelectItem value="Unemployed">Unemployed</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label>Upload Resume (PDF/DOC)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />

              {/* Show current resume if exists */}
              {JobApplication.resume && (
                <a
                  href={`http://localhost:5000/${JobApplication.resume}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Current Resume
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}