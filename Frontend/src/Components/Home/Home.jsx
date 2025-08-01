/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';
import Footer from '../Footer/Footer';
import HomeImage from '../../assets/Home.jpg';

function Home() {
   const [states, setStates] = useState([]);
   const [cities, setCities] = useState([]);
   const [areas, setAreas] = useState([]);
   const [selectedState, setSelectedState] = useState('');
   const [selectedCity, setSelectedCity] = useState('');
   const [selectedArea, setSelectedArea] = useState('');
   const [selectedCategory, setSelectedCategory] = useState('');
   const [selectedSector, setSelectedSector] = useState('');
   const [showModal, setShowModal] = useState(false);
   const [selectedStaff, setSelectedStaff] = useState(null);
   const [viewMode, setViewMode] = useState('profile'); // 'profile', 'photo', 'resume', 'certificate'

   const categories = ["Staff", "Institute", "Recruiter"];
   const sectors = ["Plumber", "Gardener", "Maid", "Carpenter", "Electrician", "Painter"];
   const API_KEY = 'Rzk1SnVRU3NDTWpzb2ZiMERwU1RKTXRpT0R4Nmh0ZmhsZHlNM0pacw==';

   const trendingStaff = {
      Plumber: [
         { 
            name: "Ramesh", 
            profession: "Plumber", 
            rating: "4.8",
            photo: "https://via.placeholder.com/150x150/4863f7/white?text=R",
            skills: ["Pipe Fitting", "Water System Repair", "Drain Cleaning", "Installation"],
            certificates: ["Plumbing Certification", "Safety Training"],
            workExperience: "5 years experience in residential plumbing",
            education: "ITI Plumbing Course",
            expectedSalary: "₹15,000 - ₹20,000/month",
            phone: "+91-9876543210",
            email: "ramesh.plumber@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Delhi",
            experience: "5 Years",
            availability: "Available"
         },
         { 
            name: "Suresh", 
            profession: "Plumber", 
            rating: "4.5",
            photo: "https://via.placeholder.com/150x150/4863f7/white?text=S",
            skills: ["Pipe Installation", "Leak Repair", "Bathroom Fitting"],
            certificates: ["Basic Plumbing", "Water Safety"],
            workExperience: "3 years in commercial plumbing",
            education: "Diploma in Plumbing",
            expectedSalary: "₹12,000 - ₹18,000/month",
            phone: "+91-9876543211",
            email: "suresh.plumber@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Mumbai",
            experience: "3 Years",
            availability: "Busy"
         },
         { 
            name: "Manoj", 
            profession: "Plumber", 
            rating: "4.7",
            photo: "https://via.placeholder.com/150x150/4863f7/white?text=M",
            skills: ["Emergency Repairs", "Gas Line Installation", "Fixture Installation"],
            certificates: ["Advanced Plumbing", "Gas Safety"],
            workExperience: "7 years mixed residential/commercial",
            education: "Vocational Training in Plumbing",
            expectedSalary: "₹18,000 - ₹25,000/month",
            phone: "+91-9876543212",
            email: "manoj.plumber@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Bangalore",
            experience: "7 Years",
            availability: "Available"
         },
         { 
            name: "Amit", 
            profession: "Plumber", 
            rating: "4.6",
            photo: "https://via.placeholder.com/150x150/4863f7/white?text=A",
            skills: ["Water Heater Repair", "Pipe Replacement", "Drain Installation"],
            certificates: ["Plumbing License", "First Aid"],
            workExperience: "4 years residential plumbing",
            education: "Technical Certificate in Plumbing",
            expectedSalary: "₹14,000 - ₹19,000/month",
            phone: "+91-9876543213",
            email: "amit.plumber@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Chennai",
            experience: "4 Years",
            availability: "Open for Offers"
         }
      ],
      Gardener: [
         { 
            name: "Rajesh", 
            profession: "Gardener", 
            rating: "4.7",
            photo: "https://via.placeholder.com/150x150/10b981/white?text=R",
            skills: ["Landscaping", "Plant Care", "Pest Control", "Garden Design"],
            certificates: ["Horticulture Certificate", "Organic Farming"],
            workExperience: "6 years in residential gardening",
            education: "Diploma in Agriculture",
            expectedSalary: "₹12,000 - ₹16,000/month",
            phone: "+91-9876543214",
            email: "rajesh.gardener@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Delhi",
            experience: "6 Years",
            availability: "Available"
         },
         { 
            name: "Mohan", 
            profession: "Gardener", 
            rating: "4.2",
            photo: "https://via.placeholder.com/150x150/10b981/white?text=M",
            skills: ["Tree Pruning", "Lawn Maintenance", "Irrigation"],
            certificates: ["Basic Gardening", "Plant Diseases"],
            workExperience: "3 years garden maintenance",
            education: "Agricultural Training",
            expectedSalary: "₹10,000 - ₹14,000/month",
            phone: "+91-9876543215",
            email: "mohan.gardener@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Mumbai",
            experience: "3 Years",
            availability: "Busy"
         },
         { 
            name: "Sunil", 
            profession: "Gardener", 
            rating: "4.6",
            photo: "https://via.placeholder.com/150x150/10b981/white?text=S",
            skills: ["Seasonal Planting", "Garden Maintenance", "Fertilizer Application"],
            certificates: ["Advanced Gardening", "Soil Management"],
            workExperience: "5 years commercial gardening",
            education: "Certificate in Horticulture",
            expectedSalary: "₹13,000 - ₹17,000/month",
            phone: "+91-9876543216",
            email: "sunil.gardener@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Bangalore",
            experience: "5 Years",
            availability: "Available"
         },
         { 
            name: "Ankit", 
            profession: "Gardener", 
            rating: "4.3",
            photo: "https://via.placeholder.com/150x150/10b981/white?text=A",
            skills: ["Kitchen Garden", "Flower Arrangement", "Plant Propagation"],
            certificates: ["Organic Gardening", "Plant Care"],
            workExperience: "2 years residential gardening",
            education: "Basic Agricultural Course",
            expectedSalary: "₹9,000 - ₹13,000/month",
            phone: "+91-9876543217",
            email: "ankit.gardener@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Chennai",
            experience: "2 Years",
            availability: "Available"
         }
      ],
      Maid: [
         { 
            name: "Diya", 
            profession: "Maid", 
            rating: "4.5",
            photo: "https://via.placeholder.com/150x150/ef4444/white?text=D",
            skills: ["House Cleaning", "Cooking", "Child Care", "Laundry"],
            certificates: ["Housekeeping Certificate", "Child Care Training"],
            workExperience: "4 years domestic help",
            education: "High School",
            expectedSalary: "₹8,000 - ₹12,000/month",
            phone: "+91-9876543218",
            email: "diya.maid@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Delhi",
            experience: "4 Years",
            availability: "Available"
         },
         { 
            name: "Priya", 
            profession: "Maid", 
            rating: "4.3",
            photo: "https://via.placeholder.com/150x150/ef4444/white?text=P",
            skills: ["Deep Cleaning", "Ironing", "Dishwashing"],
            certificates: ["Cleaning Techniques", "Safety Training"],
            workExperience: "3 years household work",
            education: "Middle School",
            expectedSalary: "₹7,000 - ₹10,000/month",
            phone: "+91-9876543219",
            email: "priya.maid@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Mumbai",
            experience: "3 Years",
            availability: "Busy"
         },
         { 
            name: "Ritika", 
            profession: "Maid", 
            rating: "4.4",
            photo: "https://via.placeholder.com/150x150/ef4444/white?text=R",
            skills: ["Home Organization", "Cooking", "Elder Care"],
            certificates: ["Home Management", "Elder Care Training"],
            workExperience: "5 years domestic services",
            education: "High School",
            expectedSalary: "₹9,000 - ₹13,000/month",
            phone: "+91-9876543220",
            email: "ritika.maid@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Bangalore",
            experience: "5 Years",
            availability: "Open for Offers"
         },
         { 
            name: "Kavita", 
            profession: "Maid", 
            rating: "4.2",
            photo: "https://via.placeholder.com/150x150/ef4444/white?text=K",
            skills: ["Basic Cleaning", "Dusting", "Floor Mopping"],
            certificates: ["Basic Housekeeping"],
            workExperience: "2 years cleaning services",
            education: "Primary School",
            expectedSalary: "₹6,000 - ₹9,000/month",
            phone: "+91-9876543221",
            email: "kavita.maid@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Chennai",
            experience: "2 Years",
            availability: "Available"
         }
      ],
      Carpenter: [
         { 
            name: "Vijay", 
            profession: "Carpenter", 
            rating: "4.6",
            photo: "https://via.placeholder.com/150x150/f59e0b/white?text=V",
            skills: ["Furniture Making", "Cabinet Installation", "Door Fitting", "Wood Carving"],
            certificates: ["Carpentry License", "Wood Working"],
            workExperience: "8 years furniture making",
            education: "ITI Carpentry Course",
            expectedSalary: "₹20,000 - ₹28,000/month",
            phone: "+91-9876543222",
            email: "vijay.carpenter@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Delhi",
            experience: "8 Years",
            availability: "Available"
         },
         { 
            name: "Ajay", 
            profession: "Carpenter", 
            rating: "4.4",
            photo: "https://via.placeholder.com/150x150/f59e0b/white?text=A",
            skills: ["Interior Work", "Repair Services", "Custom Furniture"],
            certificates: ["Carpentry Diploma", "Safety Training"],
            workExperience: "5 years interior carpentry",
            education: "Vocational Training",
            expectedSalary: "₹16,000 - ₹22,000/month",
            phone: "+91-9876543223",
            email: "ajay.carpenter@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Mumbai",
            experience: "5 Years",
            availability: "Busy"
         },
         { 
            name: "Sumit", 
            profession: "Carpenter", 
            rating: "4.5",
            photo: "https://via.placeholder.com/150x150/f59e0b/white?text=S",
            skills: ["Modular Kitchen", "Wardrobes", "Partition Work"],
            certificates: ["Advanced Carpentry", "Modular Furniture"],
            workExperience: "6 years modular furniture",
            education: "Diploma in Wood Technology",
            expectedSalary: "₹18,000 - ₹25,000/month",
            phone: "+91-9876543224",
            email: "sumit.carpenter@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Bangalore",
            experience: "6 Years",
            availability: "Available"
         },
         { 
            name: "Nitin", 
            profession: "Carpenter", 
            rating: "4.3",
            photo: "https://via.placeholder.com/150x150/f59e0b/white?text=N",
            skills: ["Basic Carpentry", "Repair Work", "Shelving"],
            certificates: ["Basic Carpentry"],
            workExperience: "3 years repair work",
            education: "Technical Training",
            expectedSalary: "₹12,000 - ₹16,000/month",
            phone: "+91-9876543225",
            email: "nitin.carpenter@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Chennai",
            experience: "3 Years",
            availability: "Open for Offers"
         }
      ],
      Electrician: [
         { 
            name: "Krishna", 
            profession: "Electrician", 
            rating: "4.7",
            photo: "https://via.placeholder.com/150x150/8b5cf6/white?text=K",
            skills: ["Wiring", "Motor Repair", "Panel Installation", "Inverter Setup"],
            certificates: ["Electrical License", "Safety Training"],
            workExperience: "7 years electrical work",
            education: "ITI Electrical",
            expectedSalary: "₹18,000 - ₹25,000/month",
            phone: "+91-9876543226",
            email: "krishna.electrician@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Delhi",
            experience: "7 Years",
            availability: "Available"
         },
         { 
            name: "Rahul", 
            profession: "Electrician", 
            rating: "4.1",
            photo: "https://via.placeholder.com/150x150/8b5cf6/white?text=R",
            skills: ["Basic Wiring", "Fan Installation", "Switch Repair"],
            certificates: ["Basic Electrical"],
            workExperience: "2 years electrical work",
            education: "Technical Course",
            expectedSalary: "₹10,000 - ₹14,000/month",
            phone: "+91-9876543227",
            email: "rahul.electrician@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Mumbai",
            experience: "2 Years",
            availability: "Busy"
         },
         { 
            name: "Vikas", 
            profession: "Electrician", 
            rating: "4.6",
            photo: "https://via.placeholder.com/150x150/8b5cf6/white?text=V",
            skills: ["Industrial Wiring", "Maintenance", "Troubleshooting"],
            certificates: ["Industrial Electrical", "High Voltage"],
            workExperience: "6 years industrial electrical",
            education: "Diploma in Electrical",
            expectedSalary: "₹22,000 - ₹30,000/month",
            phone: "+91-9876543228",
            email: "vikas.electrician@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Bangalore",
            experience: "6 Years",
            availability: "Available"
         },
         { 
            name: "Sachin", 
            profession: "Electrician", 
            rating: "4.2",
            photo: "https://via.placeholder.com/150x150/8b5cf6/white?text=S",
            skills: ["Home Wiring", "Appliance Repair", "LED Installation"],
            certificates: ["Electrical Safety", "Appliance Repair"],
            workExperience: "4 years home electrical",
            education: "Electrical Training",
            expectedSalary: "₹14,000 - ₹18,000/month",
            phone: "+91-9876543229",
            email: "sachin.electrician@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Chennai",
            experience: "4 Years",
            availability: "Available"
         }
      ],
      Painter: [
         { 
            name: "Suresh", 
            profession: "Painter", 
            rating: "3.9",
            photo: "https://via.placeholder.com/150x150/06b6d4/white?text=S",
            skills: ["Wall Painting", "Texture Work", "Wood Polish"],
            certificates: ["Painting Techniques"],
            workExperience: "4 years painting work",
            education: "Vocational Training",
            expectedSalary: "₹12,000 - ₹16,000/month",
            phone: "+91-9876543230",
            email: "suresh.painter@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Delhi",
            experience: "4 Years",
            availability: "Available"
         },
         { 
            name: "Ravi", 
            profession: "Painter", 
            rating: "4.1",
            photo: "https://via.placeholder.com/150x150/06b6d4/white?text=R",
            skills: ["Interior Painting", "Exterior Painting", "Spray Painting"],
            certificates: ["Advanced Painting", "Color Theory"],
            workExperience: "5 years painting services",
            education: "Art & Craft Training",
            expectedSalary: "₹14,000 - ₹18,000/month",
            phone: "+91-9876543231",
            email: "ravi.painter@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Mumbai",
            experience: "5 Years",
            availability: "Busy"
         },
         { 
            name: "Aakash", 
            profession: "Painter", 
            rating: "4.3",
            photo: "https://via.placeholder.com/150x150/06b6d4/white?text=A",
            skills: ["Decorative Painting", "Wall Art", "Furniture Painting"],
            certificates: ["Decorative Arts", "Furniture Finishing"],
            workExperience: "6 years decorative painting",
            education: "Fine Arts Course",
            expectedSalary: "₹16,000 - ₹22,000/month",
            phone: "+91-9876543232",
            email: "aakash.painter@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Bangalore",
            experience: "6 Years",
            availability: "Available"
         },
         { 
            name: "Sanjay", 
            profession: "Painter", 
            rating: "4.0",
            photo: "https://via.placeholder.com/150x150/06b6d4/white?text=S",
            skills: ["Basic Painting", "Whitewashing", "Touch-up Work"],
            certificates: ["Basic Painting"],
            workExperience: "3 years basic painting",
            education: "Self Taught",
            expectedSalary: "₹10,000 - ₹14,000/month",
            phone: "+91-9876543233",
            email: "sanjay.painter@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Chennai",
            experience: "3 Years",
            availability: "Open for Offers"
         }
      ],
      default: [
         { 
            name: "Krishna", 
            profession: "Electrician", 
            rating: "4.7",
            photo: "https://via.placeholder.com/150x150/8b5cf6/white?text=K",
            skills: ["Wiring", "Motor Repair", "Panel Installation", "Inverter Setup"],
            certificates: ["Electrical License", "Safety Training"],
            workExperience: "7 years electrical work",
            education: "ITI Electrical",
            expectedSalary: "₹18,000 - ₹25,000/month",
            phone: "+91-9876543226",
            email: "krishna.electrician@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Delhi",
            experience: "7 Years",
            availability: "Available"
         },
         { 
            name: "Ramesh", 
            profession: "Plumber", 
            rating: "4.8",
            photo: "https://via.placeholder.com/150x150/4863f7/white?text=R",
            skills: ["Pipe Fitting", "Water System Repair", "Drain Cleaning", "Installation"],
            certificates: ["Plumbing Certification", "Safety Training"],
            workExperience: "5 years experience in residential plumbing",
            education: "ITI Plumbing Course",
            expectedSalary: "₹15,000 - ₹20,000/month",
            phone: "+91-9876543210",
            email: "ramesh.plumber@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Mumbai",
            experience: "5 Years",
            availability: "Available"
         },
         { 
            name: "Diya", 
            profession: "Maid", 
            rating: "4.5",
            photo: "https://via.placeholder.com/150x150/ef4444/white?text=D",
            skills: ["House Cleaning", "Cooking", "Child Care", "Laundry"],
            certificates: ["Housekeeping Certificate", "Child Care Training"],
            workExperience: "4 years domestic help",
            education: "High School",
            expectedSalary: "₹8,000 - ₹12,000/month",
            phone: "+91-9876543218",
            email: "diya.maid@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Bangalore",
            experience: "4 Years",
            availability: "Available"
         },
         { 
            name: "Vijay", 
            profession: "Carpenter", 
            rating: "4.6",
            photo: "https://via.placeholder.com/150x150/f59e0b/white?text=V",
            skills: ["Furniture Making", "Cabinet Installation", "Door Fitting", "Wood Carving"],
            certificates: ["Carpentry License", "Wood Working"],
            workExperience: "8 years furniture making",
            education: "ITI Carpentry Course",
            expectedSalary: "₹20,000 - ₹28,000/month",
            phone: "+91-9876543222",
            email: "vijay.carpenter@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Chennai",
            experience: "8 Years",
            availability: "Available"
         },
         { 
            name: "Aakash", 
            profession: "Painter", 
            rating: "4.3",
            photo: "https://via.placeholder.com/150x150/06b6d4/white?text=A",
            skills: ["Decorative Painting", "Wall Art", "Furniture Painting"],
            certificates: ["Decorative Arts", "Furniture Finishing"],
            workExperience: "6 years decorative painting",
            education: "Fine Arts Course",
            expectedSalary: "₹16,000 - ₹22,000/month",
            phone: "+91-9876543232",
            email: "aakash.painter@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Pune",
            experience: "6 Years",
            availability: "Available"
         },
         { 
            name: "Rajesh", 
            profession: "Gardener", 
            rating: "4.7",
            photo: "https://via.placeholder.com/150x150/10b981/white?text=R",
            skills: ["Landscaping", "Plant Care", "Pest Control", "Garden Design"],
            certificates: ["Horticulture Certificate", "Organic Farming"],
            workExperience: "6 years in residential gardening",
            education: "Diploma in Agriculture",
            expectedSalary: "₹12,000 - ₹16,000/month",
            phone: "+91-9876543214",
            email: "rajesh.gardener@gmail.com",
            resume: "https://via.placeholder.com/400x600/ffffff/333333?text=Resume+Document",
            location: "Hyderabad",
            experience: "6 Years",
            availability: "Open for Offers"
         }
      ]
   };

   const getAvailabilityStatus = (availability) => {
      switch(availability) {
         case 'Available':
            return { text: 'Available ✓', class: 'available' };
         case 'Busy':
            return { text: 'Busy ✗', class: 'busy' };
         case 'Open for Offers':
            return { text: 'Open for Offers', class: 'open-for-offers' };
         default:
            return { text: 'Available ✓', class: 'available' };
      }
   };

   useEffect(() => {
       const fetchStates = async () => {
           try {
               const response = await axios.get(
                   'https://api.countrystatecity.in/v1/countries/IN/states',
                   { headers: { "X-CSCAPI-KEY": API_KEY } }
               );
               setStates(response.data);
           } catch (error) {
               console.error('Error fetching states:', error);
           }
       };
       fetchStates();
   }, []);

   useEffect(() => {
       const fetchCities = async () => {
           if (!selectedState) return;
           try {
               const response = await fetch(
                   `https://api.countrystatecity.in/v1/countries/IN/states/${selectedState}/cities`,
                   { 
                       method: 'GET',
                       headers: { "X-CSCAPI-KEY": API_KEY }
                   }
               );
               const data = await response.json();
               setCities(data);
           } catch (error) {
               console.error('Error fetching cities:', error);
           }
       };
       fetchCities();
   }, [selectedState]);

   const handleViewProfile = (staff) => {
       setSelectedStaff(staff);
       setViewMode('profile');
       setShowModal(true);
   };

   const closeModal = () => {
       setShowModal(false);
       setSelectedStaff(null);
       setViewMode('profile');
   };

   const handleCall = (phone) => {
       window.open(`tel:${phone}`, '_self');
   };

   const handleWhatsApp = (phone, name) => {
       const message = `Hi ${name}, I found your profile on Staffinn. I'm interested in hiring you.`;
       window.open(`https://wa.me/${phone.replace('+91-', '91')}?text=${encodeURIComponent(message)}`, '_blank');
   };

   const handleEmail = (email, name) => {
       const subject = `Job Opportunity - Staffinn`;
       const body = `Hi ${name},\n\nI found your profile on Staffinn and I'm interested in hiring you.\n\nPlease let me know if you're available.\n\nBest regards`;
       window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
   };

   return (
       <div className="home-page">
           <section className="hero-section">
               <div className="hero-image" style={{ backgroundImage: `url(${HomeImage})` }}>
                   <div className="home-search-container">
                       <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                           <option value="">Select State</option>
                           {states.map((state) => (
                               <option key={state.iso2} value={state.iso2}>{state.name}</option>
                           ))}
                       </select>

                       <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                           <option value="">Select City</option>
                           {cities.map((city) => (
                               <option key={city.id} value={city.id}>{city.name}</option>
                           ))}
                       </select>

                       <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)}>
                           <option value="">Select Area</option>
                           {areas.map((area, index) => (
                               <option key={index} value={area}>{area}</option>
                           ))}
                       </select>

                       <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                           <option value="">Select Category</option>
                           {categories.map((category, index) => (
                               <option key={index} value={category}>{category}</option>
                           ))}
                       </select>

                       <button className="home-search-btn">Search</button>
                   </div>
               </div>
           </section>

           <section className="home-trending-staff-section">
               <div className="home-section-header">
                   <h2>Trending Staff</h2>
                   <select 
                       value={selectedSector} 
                       onChange={(e) => setSelectedSector(e.target.value)}
                       className="home-sector-select"
                   >
                       <option value="">Select Sector</option>
                       {sectors.map((sector, index) => (
                           <option key={index} value={sector}>{sector}</option>
                       ))}
                   </select>
               </div>
               <div className="home-trending-staff-container">
                   {(selectedSector ? trendingStaff[selectedSector] : trendingStaff.default)?.map((staff, index) => (
                       <div key={index} className="home-staff-card">
                           <div className="staff-card-photo">
                               <img 
                                   src={staff.photo} 
                                   alt={staff.name}
                                   className="staff-photo"
                               />
                           </div>
                           <div className="staff-card-info">
                               <h3>{staff.name}</h3>
                               <p className="profession">{staff.profession}</p>
                               <div className="staff-details-grid">
                                   <div className="detail-item">
                                       <span className="icon">📍</span>
                                       <span>{staff.location}</span>
                                   </div>
                                   <div className="detail-item">
                                       <span className="icon">⏱</span>
                                       <span>{staff.experience}</span>
                                   </div>
                                   <div className="detail-item">
                                       <span className="icon">⭐</span>
                                       <span>Rating: {staff.rating}</span>
                                   </div>
                                   <div className={`availability-status ${getAvailabilityStatus(staff.availability).class}`}>
                                       {getAvailabilityStatus(staff.availability).text}
                                   </div>
                               </div>
                           </div>
                           <button 
                               className="home-view-profile-btn"
                               onClick={() => handleViewProfile(staff)}
                           >
                               View Profile
                           </button>
                       </div>
                   ))}
               </div>
           </section>

           <section className="home-trending-jobs-section">
               <h2>Trending Jobs</h2>
               <div className="job-cards-grid">
                   {[
                       { id: 1, title: 'Software Engineer - Full Stack', type: 'Full-time', salary: '₹12-18 LPA', experience: '3-5 years', location: 'Bangalore (Hybrid)', description: 'We\'re looking for a skilled Full Stack Developer to join our core product team.', skills: ['React', 'Node.js', 'MongoDB'], postedDate: '2 days ago' },
                       { id: 2, title: 'Senior Frontend Developer', type: 'Full-time', salary: '₹18-24 LPA', experience: '5+ years', location: 'Bangalore (Hybrid)', description: 'Join our UI team to build scalable and performant user interfaces.', skills: ['React', 'Redux', 'JavaScript'], postedDate: '1 week ago' },
                       { id: 3, title: 'UX/UI Designer', type: 'Full-time', salary: '₹10-16 LPA', experience: '2-4 years', location: 'Bangalore (Onsite)', description: 'We\'re seeking a creative UX/UI Designer to create intuitive user experiences.', skills: ['Figma', 'User Research', 'Wireframing'], postedDate: '3 days ago' },
                       { id: 4, title: 'DevOps Engineer', type: 'Full-time', salary: '₹14-20 LPA', experience: '3-6 years', location: 'Remote (India)', description: 'Help build and maintain our cloud infrastructure and CI/CD pipelines.', skills: ['AWS', 'Docker', 'Kubernetes'], postedDate: '5 days ago' },
                       { id: 5, title: 'Project Manager', type: 'Full-time', salary: '₹16-22 LPA', experience: '5-8 years', location: 'Bangalore (Hybrid)', description: 'Lead project teams in delivering complex software solutions for our clients.', skills: ['Agile', 'JIRA', 'Team Leadership'], postedDate: '1 week ago' },
                       { id: 6, title: 'Data Engineer', type: 'Contract', salary: '₹12-18 LPA', experience: '3-5 years', location: 'Remote (India)', description: 'Design and implement data pipelines and ETL processes.', skills: ['Python', 'SQL', 'ETL'], postedDate: '2 weeks ago' },
                       { id: 7, title: 'Mobile App Developer', type: 'Full-time', salary: '₹15-22 LPA', experience: '3-6 years', location: 'Pune (Hybrid)', description: 'Develop innovative mobile applications for Android and iOS platforms with focus on performance and user experience.', skills: ['React Native', 'Swift', 'Kotlin'], postedDate: '1 day ago' },
                       { id: 8, title: 'Cloud Solutions Architect', type: 'Contract', salary: '₹25-35 LPA', experience: '6-10 years', location: 'Remote (India)', description: 'Design and implement scalable cloud architecture solutions for enterprise clients across various industries.', skills: ['AWS', 'Azure', 'Terraform', 'Microservices'], postedDate: '3 days ago' }
                   ].map(job => (
                       <div className="job-card" key={job.id}>
                           <div className="job-card-header">
                               <h3 className="job-title">{job.title}</h3>
                               <div className="job-type-container">
                                   <span className={`job-type ${job.type.toLowerCase().replace('-', '')}`}>
                                       {job.type}
                                   </span>
                               </div>
                           </div>
                           
                           <div className="job-card-content">
                               <div className="job-card-details">
                                   <div className="detail-item">
                                       <span className="detail-icon">💰</span>
                                       <span className="detail-text">{job.salary}</span>
                                   </div>
                                   <div className="detail-item">
                                       <span className="detail-icon">⏱️</span>
                                       <span className="detail-text">{job.experience}</span>
                                   </div>
                                   <div className="detail-item">
                                       <span className="detail-icon">📍</span>
                                       <span className="detail-text">{job.location}</span>
                                   </div>
                               </div>
                               
                               <p className="job-description">{job.description}</p>
                               
                               <div className="job-skills">
                                   {job.skills.map((skill, index) => (
                                       <span className="skill-tag" key={index}>{skill}</span>
                                   ))}
                               </div>
                           </div>
                           
                           <div className="job-card-footer">
                               <span className="posted-date">Posted {job.postedDate}</span>
                               <button className="apply-btn">Apply Now</button>
                           </div>
                       </div>
                   ))}
               </div>
           </section>

           <section className="home-trending-courses-section">
               <h2>Trending Courses</h2>
               <div className="courses-grid">
                   {[
                       { id: 1, name: 'Full Stack Web Development', duration: '6 months', fees: '₹45,000', mode: 'Online/Offline', status: 'Enrollment Open', category: 'IT', certification: 'Industry-Specific' },
                       { id: 2, name: 'Data Science & Machine Learning', duration: '8 months', fees: '₹65,000', mode: 'Online', status: 'Enrollment Open', category: 'IT', certification: 'Industry-Specific' },
                       { id: 3, name: 'Digital Marketing', duration: '3 months', fees: '₹25,000', mode: 'Online', status: 'Enrollment Open', category: 'Management', certification: 'Government-Recognized' },
                       { id: 4, name: 'Mechanical CAD Design', duration: '4 months', fees: '₹30,000', mode: 'Offline', status: 'Enrollment Open', category: 'Engineering', certification: 'Government-Recognized' },
                       { id: 5, name: 'Industrial Automation', duration: '6 months', fees: '₹40,000', mode: 'Offline', status: 'Enrollment Closing Soon', category: 'Engineering', certification: 'Industry-Specific' },
                       { id: 6, name: 'Advanced Excel & Business Analytics', duration: '2 months', fees: '₹15,000', mode: 'Online/Offline', status: 'Enrollment Open', category: 'Management', certification: 'Industry-Specific' }
                   ].map(course => (
                       <div key={course.id} className="course-card">
                           <div className="course-header">
                               <span className="course-status">{course.status}</span>
                               <h3 className="course-name">{course.name}</h3>
                           </div>
                           <div className="course-details">
                               <div className="course-detail">
                                   <span className="detail-label">Duration:</span>
                                   <span className="detail-value">{course.duration}</span>
                               </div>
                               <div className="course-detail">
                                   <span className="detail-label">Fees:</span>
                                   <span className="detail-value">{course.fees}</span>
                               </div>
                               <div className="course-detail">
                                   <span className="detail-label">Mode:</span>
                                   <span className="detail-value">{course.mode}</span>
                               </div>
                               <div className="course-detail">
                                   <span className="detail-label">Category:</span>
                                   <span className="detail-value">{course.category}</span>
                               </div>
                               <div className="course-detail">
                                   <span className="detail-label">Certification:</span>
                                   <span className="detail-value">{course.certification}</span>
                               </div>
                           </div>
                           <button className="enroll-button">Enroll Now</button>
                       </div>
                   ))}
               </div>
           </section>

           {/* Staff Profile Modal */}
           {showModal && selectedStaff && (
               <div className="staff-modal-overlay" onClick={closeModal}>
                   <div className="staff-modal-content" onClick={(e) => e.stopPropagation()}>
                       <div className="staff-modal-header">
                           <h2>{selectedStaff.name}'s Profile</h2>
                           <button className="staff-modal-close" onClick={closeModal}>×</button>
                       </div>

                       <div className="staff-modal-nav">
                           <button 
                               className={viewMode === 'profile' ? 'active' : ''} 
                               onClick={() => setViewMode('profile')}
                           >
                               Profile
                           </button>
                           <button 
                               className={viewMode === 'resume' ? 'active' : ''} 
                               onClick={() => setViewMode('resume')}
                           >
                               Resume
                           </button>
                           <button 
                               className={viewMode === 'certificate' ? 'active' : ''} 
                               onClick={() => setViewMode('certificate')}
                           >
                               Certificates
                           </button>
                       </div>

                       <div className="staff-modal-body">
                           {viewMode === 'profile' && (
                               <div className="staff-profile-view">
                                   <div className="staff-profile-header">
                                       <img 
                                           src={selectedStaff.photo} 
                                           alt={selectedStaff.name}
                                           className="staff-profile-photo"
                                       />
                                       <div className="staff-basic-info">
                                           <h3>{selectedStaff.name}</h3>
                                           <p className="profession">{selectedStaff.profession}</p>
                                           <p className="rating">Rating: {selectedStaff.rating}⭐</p>
                                       </div>
                                   </div>

                                   <div className="staff-details">
                                       <div className="staff-section">
                                           <h4>🛠️ Skills</h4>
                                           <div className="staff-skills">
                                               {selectedStaff.skills.map((skill, index) => (
                                                   <span key={index} className="skill-tag">{skill}</span>
                                               ))}
                                           </div>
                                       </div>

                                       <div className="staff-section">
                                           <h4>📜 Certificates</h4>
                                           <div className="staff-certificates">
                                               {selectedStaff.certificates.map((cert, index) => (
                                                   <span key={index} className="certificate-tag" onClick={() => setViewMode('certificate')}>
                                                       {cert}
                                                   </span>
                                               ))}
                                           </div>
                                       </div>

                                       <div className="staff-section">
                                           <h4>💼 Work Experience</h4>
                                           <p>{selectedStaff.workExperience}</p>
                                       </div>

                                       <div className="staff-section">
                                           <h4>🎓 Education</h4>
                                           <p>{selectedStaff.education}</p>
                                       </div>

                                       <div className="staff-section">
                                           <h4>💰 Expected Salary</h4>
                                           <p className="salary">{selectedStaff.expectedSalary}</p>
                                       </div>
                                   </div>

                                   <div className="staff-actions">
                                       <button 
                                           className="hire-now-btn"
                                           onClick={() => {
                                               // Remove existing options if any
                                               const existingOptions = document.querySelector('.contact-options');
                                               if (existingOptions) {
                                                   existingOptions.remove();
                                               }

                                               const options = document.createElement('div');
                                               options.className = 'contact-options';
                                               options.innerHTML = `
                                                   <div class="contact-option" onclick="window.open('tel:${selectedStaff.phone}', '_self'); this.parentElement.remove();">
                                                       📞 Call Now
                                                   </div>
                                                   <div class="contact-option" onclick="window.open('https://wa.me/${selectedStaff.phone.replace('+91-', '91')}?text=${encodeURIComponent('Hi ' + selectedStaff.name + ', I found your profile on Staffinn. I\'m interested in hiring you.')}', '_blank'); this.parentElement.remove();">
                                                       💬 WhatsApp
                                                   </div>
                                                   <div class="contact-option" onclick="window.open('mailto:${selectedStaff.email}?subject=${encodeURIComponent('Job Opportunity - Staffinn')}&body=${encodeURIComponent('Hi ' + selectedStaff.name + ',\\n\\nI found your profile on Staffinn and I\'m interested in hiring you.\\n\\nPlease let me know if you\'re available.\\n\\nBest regards')}', '_self'); this.parentElement.remove();">
                                                       📧 Email
                                                   </div>
                                               `;
                                               
                                               // Add click outside to close
                                               options.onclick = (e) => {
                                                   if (e.target === options) {
                                                       options.remove();
                                                   }
                                               };
                                               
                                               document.body.appendChild(options);
                                               
                                               // Auto remove after 10 seconds
                                               setTimeout(() => {
                                                   if (document.body.contains(options)) {
                                                       options.remove();
                                                   }
                                               }, 10000);
                                           }}
                                       >
                                           Hire Now
                                       </button>
                                       <button 
                                           className="message-btn"
                                           onClick={() => handleWhatsApp(selectedStaff.phone, selectedStaff.name)}
                                       >
                                           💬 Message on WhatsApp
                                       </button>
                                   </div>
                               </div>
                           )}

                           {viewMode === 'resume' && (
                               <div className="staff-resume-view">
                                   <img 
                                       src={selectedStaff.resume} 
                                       alt={`${selectedStaff.name}'s Resume`}
                                       className="staff-resume-image"
                                   />
                                   <p className="resume-caption">Resume of {selectedStaff.name}</p>
                               </div>
                           )}

                           {viewMode === 'certificate' && (
                               <div className="staff-certificate-view">
                                   <h4>Certificates & Qualifications</h4>
                                   <div className="certificate-grid">
                                       {selectedStaff.certificates.map((cert, index) => (
                                           <div key={index} className="certificate-item">
                                               <img 
                                                   src={`https://via.placeholder.com/300x200/4863f7/white?text=Certificate+${index + 1}`}
                                                   alt={cert}
                                                   className="certificate-image"
                                               />
                                               <p className="certificate-name">{cert}</p>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           )}
                       </div>
                   </div>
               </div>
           )}

           <Footer />
       </div>
   );
}

export default Home;