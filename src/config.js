const API_BASE_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://127.0.0.1:5000" : "";
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || "archipegv2@gmail.com";

export { API_BASE_URL, ADMIN_EMAIL };
export default API_BASE_URL;
