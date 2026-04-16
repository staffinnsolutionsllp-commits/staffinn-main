import React, { useState, useEffect } from 'react';
import apiWithLoading from '../../services/apiWithLoading';
import CourseCard from '../common/CourseCard';
import './CoursesPage.css';
import { FaSearch } from 'react-icons/fa';

const CoursesPage = ({ isLoggedIn, onShowLogin }) => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading all public courses...');
      const response = await apiWithLoading.getAllPublicCourses();
      console.log('📊 Courses API Response:', response);
      console.log('📊 Response data type:', typeof response.data);
      console.log('📊 Is array:', Array.isArray(response.data));
      
      if (response.success && response.data && Array.isArray(response.data)) {
        console.log('✅ Courses loaded:', response.data.length);
        console.log('📋 First course data:', response.data[0]);
        console.log('📋 All course keys:', response.data[0] ? Object.keys(response.data[0]) : 'No data');
        
        // Check if data contains actual courses or institutes
        const firstItem = response.data[0];
        if (firstItem && (firstItem.instituteName || firstItem.instituteId) && !firstItem.courseName) {
          console.log('⚠️ API returned institutes instead of courses, fetching courses from each institute...');
          
          // Fetch courses from each institute
          const allCourses = [];
          for (const institute of response.data) {
            try {
              const instituteId = institute.instituteId || institute.instituteID || institute.id;
              if (instituteId) {
                const coursesResponse = await apiWithLoading.getPublicCourses(instituteId);
                if (coursesResponse.success && coursesResponse.data && Array.isArray(coursesResponse.data)) {
                  console.log(`✅ Fetched ${coursesResponse.data.length} courses from ${institute.instituteName}`);
                  allCourses.push(...coursesResponse.data);
                }
              }
            } catch (err) {
              console.error('Error fetching courses for institute:', institute.instituteName, err);
            }
          }
          
          console.log('✅ Total courses fetched:', allCourses.length);
          setCourses(allCourses);
          setFilteredCourses(allCourses);
        } else {
          // Data already contains courses
          setCourses(response.data);
          setFilteredCourses(response.data);
        }
      } else {
        console.log('⚠️ No courses found or API error:', response);
        setCourses([]);
        setFilteredCourses([]);
      }
    } catch (error) {
      console.error('❌ Error loading courses:', error);
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let results = courses;
    console.log('🔍 Filtering courses. Total:', courses.length);

    if (searchTerm) {
      results = results.filter(course =>
        course.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instituteName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 After search filter:', results.length);
    }

    if (categoryFilter) {
      results = results.filter(course =>
        course.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
      console.log('🔍 After category filter:', results.length);
    }

    if (modeFilter) {
      results = results.filter(course => {
        const courseMode = course.mode?.toLowerCase().trim();
        const filterMode = modeFilter.toLowerCase().trim();
        console.log('🔍 Comparing mode:', courseMode, 'with filter:', filterMode);
        return courseMode === filterMode;
      });
      console.log('🔍 After mode filter:', results.length);
    }

    console.log('✅ Final filtered courses:', results.length);
    setFilteredCourses(results);
  }, [searchTerm, categoryFilter, modeFilter, courses]);

  const handleViewCourse = (course) => {
    if (!isLoggedIn) {
      onShowLogin();
      return;
    }
    const courseId = course.coursesId || course.instituteCourseID;
    window.location.href = `/course-learning/${courseId}`;
  };

  return (
    <div className="courses-page">
      <div className="courses-hero-section">
        <div className="courses-hero-content">
          <h1>Explore Our Courses</h1>
          <p>Learn new skills from top institutes with online and on-campus courses</p>
        </div>
      </div>

      <div className="courses-search-section">
        <div className="courses-search-container">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by course name or institute..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="courses-search-input"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="courses-filter-select"
          >
            <option value="">All Categories</option>
            <option value="Technology">Technology</option>
            <option value="Business">Business</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Development">Development</option>
          </select>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="courses-filter-select"
          >
            <option value="">All Modes</option>
            <option value="online">Online</option>
            <option value="on-campus">On-Campus</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div className="courses-content">
        <div className="courses-stats">
          <h2>Available Courses</h2>
          <p>{filteredCourses.length} courses found</p>
        </div>

        {loading ? (
          <div className="courses-loading">
            <p>Loading courses...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="courses-grid">
            {filteredCourses.map((course) => {
              const courseId = course.coursesId || course.instituteCourseID;
              return (
                <CourseCard
                  key={courseId}
                  course={course}
                  onViewCourse={handleViewCourse}
                  buttonText="View Course"
                />
              );
            })}
          </div>
        ) : (
          <div className="no-courses">
            <h3>No courses found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
