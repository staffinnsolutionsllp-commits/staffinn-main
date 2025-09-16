# Backend API Requirements for Progress Tracking

## Required Endpoints

### 1. Mark Content Complete
**POST** `/api/v1/institutes/courses/:courseId/content/:contentId/complete`

**Headers:**
- Authorization: Bearer {token}
- Content-Type: application/json

**Body:**
```json
{
  "contentType": "video" | "assignment" | "quiz"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content marked as complete"
}
```

**Database Action:**
- Insert/Update record in `course-enrolled-user` table
- Fields: `user_id`, `course_id`, `content_id`, `content_type`, `completed_at`, `is_completed`

### 2. Mark Quiz Complete
**POST** `/api/v1/institutes/courses/:courseId/quiz/:quizId/complete`

**Headers:**
- Authorization: Bearer {token}
- Content-Type: application/json

**Body:**
```json
{
  "quizType": "content" | "module",
  "passed": true | false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz marked as complete"
}
```

**Database Action:**
- Insert/Update record in `course-enrolled-user` table
- Fields: `user_id`, `course_id`, `quiz_id`, `quiz_type`, `passed`, `completed_at`

### 3. Get User Progress
**GET** `/api/v1/institutes/courses/:courseId/progress`

**Headers:**
- Authorization: Bearer {token}

**Response:**
```json
{
  "success": true,
  "data": {
    "completedContent": {
      "content_id_1": {
        "completedAt": "2024-01-01T10:00:00Z",
        "contentType": "video"
      },
      "content_id_2": {
        "completedAt": "2024-01-01T11:00:00Z", 
        "contentType": "assignment"
      }
    },
    "completedQuizzes": {
      "quiz_id_1": {
        "passed": true,
        "completedAt": "2024-01-01T12:00:00Z",
        "quizType": "content"
      },
      "module-quiz-quiz_id_2": {
        "passed": true,
        "completedAt": "2024-01-01T13:00:00Z",
        "quizType": "module"
      }
    }
  }
}
```

**Database Query:**
- SELECT from `course-enrolled-user` table WHERE `user_id` = current_user AND `course_id` = courseId

## Database Schema Requirements

### Table: `course-enrolled-user` (extend existing table)

Add these columns if they don't exist:
```sql
ALTER TABLE course_enrolled_user ADD COLUMN progress_data JSON;
```

OR create separate progress tracking:

### Table: `user_course_progress`
```sql
CREATE TABLE user_course_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  content_id VARCHAR(255),
  quiz_id VARCHAR(255),
  content_type ENUM('video', 'assignment', 'quiz'),
  quiz_type ENUM('content', 'module'),
  is_completed BOOLEAN DEFAULT FALSE,
  passed BOOLEAN DEFAULT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  
  UNIQUE KEY unique_content_progress (user_id, course_id, content_id),
  UNIQUE KEY unique_quiz_progress (user_id, course_id, quiz_id)
);
```

## Implementation Priority

1. **HIGH PRIORITY**: Implement these 3 endpoints
2. **MEDIUM PRIORITY**: Create database schema
3. **LOW PRIORITY**: Add data validation and error handling

## Current Status

- ✅ Frontend implementation complete with localStorage fallback
- ❌ Backend APIs need to be implemented
- ❌ Database schema needs to be created

Once backend APIs are implemented, the localStorage fallback will automatically switch to using the real database.