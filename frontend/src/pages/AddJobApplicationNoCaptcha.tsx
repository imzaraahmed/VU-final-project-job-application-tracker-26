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
import { Link, useNavigate } from "react-router-dom"

import axios from "axios"
import { useState } from "react"

type JobApplication = {
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  available_start_date: string
  employment_status: string
}

export default function AddJobApplicationNoCaptchaPage() {
  const navigate = useNavigate()

  const [JobApplication, setJobApplication] = useState<JobApplication>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    available_start_date: "",
    employment_status: ""
  })

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setJobApplication((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (value: string) => {
    setJobApplication((prev) => ({
      ...prev,
      employment_status: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0])
    }
  }

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

      await axios.post(
        "http://localhost:5000/api/jobapplications",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      )

      navigate("/jobapplications")
    } catch (err) {
      console.error("Failed to create profile:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Add Job Application</h1>

        </div>

        <div className="flex gap-4">
          <Link to="/jobapplications">
            <Button variant="outline">Cancel</Button>
          </Link>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>

      <Card>


        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input name="first_name" value={JobApplication.first_name} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input name="last_name" value={JobApplication.last_name} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" value={JobApplication.email} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phone" value={JobApplication.phone} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Position Looking</Label>
              <Input name="position" value={JobApplication.position} onChange={handleChange} />
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

            <div className="space-y-2">
              <Label>Upload Resume (PDF/DOC)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}