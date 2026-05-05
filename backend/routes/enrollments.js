 const express = require("express");
const router = express.Router();

// مؤقتاً نخزنو التسجيلات هنا باش يخدم مباشرة
let enrollments = [];

// Test route
router.get("/", (req, res) => {
  res.json({
    message: "Enrollments route is working",
    data: enrollments,
  });
});

// Student enrolls in a course
router.post("/", (req, res) => {
  const { student_id, course_id } = req.body;

  if (!student_id || !course_id) {
    return res.status(400).json({
      message: "student_id and course_id are required",
    });
  }

  const alreadyEnrolled = enrollments.find(
    (e) => e.student_id == student_id && e.course_id == course_id
  );

  if (alreadyEnrolled) {
    return res.status(409).json({
      message: "Student already enrolled in this course",
    });
  }

  const newEnrollment = {
    id: enrollments.length + 1,
    student_id,
    course_id,
    created_at: new Date(),
  };

  enrollments.push(newEnrollment);

  res.status(201).json({
    message: "Enrollment created successfully",
    enrollment: newEnrollment,
  });
});

// Get student enrollments
router.get("/student/:student_id", (req, res) => {
  const { student_id } = req.params;

  const studentEnrollments = enrollments.filter(
    (e) => e.student_id == student_id
  );

  res.json({
    student_id,
    enrollments: studentEnrollments,
  });
});

// Check enrollment
router.get("/check/:student_id/:course_id", (req, res) => {
  const { student_id, course_id } = req.params;

  const enrolled = enrollments.some(
    (e) => e.student_id == student_id && e.course_id == course_id
  );

  res.json({ enrolled });
});

// Delete enrollment
router.delete("/:student_id/:course_id", (req, res) => {
  const { student_id, course_id } = req.params;

  const before = enrollments.length;

  enrollments = enrollments.filter(
    (e) => !(e.student_id == student_id && e.course_id == course_id)
  );

  if (before === enrollments.length) {
    return res.status(404).json({
      message: "Enrollment not found",
    });
  }

  res.json({
    message: "Enrollment deleted successfully",
  });
});

module.exports = router;