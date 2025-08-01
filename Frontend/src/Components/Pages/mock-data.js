// Sample data for the RecruiterPage component
// In a real application, this would come from an API

export const recruiterData = {
    companyName: "TechInnovate Solutions",
    companyLogo: "https://placehold.co/120x120?text=TIS",
    recruiterName: "Priya Sharma",
    designation: "HR Manager",
    verified: true,
    industry: "IT Services",
    location: "Bangalore, India",
    experience: "5+ years",
    isFollowing: false,
    companyDescription: "TechInnovate Solutions is a leading IT services company specializing in digital transformation, cloud solutions, and enterprise software development. Founded in 2010, we have grown to over 5,000 employees globally with offices in 12 countries. Our mission is to help businesses leverage technology to achieve their strategic goals and create lasting value.",
    officePhotos: [
      "https://placehold.co/300x150?text=Office+Space",
      "https://placehold.co/300x150?text=Cafeteria",
      "https://placehold.co/300x150?text=Recreation+Area",
      "https://placehold.co/300x150?text=Meeting+Rooms"
    ],
    perks: [
      { icon: "🏥", text: "Comprehensive health insurance" },
      { icon: "💻", text: "Work from home options" },
      { icon: "🎓", text: "Learning & development budget" },
      { icon: "💰", text: "Performance bonuses" },
      { icon: "✈️", text: "Paid time off & holidays" },
      { icon: "🏋️‍♂️", text: "Gym membership" },
      { icon: "🍽️", text: "Free lunch & snacks" },
      { icon: "👶", text: "Parental leave benefits" }
    ],
    hiringSteps: [
      {
        title: "Online Application",
        description: "Submit your resume and complete a brief questionnaire related to your experience."
      },
      {
        title: "HR Screening Call",
        description: "30-minute call to discuss your background, experience, and expectations."
      },
      {
        title: "Technical Assessment",
        description: "Complete a skill-based assessment relevant to the position you're applying for."
      },
      {
        title: "Technical Interview",
        description: "In-depth interview with the team lead to evaluate your technical capabilities."
      },
      {
        title: "Final Round & Offer",
        description: "Discussion with senior management, followed by an offer if selected."
      }
    ],
    interviewQuestions: [
      "What interests you about working at TechInnovate Solutions?",
      "Describe a challenging project you worked on and how you overcame obstacles.",
      "How do you stay updated with the latest technologies in your field?",
      "Give an example of a time when you had to meet a tight deadline.",
      "How do you handle disagreements within a team?",
      "What are your salary expectations for this role?",
      "What questions do you have about our company or the position?"
    ],
    applications: [
      {
        id: 1,
        jobTitle: "Senior Frontend Developer",
        status: "Shortlisted",
        appliedDate: "May 10, 2023"
      },
      {
        id: 2,
        jobTitle: "UX Designer",
        status: "InReview",
        appliedDate: "June 5, 2023"
      }
    ]
  };
  
  export const jobListings = [
    {
      id: 1,
      title: "Software Engineer - Full Stack",
      type: "Full-time",
      salary: "₹12-18 LPA",
      experience: "3-5 years",
      location: "Bangalore (Hybrid)",
      description: "We're looking for a skilled Full Stack Developer to join our core product team. You'll be working on building new features and improving our customer-facing applications.",
      skills: ["React", "Node.js", "MongoDB", "AWS", "TypeScript"],
      postedDate: "2 days ago"
    },
    {
      id: 2,
      title: "Senior Frontend Developer",
      type: "Full-time",
      salary: "₹18-24 LPA",
      experience: "5+ years",
      location: "Bangalore (Hybrid)",
      description: "Join our UI team to build scalable and performant user interfaces. You'll collaborate with designers, backend engineers, and product managers to deliver exceptional user experiences.",
      skills: ["React", "Redux", "JavaScript", "CSS", "Performance Optimization"],
      postedDate: "1 week ago"
    },
    {
      id: 3,
      title: "UX/UI Designer",
      type: "Full-time",
      salary: "₹10-16 LPA",
      experience: "2-4 years",
      location: "Bangalore (Onsite)",
      description: "We're seeking a creative UX/UI Designer to create intuitive and engaging user experiences for our enterprise software products.",
      skills: ["Figma", "User Research", "Wireframing", "UI Design", "Prototyping"],
      postedDate: "3 days ago"
    },
    {
      id: 4,
      title: "DevOps Engineer",
      type: "Full-time",
      salary: "₹14-20 LPA",
      experience: "3-6 years",
      location: "Remote (India)",
      description: "Help build and maintain our cloud infrastructure, CI/CD pipelines, and deployment processes. You'll be responsible for system reliability and performance optimization.",
      skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],
      postedDate: "5 days ago"
    },
    {
      id: 5,
      title: "Project Manager",
      type: "Full-time",
      salary: "₹16-22 LPA",
      experience: "5-8 years",
      location: "Bangalore (Hybrid)",
      description: "Lead project teams in delivering complex software solutions for our enterprise clients. You'll be responsible for project planning, resource allocation, risk management, and client communication.",
      skills: ["Agile Methodologies", "JIRA", "Stakeholder Management", "Risk Mitigation", "Team Leadership"],
      postedDate: "1 week ago"
    },
    {
      id: 6,
      title: "Data Engineer",
      type: "Contract",
      salary: "₹12-18 LPA",
      experience: "3-5 years",
      location: "Remote (India)",
      description: "Design and implement data pipelines, ETL processes, and data storage solutions. You'll work closely with data scientists and analysts to support data-driven decision making.",
      skills: ["Python", "SQL", "ETL", "Data Modeling", "Apache Spark"],
      postedDate: "2 weeks ago"
    },
    {
      id: 7,
      title: "Technical Content Writer",
      type: "Part-time",
      salary: "₹6-9 LPA",
      experience: "2-4 years",
      location: "Remote (India)",
      description: "Create high-quality technical content including documentation, tutorials, and blog posts. You should have a strong understanding of software development concepts and excellent writing skills.",
      skills: ["Technical Writing", "Documentation", "Markdown", "SEO", "Content Strategy"],
      postedDate: "3 days ago"
    },
    {
      id: 8,
      title: "Mobile App Developer",
      type: "Freelance",
      salary: "₹8-12K per day",
      experience: "3+ years",
      location: "Remote",
      description: "Develop and maintain mobile applications for iOS and Android platforms. You'll be working on feature development, bug fixes, and performance optimization for our client apps.",
      skills: ["React Native", "Flutter", "iOS", "Android", "Mobile UI/UX"],
      postedDate: "1 week ago"
    }
  ];
  
  export const candidateReviews = [
    {
      id: 1,
      name: "Rahul Joshi",
      position: "Software Engineer Applicant",
      date: "April 15, 2023",
      rating: 4,
      comment: "The interview process was well-structured and transparent. I received timely feedback after each round. The technical assessment was challenging but relevant to the job. The recruiter was very responsive and helpful throughout the process."
    },
    {
      id: 2,
      name: "Ananya Gupta",
      position: "Product Manager Applicant",
      date: "March 8, 2023",
      rating: 5,
      comment: "One of the best interview experiences I've had. The team was well-prepared and asked thoughtful questions. The recruiter gave me a clear overview of the process and what to expect. I appreciated the prompt follow-ups and detailed feedback."
    },
    {
      id: 3,
      name: "Vikram Singh",
      position: "Data Scientist Applicant",
      date: "May 20, 2023",
      rating: 3,
      comment: "The technical rounds were good, but the process took longer than expected. There was a two-week gap between interviews which was frustrating. However, the team was knowledgeable and the discussions were insightful."
    },
    {
      id: 4,
      name: "Neha Patel",
      position: "UX Designer Applicant",
      date: "February 12, 2023",
      rating: 4,
      comment: "I had a great experience interviewing with TechInnovate. The design challenge was reasonable and I got to present my work to the team. The feedback was constructive and helped me grow professionally."
    },
    {
      id: 5,
      name: "Arun Kumar",
      position: "DevOps Engineer Applicant",
      date: "April 3, 2023",
      rating: 2,
      comment: "The technical interview was unnecessarily complex with questions that weren't relevant to the role. Communication was poor between different interviewers, and I had to repeat information multiple times. The process could be more streamlined."
    }
  ];
  
  export const employeeReviews = [
    {
      id: 1,
      name: "Sneha Reddy",
      position: "Senior Developer",
      tenure: "3 years",
      rating: 4,
      comment: "Great place to work with a strong emphasis on learning and growth. The work-life balance is respected, and the projects are challenging and interesting. Management is supportive and transparent about company goals and direction."
    },
    {
      id: 2,
      name: "Arjun Mehta",
      position: "Project Manager",
      tenure: "2 years",
      rating: 5,
      comment: "I've grown tremendously at TechInnovate. The company invests in employee development and provides opportunities to take on new responsibilities. The culture is collaborative, and there's a real sense of teamwork across departments."
    },
    {
      id: 3,
      name: "Divya Shah",
      position: "UI Designer",
      tenure: "18 months",
      rating: 4,
      comment: "The creative freedom here is incredible. I've been able to contribute to major projects and see my designs implemented. The leadership listens to feedback and takes action to improve processes."
    },
    {
      id: 4,
      name: "Karthik Raja",
      position: "QA Engineer",
      tenure: "2.5 years",
      rating: 3,
      comment: "The work environment is positive, but career progression could be more clearly defined. Project deadlines can get stressful at times, though management tries to be accommodating. Benefits and compensation are competitive."
    },
    {
      id: 5,
      name: "Meera Iyer",
      position: "Product Owner",
      tenure: "4 years",
      rating: 5,
      comment: "I've been with TechInnovate for 4 years and have seen the company grow while maintaining its core values. There's a strong focus on innovation and staying ahead of industry trends. The leadership team is approachable and open to ideas from all levels."
    }
  ];
  
  export const similarRecruiters = [
    {
      id: 101,
      name: "CloudTech Systems",
      logo: "https://placehold.co/50x50?text=CTS",
      industry: "Cloud Services",
      openJobs: 12
    },
    {
      id: 102,
      name: "DataSmart Analytics",
      logo: "https://placehold.co/50x50?text=DSA",
      industry: "Data Analytics",
      openJobs: 8
    },
    {
      id: 103,
      name: "InnovateTech Solutions",
      logo: "https://placehold.co/50x50?text=ITS",
      industry: "Software Development",
      openJobs: 15
    },
    {
      id: 104,
      name: "NextGen Digital",
      logo: "https://placehold.co/50x50?text=NGD",
      industry: "Digital Marketing & Tech",
      openJobs: 6
    }
  ];
  
  export const suggestedJobs = [
    {
      id: 201,
      title: "Backend Developer",
      companyName: "CloudTech Systems",
      companyLogo: "https://placehold.co/32x32?text=CTS",
      location: "Pune (Hybrid)",
      salary: "₹14-18 LPA"
    },
    {
      id: 202,
      title: "Product Designer",
      companyName: "InnovateTech",
      companyLogo: "https://placehold.co/32x32?text=ITS",
      location: "Remote",
      salary: "₹12-16 LPA"
    },
    {
      id: 203,
      title: "Data Scientist",
      companyName: "DataSmart Analytics",
      companyLogo: "https://placehold.co/32x32?text=DSA",
      location: "Bangalore",
      salary: "₹16-22 LPA"
    },
    {
      id: 204,
      title: "Full Stack Developer",
      companyName: "NextGen Digital",
      companyLogo: "https://placehold.co/32x32?text=NGD",
      location: "Hyderabad",
      salary: "₹10-15 LPA"
    }
  ];