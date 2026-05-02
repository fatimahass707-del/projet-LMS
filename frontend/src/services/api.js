const BASE_URL = 'http://localhost:5000/api';

// Récupère le token stocké
const getToken = () => localStorage.getItem('token');

// Headers avec token JWT
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

// ---- AUTH ----
export const register = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const login = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

// ---- COURS ----
export const getCourses = async () => {
  const res = await fetch(`${BASE_URL}/courses`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createCourse = async (data) => {
  const res = await fetch(`${BASE_URL}/courses`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

// ---- INSCRIPTIONS ----
export const enrollCourse = async (courseId) => {
  const res = await fetch(`${BASE_URL}/enrollments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ course_id: courseId }),
  });
  return res.json();
};

export const getMyEnrollments = async () => {
  const res = await fetch(`${BASE_URL}/enrollments/mine`, {
    headers: authHeaders(),
  });
  return res.json();
};

// ---- QUIZ ----
export const getQuiz = async (quizId) => {
  const res = await fetch(`${BASE_URL}/quizzes/${quizId}`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const submitQuiz = async (quizId, answers) => {
  const res = await fetch(`${BASE_URL}/quizzes/${quizId}/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ answers }),
  });
  return res.json();
};

// ---- ANNONCES ----
export const getAnnouncements = async (courseId) => {
  const res = await fetch(`${BASE_URL}/announcements?course_id=${courseId}`, {
    headers: authHeaders(),
  });
  return res.json();
};