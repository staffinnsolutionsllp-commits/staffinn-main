// Sector and Role data for staff profiles and search functionality

export const SECTORS_AND_ROLES = {
  "Domestic & Skilled Trades": [
    "Home Maid / Domestic Helper",
    "Housekeeping Staff",
    "Cook (Home/Residential)",
    "Babysitter / Nanny",
    "Elderly Caregiver",
    "Driver (Private/Household)",
    "Gardener / Mali",
    "Security Guard (Residential)"
  ],
  "Construction & Technical Trades": [
    "Carpenter",
    "Painter",
    "Mason",
    "Electrician",
    "Plumber",
    "Welder",
    "Tile Fitter",
    "Construction Helper",
    "Roofer",
    "Scaffolder",
    "AC Servicing"
  ],
  "Administration & HR": [
    "HR Executive",
    "Admin Officer",
    "Recruitment Coordinator",
    "Office Assistant",
    "Data Entry Operator",
    "Front Desk Executive"
  ],
  "BPO & Customer Support": [
    "Customer Support Executive",
    "Telecaller",
    "Technical Support Agent",
    "Process Associate",
    "Back Office Executive"
  ],
  "Beauty & Wellness": [
    "Beautician",
    "Hair Stylist",
    "Spa Therapist",
    "Skin Care Specialist",
    "Makeup Artist",
    "Salon Manager"
  ],
  "Finance & Accounts": [
    "Accountant",
    "Tally Operator",
    "Financial Analyst",
    "Loan Officer",
    "Accounts Assistant",
    "Audit Executive"
  ],
  "Education & Training": [
    "School Teacher",
    "Vocational Trainer",
    "Admission Counselor",
    "Curriculum Developer",
    "Online Tutor / Home Tutor",
    "E-learning Coordinator"
  ],
  "Logistics & Supply Chain": [
    "Warehouse Executive",
    "Delivery Associate",
    "Inventory Controller",
    "Transport Coordinator",
    "Packing Assistant"
  ],
  "Retail & Sales": [
    "Retail Sales Associate",
    "Store Manager",
    "Visual Merchandiser",
    "Cashier",
    "Customer Relationship Executive",
    "Inventory Associate"
  ],
  "Information Technology (IT)": [
    "Software Developer",
    "Web Developer",
    "IT Support Executive",
    "Data Analyst",
    "UI/UX Designer",
    "QA Tester",
    "Network Administrator"
  ],
  "Media, Design & Content": [
    "Graphic Designer",
    "Video Editor",
    "Photographer",
    "Content Writer",
    "Social Media Manager",
    "Animator",
    "Voiceover Artist"
  ],
  "Automobile & Mechanical": [
    "Mechanic (2W/4W)",
    "Auto Electrician",
    "Vehicle Washer",
    "Service Advisor",
    "Garage Helper",
    "Spare Parts Executive"
  ],
  "Telecom & Electronics": [
    "Mobile Repair Technician",
    "Cable Installer",
    "Network Technician",
    "TV/AC Mechanic",
    "Call Center Agent (Telecom)",
    "Service Engineer"
  ],
  "Food Processing & Safety": [
    "Food Safety Supervisor",
    "Packaging Executive",
    "Quality Analyst",
    "Pickle/Jam Making Operator",
    "Production Worker",
    "Sanitation Worker"
  ],
  "Apparel & Textiles": [
    "Tailor",
    "Sewing Machine Operator",
    "Fashion Designer",
    "Merchandiser",
    "Quality Checker",
    "Pattern Master"
  ],
  "Hospitality & Tourism": [
    "Front Office Associate",
    "Housekeeping Attendant",
    "F&B Service Steward",
    "Tour Guide",
    "Event Coordinator",
    "Chef / Commis / Cook",
    "Reservation Executive"
  ],
  "Healthcare & Life Sciences": [
    "Lab Technician",
    "Nursing Assistant",
    "Pharmacist",
    "Medical Sales Representative",
    "Front Desk (Hospital/Clinic)",
    "Medical Coder"
  ],
  "Manufacturing & Operations": [
    "Machine Operator",
    "Production Supervisor",
    "Quality Control Inspector",
    "Assembly Line Worker",
    "Maintenance Technician"
  ],
  "Banking & Insurance": [
    "Sales Executive (Insurance/Loan)",
    "Relationship Manager",
    "Telecaller (Banking)",
    "Claims Processor",
    "Credit Executive",
    "Collection Agent"
  ],
  "Real Estate & Facility Management": [
    "Property Manager",
    "Building Supervisor",
    "Housekeeping Supervisor",
    "Security In-charge",
    "Facility Executive",
    "Front Office (Real Estate)"
  ]
};

// Get all sectors as an array
export const getSectors = () => {
  return Object.keys(SECTORS_AND_ROLES);
};

// Get roles for a specific sector
export const getRolesForSector = (sector) => {
  return SECTORS_AND_ROLES[sector] || [];
};

// Get all roles as a flat array
export const getAllRoles = () => {
  return Object.values(SECTORS_AND_ROLES).flat();
};

// Find sector for a given role
export const getSectorForRole = (role) => {
  for (const [sector, roles] of Object.entries(SECTORS_AND_ROLES)) {
    if (roles.includes(role)) {
      return sector;
    }
  }
  return null;
};