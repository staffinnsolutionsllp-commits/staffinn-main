export const calculateCourseProgress = (course, userProgress) => {
  if (!course?.modules || !userProgress) return 0;
  
  let totalItems = 0;
  let completedItems = 0;
  
  course.modules.forEach(module => {
    if (module.content) {
      totalItems += module.content.length;
      module.content.forEach(content => {
        if (content.contentType === 'quiz') {
          if (userProgress.completedQuizzes?.[content.contentId]?.passed) {
            completedItems++;
          }
        } else {
          if (userProgress.completedContent?.[content.contentId]) {
            completedItems++;
          }
        }
      });
    }
    if (module.quiz) {
      totalItems += 1;
      if (userProgress.completedQuizzes?.[module.quiz.quizId]?.passed) {
        completedItems++;
      }
    }
  });
  
  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
};