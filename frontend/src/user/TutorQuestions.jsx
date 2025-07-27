import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TutorQuestions = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    axios.get('https://skill-swap-69nw.onrender.com/api/questions/')
      .then(res => setQuestions(res.data))
      .catch(() => setQuestions([]));
  }, []);

  return (
    <div>
      <h2>Student Questions</h2>
      {questions.map(q => (
        <div key={q._id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
          <p><b>Subject:</b> {q.subject}</p>
          <p><b>Topic:</b> {q.topic}</p>
          <p><b>Subtopic:</b> {q.subtopic}</p>
          <p><b>Question:</b> {q.questionText}</p>
          {q.fileUrl && (
            <a href={`https://skill-swap-69nw.onrender.com${q.fileUrl}`} target="_blank" rel="noopener noreferrer">
              View Uploaded File
            </a>
          )}
        </div>
      ))}
    </div>
  );
};

export default TutorQuestions; 