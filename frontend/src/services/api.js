const BASE_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) return { error: data.message || 'Une erreur est survenue' };
    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    return { error: 'Erreur de connexion au serveur.' };
  }
};

// ---- AUTH ----
export const register = (data) => apiCall(`${BASE_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const login = (data) => apiCall(`${BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

// ---- PROFILE ----
export const getProfile = () => apiCall(`${BASE_URL}/profile`, { headers: authHeaders() });
export const updateProfile = (data) => apiCall(`${BASE_URL}/profile`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
export const updatePassword = (data) => apiCall(`${BASE_URL}/profile/password`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });

// ---- COURS ----
export const getCourses = () => apiCall(`${BASE_URL}/courses`, { headers: authHeaders() });
export const getMyCourses = () => apiCall(`${BASE_URL}/courses/mine`, { headers: authHeaders() });
export const getCourseById = (id) => apiCall(`${BASE_URL}/courses/${id}`, { headers: authHeaders() });
export const getCourseStudents = (id) => apiCall(`${BASE_URL}/courses/${id}/students`, { headers: authHeaders() });
export const createCourse = (data) => apiCall(`${BASE_URL}/courses`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
export const updateCourse = (id, data) => apiCall(`${BASE_URL}/courses/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
export const deleteCourse = (id) => apiCall(`${BASE_URL}/courses/${id}`, { method: 'DELETE', headers: authHeaders() });

// ---- CHAPITRES ----
export const getChaptersByCourse = (courseId) => apiCall(`${BASE_URL}/chapters/course/${courseId}`, { headers: authHeaders() });
export const createChapter = (data) => apiCall(`${BASE_URL}/chapters`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
export const updateChapter = (id, data) => apiCall(`${BASE_URL}/chapters/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
export const deleteChapter = (id) => apiCall(`${BASE_URL}/chapters/${id}`, { method: 'DELETE', headers: authHeaders() });

// ---- RESOURCES ----
export const getResourcesByChapter = (chapterId) => apiCall(`${BASE_URL}/resources/chapter/${chapterId}`, { headers: authHeaders() });
export const createResource = (data) => apiCall(`${BASE_URL}/resources`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
export const uploadResource = (formData) => apiCall(`${BASE_URL}/resources`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
export const updateResource = (id, formData) => apiCall(`${BASE_URL}/resources/${id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
export const deleteResource = (id) => apiCall(`${BASE_URL}/resources/${id}`, { method: 'DELETE', headers: authHeaders() });

// ---- INSCRIPTIONS ----
export const enrollCourse = (courseId) => apiCall(`${BASE_URL}/enrollments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ course_id: courseId }) });
export const getMyEnrollments = () => apiCall(`${BASE_URL}/enrollments/mine`, { headers: authHeaders() });

// ---- QUIZ ----
export const getQuiz = (quizId) => apiCall(`${BASE_URL}/quizzes/${quizId}`, { headers: authHeaders() });
export const getQuizzesByCourse = (courseId) => apiCall(`${BASE_URL}/quizzes/course/${courseId}`, { headers: authHeaders() });
export const createQuiz = (data) => apiCall(`${BASE_URL}/quizzes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
export const deleteQuiz = (id) => apiCall(`${BASE_URL}/quizzes/${id}`, { method: 'DELETE', headers: authHeaders() });
export const submitQuiz = (quizId, answers) => apiCall(`${BASE_URL}/quizzes/${quizId}/submit`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ answers }) });
export const getResults = (quizId) => apiCall(`${BASE_URL}/quizzes/${quizId}/results`, { headers: authHeaders() });
export const getMySubmissions = () => apiCall(`${BASE_URL}/quizzes/my/submissions`, { headers: authHeaders() });

// ---- ANNONCES ----
export const getAnnouncements = (courseId) => apiCall(`${BASE_URL}/announcements?course_id=${courseId}`, { headers: authHeaders() });
export const createAnnouncement = (data) => apiCall(`${BASE_URL}/announcements`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
export const updateAnnouncement = (id, data) => apiCall(`${BASE_URL}/announcements/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
export const deleteAnnouncement = (id) => apiCall(`${BASE_URL}/announcements/${id}`, { method: 'DELETE', headers: authHeaders() });

// ---- ADMIN ----
export const getUsers = () => apiCall(`${BASE_URL}/admin/users`, { headers: authHeaders() });
export const createUser = (data) => apiCall(`${BASE_URL}/admin/users`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
export const updateAdminUser = (id, data) => apiCall(`${BASE_URL}/admin/users/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
export const resetUserPassword = (id, newPassword) => apiCall(`${BASE_URL}/admin/users/${id}/reset-password`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ newPassword }) });
export const deleteUser = (userId) => apiCall(`${BASE_URL}/admin/users/${userId}`, { method: 'DELETE', headers: authHeaders() });
export const getAdminStats = () => apiCall(`${BASE_URL}/admin/stats`, { headers: authHeaders() });
export const getAllCourses = () => apiCall(`${BASE_URL}/admin/courses`, { headers: authHeaders() });
export const updateAdminCourse = (id, data) => apiCall(`${BASE_URL}/admin/courses/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
export const getAdminEnrollments = () => apiCall(`${BASE_URL}/admin/enrollments`, { headers: authHeaders() });
export const adminEnrollStudent = (data) => apiCall(`${BASE_URL}/admin/enrollments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
export const adminUnenrollStudent = (sId, cId) => apiCall(`${BASE_URL}/admin/enrollments/${sId}/${cId}`, { method: 'DELETE', headers: authHeaders() });

// ---- PROGRESSION ----
export const getProgress = (courseId) => apiCall(`${BASE_URL}/progress/${courseId}`, { headers: authHeaders() });
export const updateProgress = (data) => apiCall(`${BASE_URL}/progress/update`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });

// ---- NOTIFICATIONS ----
export const getNotifications = () => apiCall(`${BASE_URL}/notifications`, { headers: authHeaders() });