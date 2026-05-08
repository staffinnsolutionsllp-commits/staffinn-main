// Sample course data for DBMS course
export const sampleCourse = {
  id: 'dbms-course-001',
  courseName: 'Database Management Systems (DBMS)',
  category: 'Information Technology',
  duration: '3 Months',
  fees: 870,
  originalFees: 4999,
  instructor: {
    name: 'Mr. Piyush Gautam',
    title: 'Senior Database Architect',
    avatar: 'https://ui-avatars.com/api/?name=Piyush+Gautam&size=200&background=2563EB&color=fff',
    rating: 4.9,
    studentsCount: 1240,
    coursesCount: 4,
    bio: 'Piyush is a seasoned database professional with over 10 years of experience in designing and optimizing large-scale database systems. He has worked with Fortune 500 companies and taught thousands of students worldwide.'
  },
  mode: 'Online',
  thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=450&fit=crop',
  description: 'Master the fundamentals of Database Management Systems with this comprehensive course. Learn how data is organized, managed, and retrieved efficiently using relational and non-relational databases. Students will learn database design, data modeling, normalization, query processing, and transaction management through hands-on projects and real-world examples.',
  learningOutcomes: [
    'Design and implement efficient database schemas using ER modeling and normalization techniques',
    'Write complex SQL queries including joins, subqueries, and aggregate functions',
    'Understand transaction management, ACID properties, and concurrency control',
    'Work with both relational (MySQL, PostgreSQL) and NoSQL (MongoDB) databases',
    'Optimize database performance through indexing and query optimization',
    'Implement database security and backup strategies',
    'Build real-world applications with database integration',
    'Understand emerging trends like cloud databases and distributed systems'
  ],
  whatYouLearn: [
    'Master the fundamentals of Database Management',
    'Get hands-on experience',
    'Build real-world projects',
    'Earn a certificate of completion'
  ],
  prerequisites: [
    'No prior experience needed — beginners welcome.',
    'Basic understanding of computers and file systems',
    'Willingness to learn and practice regularly'
  ],
  syllabusOverview: [
    'Introduction to Databases & DBMS',
    'Database Architecture & Data Models (Hierarchical, Network, Relational, NoSQL)',
    'Entity-Relationship (ER) Modeling & Relational Algebra',
    'Normalization (1NF, 2NF, 3NF, BCNF)',
    'Structured Query Language (SQL) – DDL, DML, DCL, TCL',
    'Indexing, Joins, Views, Functions, and Triggers',
    'Transactions, Concurrency, and Recovery Techniques',
    'Security & Integrity Constraints',
    'Emerging Trends: NoSQL, Big Data, and Cloud Databases'
  ],
  certification: 'Internal Certificate',
  language: 'Hindi, English',
  lastUpdated: 'March 2025',
  rating: 0.0,
  ratingsCount: 0,
  studentsEnrolled: 6,
  tags: ['Beginner Friendly', 'Project Based', 'Career Growth'],
  isBestseller: false,
  modules: [
    {
      id: 'module-1',
      title: 'INTRO DBMS',
      description: 'Introduction to databases and getting started with DBMS.',
      content: [
        { id: 'l1-1', type: 'video', title: 'Welcome to the Course', duration: '5:20', isPreview: true },
        { id: 'l1-2', type: 'video', title: 'What is DBMS?', duration: '8:15', isPreview: true },
        { id: 'l1-3', type: 'video', title: 'Setting Up Development Environment', duration: '12:30', isPreview: false },
        { id: 'l1-4', type: 'notes', title: 'Course Resources & Downloads', duration: '3:10', isPreview: false },
        { id: 'l1-5', type: 'quiz', title: 'Module 1 Quiz', duration: '10:00', isPreview: false }
      ]
    },
    {
      id: 'module-2',
      title: 'Data Models & ER',
      description: 'Understanding data models and Entity-Relationship diagrams.',
      content: [
        { id: 'l2-1', type: 'video', title: 'Data Models Overview', duration: '15:45', isPreview: false },
        { id: 'l2-2', type: 'video', title: 'ER Diagrams Basics', duration: '18:20', isPreview: false },
        { id: 'l2-3', type: 'video', title: 'Advanced ER Concepts', duration: '22:10', isPreview: false },
        { id: 'l2-4', type: 'notes', title: 'ER Diagram Examples', duration: '5:00', isPreview: false }
      ]
    },
    {
      id: 'module-3',
      title: 'Normalization',
      description: 'Learn database normalization techniques (1NF, 2NF, 3NF, BCNF).',
      content: [
        { id: 'l3-1', type: 'video', title: 'What is Normalization?', duration: '12:30', isPreview: false },
        { id: 'l3-2', type: 'video', title: 'First Normal Form (1NF)', duration: '16:45', isPreview: false },
        { id: 'l3-3', type: 'video', title: 'Second & Third Normal Forms', duration: '20:15', isPreview: false },
        { id: 'l3-4', type: 'video', title: 'BCNF & Beyond', duration: '18:30', isPreview: false }
      ]
    },
    {
      id: 'module-4',
      title: 'SQL Mastery',
      description: 'Master SQL queries, joins, and advanced concepts.',
      content: [
        { id: 'l4-1', type: 'video', title: 'SQL Basics - SELECT, INSERT, UPDATE', duration: '25:00', isPreview: false },
        { id: 'l4-2', type: 'video', title: 'SQL Joins Explained', duration: '28:45', isPreview: false },
        { id: 'l4-3', type: 'video', title: 'Subqueries & Nested Queries', duration: '22:30', isPreview: false },
        { id: 'l4-4', type: 'video', title: 'Aggregate Functions & GROUP BY', duration: '19:20', isPreview: false },
        { id: 'l4-5', type: 'notes', title: 'SQL Cheat Sheet', duration: '4:00', isPreview: false }
      ]
    },
    {
      id: 'module-5',
      title: 'Transactions & NoSQL',
      description: 'Understanding transactions, ACID properties, and NoSQL databases.',
      content: [
        { id: 'l5-1', type: 'video', title: 'Transaction Management', duration: '20:15', isPreview: false },
        { id: 'l5-2', type: 'video', title: 'ACID Properties', duration: '17:30', isPreview: false },
        { id: 'l5-3', type: 'video', title: 'Introduction to NoSQL', duration: '24:45', isPreview: false },
        { id: 'l5-4', type: 'video', title: 'MongoDB Basics', duration: '26:10', isPreview: false }
      ]
    }
  ],
  reviews: [],
  relatedCourses: [
    {
      id: 'sql-bootcamp',
      title: 'SQL Bootcamp',
      instructor: 'Sarah Johnson',
      category: 'Database',
      thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=250&fit=crop',
      rating: 4.7,
      reviewsCount: 892,
      price: 1299,
      originalPrice: 5999
    },
    {
      id: 'mongodb-essentials',
      title: 'MongoDB Essentials',
      instructor: 'David Chen',
      category: 'NoSQL',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
      rating: 4.6,
      reviewsCount: 654,
      price: 999,
      originalPrice: 4499
    },
    {
      id: 'data-modeling',
      title: 'Data Modeling',
      instructor: 'Emily Rodriguez',
      category: 'Database Design',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
      rating: 4.8,
      reviewsCount: 1023,
      price: 1499,
      originalPrice: 6999
    },
    {
      id: 'postgresql',
      title: 'PostgreSQL',
      instructor: 'Michael Brown',
      category: 'Database',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
      rating: 4.5,
      reviewsCount: 567,
      price: 1199,
      originalPrice: 5499
    }
  ]
};
