import React from "react";
import { Button } from "@/components/ui/button";
// Placeholder imports (to be implemented)
import EmployeeTable, { Employee } from "@/components/employees/EmployeeTable";
import EmployeeFilterBar from "@/components/employees/EmployeeFilterBar";
import AddEmployeeDialog from "@/components/employees/AddEmployeeDialog";
import { Plus } from "lucide-react";

// Mock data for demonstration
const employees: Employee[] = [
  {
    id: 1,
    fullName: "Johnathan Doe",
    profilePic: "/avatars/1.png",
    email: "johnathandoe@gmail.com",
    department: "Engineering",
    phone: "+251912345678",
    employedOn: "7 June 2025",
    status: "Active",
  },
  {
    id: 2,
    fullName: "Jane Smith",
    profilePic: "/avatars/2.png",
    email: "janesmith@gmail.com",
    department: "Marketing",
    phone: "+251912345679",
    employedOn: "8 June 2025",
    status: "Deactivated",
  },
  {
    id: 3,
    fullName: "Michael Brown",
    profilePic: "/avatars/3.png",
    email: "michaelbrown@gmail.com",
    department: "Finance",
    phone: "+251912345680",
    employedOn: "9 June 2025",
    status: "Active",
  },
  {
    id: 4,
    fullName: "Emily Johnson",
    profilePic: "/avatars/4.png",
    email: "emilyjohnson@gmail.com",
    department: "Human Resources",
    phone: "+251912345681",
    employedOn: "10 June 2025",
    status: "Active",
  },
  {
    id: 5,
    fullName: "Chris Lee",
    profilePic: "/avatars/5.png",
    email: "chrislee@gmail.com",
    department: "Engineering",
    phone: "+251912345682",
    employedOn: "11 June 2025",
    status: "Deactivated",
  },
  {
    id: 6,
    fullName: "Sophia Turner",
    profilePic: "/avatars/6.png",
    email: "sophiaturner@gmail.com",
    department: "Marketing",
    phone: "+251912345683",
    employedOn: "12 June 2025",
    status: "Active",
  },
  {
    id: 7,
    fullName: "David Kim",
    profilePic: "/avatars/7.png",
    email: "davidkim@gmail.com",
    department: "Finance",
    phone: "+251912345684",
    employedOn: "13 June 2025",
    status: "Active",
  },
  {
    id: 8,
    fullName: "Olivia Wilson",
    profilePic: "/avatars/8.png",
    email: "oliviawilson@gmail.com",
    department: "Human Resources",
    phone: "+251912345685",
    employedOn: "14 June 2025",
    status: "Deactivated",
  },
  {
    id: 9,
    fullName: "Ethan Clark",
    profilePic: "/avatars/9.png",
    email: "ethanclark@gmail.com",
    department: "Engineering",
    phone: "+251912345686",
    employedOn: "15 June 2025",
    status: "Active",
  },
  {
    id: 10,
    fullName: "Ava Martinez",
    profilePic: "/avatars/10.png",
    email: "avamartinez@gmail.com",
    department: "Marketing",
    phone: "+251912345687",
    employedOn: "16 June 2025",
    status: "Active",
  },
];

const EmployeesPage = () => {
  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-4xl text-[#3F3F46] font-bold tracking-tight">
          Employees
        </h1>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <EmployeeFilterBar />
        <div className="flex gap-2 items-center">
          <AddEmployeeDialog>
            <Button className="ml-2">
              <Plus width={4} height={4} />
              Add Employee
            </Button>
          </AddEmployeeDialog>
        </div>
      </div>

      {/* Table */}
      <div className="dark:bg-muted rounded-lg border overflow-x-auto custom-scrollbar">
        <EmployeeTable employees={employees} />
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
        <span>Showing Page 1 of 1</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
