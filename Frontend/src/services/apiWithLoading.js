import apiService from './api.js';

// Store reference to loading context functions
let globalLoadingFunctions = null;

// Initialize loading functions
export const initializeLoadingService = (loadingFunctions) => {
  globalLoadingFunctions = loadingFunctions;
};

// Create a proxy wrapper for API service that automatically handles loading
const createLoadingWrapper = (service) => {
  const wrapper = {};
  
  // List of methods that should show loading
  const loadingMethods = [
    'login', 'register', 'getProfile', 'updateStaffProfile', 'updateRecruiterProfile',
    'updateInstituteProfile', 'getAllInstitutes', 'getInstituteById', 'getAllRecruiters',
    'getRecruiterById', 'getAllActiveJobs', 'getTrendingJobs', 'getTodaysJobs', 'getTrendingCourses',
    'applyForJob', 'followRecruiter', 'unfollowRecruiter', 'addReview', 'getReviews',
    'uploadFiles', 'addStudent', 'getStudents', 'addCourse', 'getCourses',
    'enrollInCourse', 'getCourseContent', 'submitQuiz', 'updateProgress',
    'createJob', 'updateJob', 'deleteJob', 'getRecruiterJobs', 'addRecruiterNews',
    'getRecruiterNews', 'updateRecruiterNews', 'deleteRecruiterNews',
    'updatePlacementSection', 'getPlacementSection', 'updateIndustryCollaborations',
    'getIndustryCollaborations', 'addEventNews', 'getEventNews', 'updateEventNews',
    'deleteEventNews'
  ];

  // Create wrapper methods
  Object.keys(service).forEach(methodName => {
    if (typeof service[methodName] === 'function') {
      wrapper[methodName] = async (...args) => {
        const shouldShowLoading = loadingMethods.includes(methodName);
        
        if (shouldShowLoading && globalLoadingFunctions) {
          try {
            globalLoadingFunctions.showLoading(getLoadingMessage(methodName));
            const result = await service[methodName](...args);
            return result;
          } finally {
            globalLoadingFunctions.hideLoading();
          }
        } else {
          return service[methodName](...args);
        }
      };
    } else {
      wrapper[methodName] = service[methodName];
    }
  });

  return wrapper;
};

// Get appropriate loading message for different operations
const getLoadingMessage = (methodName) => {
  const messages = {
    login: 'Signing you in...',
    register: 'Creating your account...',
    getProfile: 'Loading profile...',
    updateStaffProfile: 'Updating profile...',
    updateRecruiterProfile: 'Updating profile...',
    updateInstituteProfile: 'Updating profile...',
    getAllInstitutes: 'Loading institutes...',
    getInstituteById: 'Loading institute details...',
    getAllRecruiters: 'Loading recruiters...',
    getRecruiterById: 'Loading recruiter details...',
    getAllActiveJobs: 'Loading jobs...',
    getTrendingJobs: 'Loading trending jobs...',
    getTodaysJobs: 'Loading today\'s job alerts...',
    getTrendingCourses: 'Loading trending courses...',
    applyForJob: 'Submitting application...',
    followRecruiter: 'Following recruiter...',
    unfollowRecruiter: 'Unfollowing recruiter...',
    addReview: 'Submitting review...',
    getReviews: 'Loading reviews...',
    uploadFiles: 'Uploading files...',
    addStudent: 'Adding student...',
    getStudents: 'Loading students...',
    addCourse: 'Creating course...',
    getCourses: 'Loading courses...',
    enrollInCourse: 'Enrolling in course...',
    getCourseContent: 'Loading course content...',
    submitQuiz: 'Submitting quiz...',
    updateProgress: 'Updating progress...',
    createJob: 'Creating job posting...',
    updateJob: 'Updating job...',
    deleteJob: 'Deleting job...',
    getRecruiterJobs: 'Loading your jobs...',
    addRecruiterNews: 'Publishing news...',
    getRecruiterNews: 'Loading news...',
    updateRecruiterNews: 'Updating news...',
    deleteRecruiterNews: 'Deleting news...',
    updatePlacementSection: 'Updating placement data...',
    getPlacementSection: 'Loading placement data...',
    updateIndustryCollaborations: 'Updating collaborations...',
    getIndustryCollaborations: 'Loading collaborations...',
    addEventNews: 'Publishing event/news...',
    getEventNews: 'Loading events & news...',
    updateEventNews: 'Updating event/news...',
    deleteEventNews: 'Deleting event/news...'
  };

  return messages[methodName] || 'Loading...';
};

// Create the wrapped API service
const apiWithLoading = createLoadingWrapper(apiService);

export default apiWithLoading;