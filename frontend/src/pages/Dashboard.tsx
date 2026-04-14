import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function DashboardPage() {
 

  return (
    <div >
        <div>Dashboard - Coming Soon!</div>
      <div className=" text-center mt-20">
      <Link to={`/addjobapplication`}>
      <Button>Add New Job Application</Button>
      </Link>
      </div>
      
    </div>
  );
}

export default DashboardPage;