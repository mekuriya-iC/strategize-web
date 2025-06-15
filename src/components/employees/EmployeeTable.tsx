import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import EmployeeTableRow from "./EmployeeTableRow";

// Mock data for demonstration
const employees = [
  {
    id: 1,
    fullName: "Johnathan Doe",
    profilePic: "/avatars/1.png",
    email: "johnathandoe@gmail.com",
    phone: "+251912345678",
    employedOn: "7 June 2025",
    status: "Active",
  },
  {
    id: 2,
    fullName: "Jane Smith",
    profilePic: "/avatars/2.png",
    email: "janesmith@gmail.com",
    phone: "+251912345679",
    employedOn: "8 June 2025",
    status: "Deactivated",
  },
  {
    id: 3,
    fullName: "Michael Brown",
    profilePic: "/avatars/3.png",
    email: "michaelbrown@gmail.com",
    phone: "+251912345680",
    employedOn: "9 June 2025",
    status: "Active",
  },
  {
    id: 4,
    fullName: "Emily Johnson",
    profilePic: "/avatars/4.png",
    email: "emilyjohnson@gmail.com",
    phone: "+251912345681",
    employedOn: "10 June 2025",
    status: "Active",
  },
  {
    id: 5,
    fullName: "Chris Lee",
    profilePic: "/avatars/5.png",
    email: "chrislee@gmail.com",
    phone: "+251912345682",
    employedOn: "11 June 2025",
    status: "Deactivated",
  },
  {
    id: 6,
    fullName: "Sophia Turner",
    profilePic: "/avatars/6.png",
    email: "sophiaturner@gmail.com",
    phone: "+251912345683",
    employedOn: "12 June 2025",
    status: "Active",
  },
  {
    id: 7,
    fullName: "David Kim",
    profilePic: "/avatars/7.png",
    email: "davidkim@gmail.com",
    phone: "+251912345684",
    employedOn: "13 June 2025",
    status: "Active",
  },
  {
    id: 8,
    fullName: "Olivia Wilson",
    profilePic: "/avatars/8.png",
    email: "oliviawilson@gmail.com",
    phone: "+251912345685",
    employedOn: "14 June 2025",
    status: "Deactivated",
  },
  {
    id: 9,
    fullName: "Ethan Clark",
    profilePic: "/avatars/9.png",
    email: "ethanclark@gmail.com",
    phone: "+251912345686",
    employedOn: "15 June 2025",
    status: "Active",
  },
  {
    id: 10,
    fullName: "Ava Martinez",
    profilePic: "/avatars/10.png",
    email: "avamartinez@gmail.com",
    phone: "+251912345687",
    employedOn: "16 June 2025",
    status: "Active",
  },
];

const EmployeeTable = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>FULL NAME</TableHead>
          <TableHead>PROFILE PICTURE</TableHead>
          <TableHead>EMAIL</TableHead>
          <TableHead>PHONE NUMBER</TableHead>
          <TableHead>EMPLOYED ON</TableHead>
          <TableHead>STATUS</TableHead>
          <TableHead>ACTION</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee, idx) => (
          <EmployeeTableRow
            key={employee.id}
            employee={employee}
            odd={idx % 2 === 1}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default EmployeeTable;
