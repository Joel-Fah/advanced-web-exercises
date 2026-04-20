const FACULTIES = {
  ICT: {
    label: "Faculty of Information & Communication Technology",
    departments: {
      ISN: "Information Systems & Networks",
      CSC: "Computer Science",
      CYS: "Cybersecurity",
      SEN: "Software Engineering",
      DAN: "Data Analytics",
      AIR: "Artificial Intelligence & Robotics",
      NET: "Networking & Telecommunications",
      MIS: "Management Information Systems"
    }
  },
  BMS: {
    label: "Faculty of Business & Management Sciences",
    departments: {
      ACC: "Accounting",
      FIN: "Finance & Banking",
      MGT: "Business Management",
      MKT: "Marketing & Communication",
      HRM: "Human Resource Management",
      ENT: "Entrepreneurship & Innovation",
      IBS: "International Business Studies",
      LOG: "Logistics & Supply Chain Management"
    }
  }
};

function getDeptFaculty(deptCode) {
  for (const [faculty, data] of Object.entries(FACULTIES)) {
    if (data.departments[deptCode]) return faculty;
  }
  return null;
}

function getDeptName(deptCode) {
  for (const data of Object.values(FACULTIES)) {
    if (data.departments[deptCode]) return data.departments[deptCode];
  }
  return deptCode;
}

function getAllDepartments() {
  const all = [];
  for (const [faculty, data] of Object.entries(FACULTIES)) {
    for (const [code, name] of Object.entries(data.departments)) {
      all.push({ code, name, faculty });
    }
  }
  return all;
}
