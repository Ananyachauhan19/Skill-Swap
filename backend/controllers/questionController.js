const Question = require('../models/Question');

exports.createQuestion = async (req, res) => {
  try {
    const { subject, topic, subtopic, questionText } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const question = new Question({
      subject,
      topic,
      subtopic,
      questionText,
      fileUrl,
    });

    await question.save();
    res.status(201).json({ message: 'Question submitted!', question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 