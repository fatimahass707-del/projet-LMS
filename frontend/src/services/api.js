const BASE_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

// ---- AUTH (Fatima) ----
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

// ---- COURS (Fatima) ----
export const getCourses = async () => {
  const res = await fetch(`${BASE_URL}/courses`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const getCourseById = async (id) => {
  const res = await fetch(`${BASE_URL}/courses/${id}`, {
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

export const deleteCourse = async (id) => {
  const res = await fetch(`${BASE_URL}/courses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
};

// ---- CHAPITRES (Fatima) ----
export const createChapter = async (data) => {
  const res = await fetch(`${BASE_URL}/chapters`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getChaptersByCourse = async (courseId) => {
  const res = await fetch(`${BASE_URL}/chapters/course/${courseId}`, {
    headers: authHeaders(),
  });
  return res.json();
};

// ---- RESOURCES (Ikram) ----
export const uploadResource = async (formData) => {
  // FormData : pas de Content-Type (multipart géré automatiquement)
  const res = await fetch(`${BASE_URL}/resources`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getToken()}` },
    body: formData,
  });
  return res.json();
};

export const getResourcesByChapter = async (chapterId) => {
  const res = await fetch(`${BASE_URL}/resources/chapter/${chapterId}`, {
    headers: authHeaders(),
  });
  return res.json();
};

// ---- INSCRIPTIONS (Ikram) ----
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

// ---- QUIZ (Ikram) ----
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

export const getResults = async (quizId) => {
  const res = await fetch(`${BASE_URL}/quizzes/${quizId}/results`, {
    headers: authHeaders(),
  });
  return res.json();
};

// ---- PROGRESSION (Ikram) ----
export const getProgress = async (courseId) => {
  const res = await fetch(`${BASE_URL}/progress/${courseId}`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const updateProgress = async (data) => {
  const res = await fetch(`${BASE_URL}/progress/update`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

// ---- ANNONCES (Ikram) ----
export const getAnnouncements = async (courseId) => {
  const res = await fetch(`${BASE_URL}/announcements?course_id=${courseId}`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createAnnouncement = async (data) => {
  const res = await fetch(`${BASE_URL}/announcements`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};