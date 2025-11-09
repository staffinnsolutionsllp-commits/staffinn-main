import React, { useState } from 'react';
import './CourseQuizManager.css';

const CourseQuizManager = ({ moduleIndex, onQuizUpdate }) => {
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    passingScore: 70,
    timeLimit: 30,
    maxAttempts: 3,
    questions: []
  });

  const [showQuizForm, setShowQuizForm] = useState(false);

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1
    };
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId, field, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateQuestionOption = (questionId, optionIndex, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options.map((opt, idx) => idx === optionIndex ? value : opt)
            } 
          : q
      )
    }));
  };

  const removeQuestion = (questionId) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleSaveQuiz = () => {
    if (quiz.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    // Validate questions
    const invalidQuestions = quiz.questions.filter(q => 
      !q.question.trim() || 
      q.options.some(opt => !opt.trim()) || 
      !q.correctAnswer || !q.correctAnswer.trim()
    );

    if (invalidQuestions.length > 0) {
      alert('Please fill in all question fields and options');
      return;
    }

    onQuizUpdate(moduleIndex, quiz);
    setShowQuizForm(false);
  };

  const handleCancelQuiz = () => {
    setQuiz({
      title: '',
      description: '',
      passingScore: 70,
      timeLimit: 30,
      maxAttempts: 3,
      questions: []
    });
    setShowQuizForm(false);
    onQuizUpdate(moduleIndex, null);
  };

  return (
    <div className="quiz-manager">
      {!showQuizForm ? (
        <button 
          type="button"
          className="add-quiz-btn"
          onClick={() => setShowQuizForm(true)}
          style={{
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            marginLeft: '10px'
          }}
        >
          💡 Add Quiz
        </button>
      ) : (
        <div className="quiz-form">
          <div className="quiz-form-header">
            <h4>Create Quiz for Module {moduleIndex + 1}</h4>
            <button 
              type="button"
              className="close-quiz-form"
              onClick={handleCancelQuiz}
            >
              ×
            </button>
          </div>

          <div className="quiz-basic-info">
            <div className="form-group">
              <label>Quiz Title</label>
              <input
                type="text"
                value={quiz.title}
                onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter quiz title"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={quiz.description}
                onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter quiz description"
                rows="3"
              />
            </div>

            <div className="quiz-settings">
              <div className="form-group">
                <label>Passing Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={quiz.passingScore}
                  onChange={(e) => setQuiz(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                />
              </div>

              <div className="form-group">
                <label>Time Limit (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={quiz.timeLimit}
                  onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                />
              </div>

              <div className="form-group">
                <label>Max Attempts</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quiz.maxAttempts}
                  onChange={(e) => setQuiz(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          <div className="quiz-questions">
            <div className="questions-header">
              <h5>Questions ({quiz.questions.length})</h5>
              <button 
                type="button"
                className="add-question-btn"
                onClick={addQuestion}
              >
                + Add Question
              </button>
            </div>

            {quiz.questions.map((question, index) => (
              <div key={question.id} className="question-form">
                <div className="question-header">
                  <h6>Question {index + 1}</h6>
                  <button 
                    type="button"
                    className="remove-question-btn"
                    onClick={() => removeQuestion(question.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="form-group">
                  <label>Question Text</label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                    placeholder="Enter your question"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Answer Options</label>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="option-input">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateQuestionOption(question.id, optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctAnswer === option}
                        onChange={() => updateQuestion(question.id, 'correctAnswer', option)}
                      />
                      <label>Correct</label>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label>Points</label>
                  <input
                    type="number"
                    min="1"
                    value={question.points}
                    onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="quiz-form-actions">
            <button 
              type="button"
              className="save-quiz-btn"
              onClick={handleSaveQuiz}
            >
              Save Quiz
            </button>
            <button 
              type="button"
              className="cancel-quiz-btn"
              onClick={handleCancelQuiz}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseQuizManager;