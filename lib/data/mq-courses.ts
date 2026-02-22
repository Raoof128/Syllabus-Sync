// Macquarie University 2026 course catalogue — sourced from mq_courses_2026.csv
// 177 courses, sorted alphabetically by name

export type MQCourse = {
  code: string;
  name: string;
  /** Raw course_type value from the catalogue */
  type: string;
  faculty: string;
};

/** Simplified display label for each raw course_type, used for grouping in the UI */
export const DEGREE_TYPE_LABELS: Record<string, string> = {
  "Specialist Bachelor Degree": "Bachelor",
  "Generalist Bachelor Degree": "Bachelor",
  "Specialist Bachelor Honours Degree": "Bachelor (Honours)",
  "Masters by Coursework Degree": "Master",
  "Masters by Coursework Degree (Extended)": "Master",
  "Masters by Research": "Master by Research",
  "Graduate Certificate": "Graduate Certificate",
  "Research Graduate Certificate": "Graduate Certificate",
  "Graduate Diploma": "Graduate Diploma",
  "Research Graduate Diploma": "Graduate Diploma",
  Diploma: "Diploma",
  "Non AQF": "Other",
};

/** Max study years per simplified degree label — drives the dynamic year selector */
export const DEGREE_MAX_YEARS: Record<string, number> = {
  Bachelor: 3,
  "Bachelor (Honours)": 4,
  Master: 2,
  "Master by Research": 2,
  "Graduate Certificate": 1,
  "Graduate Diploma": 1,
  Diploma: 1,
  Other: 8,
};

/** Specific course duration overrides (in years) for courses that deviate from the standard degree type duration */
export const COURSE_DURATION_EXCEPTIONS: Record<string, number> = {
  // Bachelor Exceptions
  C000132: 4, // Bachelor of Laws
  C000020: 2, // Bachelor of Clinical Science
  C000426: 4, // Bachelor of Education (Early Childhood and Primary)
  C000425: 4, // Bachelor of Education (Early Childhood)
  C000423: 4, // Bachelor of Education (Primary)
  C000424: 4, // Bachelor of Education (Secondary)

  // Masters by Coursework (Extended) / Other Masters exceptions
  C000076: 4, // Doctor of Medicine
  C000077: 3, // Doctor of Physiotherapy
  C000075: 3, // Juris Doctor
  C000408: 1, // Master of Research in Arts
};

/** Preferred order of simplified degree labels in the dropdown */
export const DEGREE_TYPE_ORDER: string[] = [
  "Bachelor",
  "Bachelor (Honours)",
  "Master",
  "Master by Research",
  "Graduate Certificate",
  "Graduate Diploma",
  "Diploma",
  "Other",
];

export const MQ_COURSES: MQCourse[] = [
  {
    code: "C000117",
    name: "Bachelor of Actuarial Studies",
    type: "Specialist Bachelor Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000118",
    name: "Bachelor of Actuarial Studies with Professional Practice (Honours)",
    type: "Specialist Bachelor Honours Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000017",
    name: "Bachelor of Applied Finance",
    type: "Specialist Bachelor Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000004",
    name: "Bachelor of Arts",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000233",
    name: "Bachelor of Arts (OUA)",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000001",
    name: "Bachelor of Biodiversity and Conservation",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000389",
    name: "Bachelor of Business",
    type: "Generalist Bachelor Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000016",
    name: "Bachelor of Business Analytics",
    type: "Specialist Bachelor Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000005",
    name: "Bachelor of Chiropractic Science",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000020",
    name: "Bachelor of Clinical Science",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000130",
    name: "Bachelor of Commerce",
    type: "Generalist Bachelor Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000421",
    name: "Bachelor of Criminology",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000448",
    name: "Bachelor of Criminology (OUA)",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000102",
    name: "Bachelor of Cyber Security",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000119",
    name: "Bachelor of Economics",
    type: "Specialist Bachelor Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000426",
    name: "Bachelor of Education (Early Childhood and Primary)",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000425",
    name: "Bachelor of Education (Early Childhood)",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000423",
    name: "Bachelor of Education (Primary)",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000424",
    name: "Bachelor of Education (Secondary)",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000133",
    name: "Bachelor of Engineering (Honours)",
    type: "Specialist Bachelor Honours Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000003",
    name: "Bachelor of Environment",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000464",
    name: "Bachelor of Environment (NMJI)",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000371",
    name: "Bachelor of Exercise and Sports Science",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000006",
    name: "Bachelor of Game Design and Development",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000432",
    name: "Bachelor of Health Sciences",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000454",
    name: "Bachelor of History",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000455",
    name: "Bachelor of History (OUA)",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000105",
    name: "Bachelor of Information Technology",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000463",
    name: "Bachelor of Information Technology (NMJI)",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000458",
    name: "Bachelor of International Studies",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000132",
    name: "Bachelor of Laws",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000195",
    name: "Bachelor of Laws (Honours)",
    type: "Specialist Bachelor Honours Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000021",
    name: "Bachelor of Marketing and Media",
    type: "Specialist Bachelor Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000030",
    name: "Bachelor of Media and Communications",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000131",
    name: "Bachelor of Medical Sciences",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000008",
    name: "Bachelor of Planning",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000014",
    name: "Bachelor of Professional Accounting",
    type: "Specialist Bachelor Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000396",
    name: "Bachelor of Psychological Sciences (Honours)",
    type: "Specialist Bachelor Honours Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000009",
    name: "Bachelor of Psychology",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000234",
    name: "Bachelor of Psychology (OUA)",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000352",
    name: "Bachelor of Science",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000462",
    name: "Bachelor of Science (NMJI)",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000353",
    name: "Bachelor of Science (OUA)",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000015",
    name: "Bachelor of Security Studies",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000235",
    name: "Bachelor of Security Studies (OUA)",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000422",
    name: "Bachelor of Social Sciences",
    type: "Generalist Bachelor Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000103",
    name: "Bachelor of Speech and Hearing Sciences",
    type: "Specialist Bachelor Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000128",
    name: "Diploma of Arts Media and Communications",
    type: "Diploma",
    faculty: "Macquarie University College",
  },
  {
    code: "C000375",
    name: "Diploma of Business",
    type: "Diploma",
    faculty: "Macquarie University College",
  },
  {
    code: "C000369",
    name: "Diploma of Business Analytics",
    type: "Diploma",
    faculty: "Macquarie University College",
  },
  {
    code: "C000135",
    name: "Diploma of Commerce",
    type: "Diploma",
    faculty: "Macquarie University College",
  },
  {
    code: "C000146",
    name: "Diploma of Engineering",
    type: "Diploma",
    faculty: "Macquarie University College",
  },
  {
    code: "C000445",
    name: "Diploma of Health Sciences",
    type: "Diploma",
    faculty: "Macquarie University College",
  },
  {
    code: "C000435",
    name: "Diploma of Health Sciences (OUA)",
    type: "Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000136",
    name: "Diploma of Information Technology",
    type: "Diploma",
    faculty: "Macquarie University College",
  },
  {
    code: "C000370",
    name: "Diploma of Marketing and Media",
    type: "Diploma",
    faculty: "Macquarie University College",
  },
  {
    code: "C000076",
    name: "Doctor of Medicine",
    type: "Masters by Coursework Degree (Extended)",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000077",
    name: "Doctor of Physiotherapy",
    type: "Masters by Coursework Degree (Extended)",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000380",
    name: "Graduate Certificate of Accounting Practice",
    type: "Graduate Certificate",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000084",
    name: "Graduate Certificate of Applied Psychological Science",
    type: "Graduate Certificate",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000387",
    name: "Graduate Certificate of Business Administration",
    type: "Graduate Certificate",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000390",
    name: "Graduate Certificate of Clinical Trial Operations",
    type: "Graduate Certificate",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000137",
    name: "Graduate Certificate of Commerce",
    type: "Graduate Certificate",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000051",
    name: "Graduate Certificate of Conservation Biology",
    type: "Graduate Certificate",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000086",
    name: "Graduate Certificate of Disability Studies",
    type: "Graduate Certificate",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000088",
    name: "Graduate Certificate of Editing and Electronic Publishing",
    type: "Graduate Certificate",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000144",
    name: "Graduate Certificate of Educational Studies",
    type: "Graduate Certificate",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000072",
    name: "Graduate Certificate of Environment",
    type: "Graduate Certificate",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000145",
    name: "Graduate Certificate of Finance",
    type: "Graduate Certificate",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000331",
    name: "Graduate Certificate of Finance (OUA)",
    type: "Graduate Certificate",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000429",
    name: "Graduate Certificate of Financial Integrity Law",
    type: "Graduate Certificate",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000431",
    name: "Graduate Certificate of Health Leadership",
    type: "Graduate Certificate",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000022",
    name: "Graduate Certificate of Hearing Sciences",
    type: "Graduate Certificate",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000346",
    name: "Graduate Certificate of Information Technology",
    type: "Graduate Certificate",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000073",
    name: "Graduate Certificate of Laws",
    type: "Graduate Certificate",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000391",
    name: "Graduate Certificate of Lymphoedema Management",
    type: "Graduate Certificate",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000418",
    name: "Graduate Certificate of Musculoskeletal Science",
    type: "Graduate Certificate",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000025",
    name: "Graduate Certificate of Physical Health",
    type: "Graduate Certificate",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000410",
    name: "Graduate Certificate of Research in Arts",
    type: "Research Graduate Certificate",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000411",
    name: "Graduate Certificate of Research in Business",
    type: "Research Graduate Certificate",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000414",
    name: "Graduate Certificate of Research in Medicine, Health and Human Sciences",
    type: "Research Graduate Certificate",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000405",
    name: "Graduate Certificate of Research in Science and Engineering",
    type: "Research Graduate Certificate",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000460",
    name: "Graduate Certificate of Strategic Policy",
    type: "Graduate Certificate",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000461",
    name: "Graduate Certificate of Strategic Policy (OUA)",
    type: "Graduate Certificate",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000055",
    name: "Graduate Certificate of TESOL",
    type: "Graduate Certificate",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000381",
    name: "Graduate Diploma of Accounting Practice",
    type: "Graduate Diploma",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000152",
    name: "Graduate Diploma of Applied Finance",
    type: "Graduate Diploma",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000056",
    name: "Graduate Diploma of Applied Linguistics and TESOL",
    type: "Graduate Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000153",
    name: "Graduate Diploma of Auslan-English Interpreting",
    type: "Graduate Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000057",
    name: "Graduate Diploma of Biostatistics",
    type: "Graduate Diploma",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000028",
    name: "Graduate Diploma of Biotechnology",
    type: "Graduate Diploma",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000388",
    name: "Graduate Diploma of Business Administration",
    type: "Graduate Diploma",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000154",
    name: "Graduate Diploma of Clinical Psychological Science",
    type: "Graduate Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000155",
    name: "Graduate Diploma of Commerce",
    type: "Graduate Diploma",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000058",
    name: "Graduate Diploma of Conservation Biology",
    type: "Graduate Diploma",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000069",
    name: "Graduate Diploma of Environment",
    type: "Graduate Diploma",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000041",
    name: "Graduate Diploma of Health Sciences",
    type: "Graduate Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000110",
    name: "Graduate Diploma of Information Technology",
    type: "Graduate Diploma",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000420",
    name: "Graduate Diploma of Musculoskeletal Health",
    type: "Graduate Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000158",
    name: "Graduate Diploma of Neuropsychological Science",
    type: "Graduate Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000159",
    name: "Graduate Diploma of Organisational Behaviour",
    type: "Graduate Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000039",
    name: "Graduate Diploma of Physical Health",
    type: "Graduate Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000160",
    name: "Graduate Diploma of Public Health",
    type: "Graduate Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000409",
    name: "Graduate Diploma of Research in Arts",
    type: "Research Graduate Diploma",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000412",
    name: "Graduate Diploma of Research in Business",
    type: "Research Graduate Diploma",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000415",
    name: "Graduate Diploma of Research in Medicine, Health and Human Sciences",
    type: "Research Graduate Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000406",
    name: "Graduate Diploma of Research in Science and Engineering",
    type: "Research Graduate Diploma",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000161",
    name: "Graduate Diploma of Translating and Interpreting",
    type: "Graduate Diploma",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000150",
    name: "Intensive Program",
    type: "Non AQF",
    faculty: "Macquarie University College",
  },
  {
    code: "C000075",
    name: "Juris Doctor",
    type: "Masters by Coursework Degree (Extended)",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000061",
    name: "Master of Accounting",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000163",
    name: "Master of Actuarial Practice",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000062",
    name: "Master of Applied Economics",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000120",
    name: "Master of Applied Finance",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000037",
    name: "Master of Applied Linguistics and TESOL",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000101",
    name: "Master of Banking and Finance",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000036",
    name: "Master of Biotechnology",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000166",
    name: "Master of Business Administration",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000180",
    name: "Master of Business Analytics",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000034",
    name: "Master of Chiropractic",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000099",
    name: "Master of Clinical Audiology",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000032",
    name: "Master of Clinical Neuropsychology",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000031",
    name: "Master of Clinical Psychology",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000121",
    name: "Master of Commerce",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000167",
    name: "Master of Conference Interpreting",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000063",
    name: "Master of Conservation Biology",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000171",
    name: "Master of Creative Industries",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000064",
    name: "Master of Creative Writing",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000320",
    name: "Master of Creative Writing (OUA)",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000450",
    name: "Master of Criminology",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000453",
    name: "Master of Criminology (OUA)",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000082",
    name: "Master of Data Science",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000169",
    name: "Master of Disability Studies",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000449",
    name: "Master of Education",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000447",
    name: "Master of Engineering (Professional)",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000398",
    name: "Master of Engineering (Professional) in Civil and Construction Engineering",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000399",
    name: "Master of Engineering (Professional) in Environmental Engineering",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000397",
    name: "Master of Engineering (Professional) in Mechanical Engineering",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000401",
    name: "Master of Engineering (Professional) in Mechatronics and Automation Engineering",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000400",
    name: "Master of Engineering (Professional) in Renewable Energy and Electrical Engineering",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000177",
    name: "Master of Engineering Management",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000023",
    name: "Master of Environment",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000430",
    name: "Master of Health Leadership",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000124",
    name: "Master of Information Systems Management",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000404",
    name: "Master of Information Technology",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000372",
    name: "Master of Information Technology in Artificial Intelligence",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000125",
    name: "Master of Information Technology in Cyber Security",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000451",
    name: "Master of Intelligence",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000459",
    name: "Master of Intelligence (OUA)",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000070",
    name: "Master of International Business",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000179",
    name: "Master of International Relations",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000184",
    name: "Master of Laws",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000097",
    name: "Master of Management",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000049",
    name: "Master of Marketing",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000186",
    name: "Master of Media and Communications",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000048",
    name: "Master of Organisational Psychology",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000083",
    name: "Master of Professional Accounting",
    type: "Masters by Coursework Degree",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000417",
    name: "Master of Professional Practice",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000187",
    name: "Master of Professional Psychology",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000170",
    name: "Master of Public Health",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000408",
    name: "Master of Research in Arts",
    type: "Masters by Research",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000413",
    name: "Master of Research in Business",
    type: "Masters by Research",
    faculty: "Macquarie Business School",
  },
  {
    code: "C000416",
    name: "Master of Research in Medicine, Health and Human Sciences",
    type: "Masters by Research",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000403",
    name: "Master of Research in Science and Engineering",
    type: "Masters by Research",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000026",
    name: "Master of Speech and Language Pathology",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000456",
    name: "Master of Strategy and Security",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000457",
    name: "Master of Strategy and Security (OUA)",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000078",
    name: "Master of Sustainable Development",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Science and Engineering",
  },
  {
    code: "C000143",
    name: "Master of Teaching (Birth to Five Years)",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000190",
    name: "Master of Teaching (Primary)",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000191",
    name: "Master of Teaching (Secondary)",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Arts",
  },
  {
    code: "C000192",
    name: "Master of Translation and Interpreting Studies",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000193",
    name: "Master of Translation and Interpreting Studies (Advanced)",
    type: "Masters by Coursework Degree",
    faculty: "Faculty of Medicine, Health and Human Sciences",
  },
  {
    code: "C000442",
    name: "Masters Qualifying Program (Accelerated)",
    type: "Non AQF",
    faculty: "Macquarie University College",
  },
  {
    code: "C000441",
    name: "Masters Qualifying Program (Standard)",
    type: "Non AQF",
    faculty: "Macquarie University College",
  },
  {
    code: "C000211",
    name: "Standard Foundation Program",
    type: "Non AQF",
    faculty: "Macquarie University College",
  },
  {
    code: "C000440",
    name: "UniReady",
    type: "Non AQF",
    faculty: "Macquarie University College",
  },
];

/** Max study years by internal degree type key */
export const DEGREE_TYPE_MAX_YEARS: Record<string, number> = {
  bachelor: 3,
  bachelor_honours: 4,
  bachelor_double: 5,
  master: 2,
  master_research: 2,
  master_professional: 2,
  graduate_certificate: 1,
  graduate_diploma: 1,
  diploma: 1,
  phd: 4,
  other: 3,
};

/** Return sorted unique faculty names from the course list */
export function getFaculties(): string[] {
  return Array.from(
    new Set(MQ_COURSES.map((c) => c.faculty).filter(Boolean)),
  ).sort();
}

/** Return only courses belonging to a faculty */
export function getCoursesByFaculty(faculty: string): MQCourse[] {
  if (!faculty) return MQ_COURSES;
  return MQ_COURSES.filter((c) => c.faculty === faculty);
}

/** Return max years (1–N) for a given course code (or name, the original code used code) */
export function getMaxYearsForCourse(courseCode: string): number {
  const course = MQ_COURSES.find(
    (c) => c.code === courseCode || c.name === courseCode,
  );
  if (!course) return 3;

  if (course.code in COURSE_DURATION_EXCEPTIONS) {
    return COURSE_DURATION_EXCEPTIONS[course.code];
  }

  // Fallback to original DEGREE_MAX_YEARS since the prompt's type mapping refers to original string types
  return DEGREE_MAX_YEARS[DEGREE_TYPE_LABELS[course.type] || course.type] ?? 3;
}

/** Return [1, 2, … maxYears] for a course */
export function getYearOptions(courseCode: string): number[] {
  const max = getMaxYearsForCourse(courseCode);
  return Array.from({ length: max }, (_, i) => i + 1);
}
