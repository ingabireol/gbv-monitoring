export interface SystemUser {
  id: string;
  username: string;
  password: string;
  role: "admin" | "victim" | "police" | "socialworker" | "districtadmin" | "partner";
  name: string;
  district?: string;
  institution?: string;
  email?: string;
  phone?: string;
}

export const mockUsers: SystemUser[] = [
  {
    id: "1",
    username: "admin@migeprof.gov.rw",
    password: "Admin@2024",
    role: "admin",
    name: "MIGEPROF Administrator",
    email: "admin@migeprof.gov.rw",
  },
  {
    id: "2",
    username: "uwimana@rnp.gov.rw",
    password: "Police@2024",
    role: "police",
    name: "Sgt. Uwimana",
    district: "Gasabo",
    email: "uwimana@rnp.gov.rw",
  },
  {
    id: "3",
    username: "uwase@migeprof.gov.rw",
    password: "Social@2024",
    role: "socialworker",
    name: "Amina Uwase",
    district: "Gasabo",
    email: "uwase@migeprof.gov.rw",
  },
  {
    id: "4",
    username: "ndayisaba@gasabo.gov.rw",
    password: "District@2024",
    role: "districtadmin",
    name: "Emmanuel Ndayisaba",
    district: "Gasabo",
    email: "ndayisaba@gasabo.gov.rw",
  },
  {
    id: "5",
    username: "claire@isange.gov.rw",
    password: "Partner@2024",
    role: "partner",
    name: "Dr. Claire Mukamana",
    institution: "Isange One Stop Centre",
    email: "claire@isange.gov.rw",
  },
  {
    id: "6",
    username: "victim.demo",
    password: "Victim@2024",
    role: "victim",
    name: "Victim #00142",
    phone: "+250 788 000 000",
  },
];

export function authenticateUser(username: string, password: string): SystemUser | null {
  return mockUsers.find(
    u => u.username === username && u.password === password
  ) || null;
}
