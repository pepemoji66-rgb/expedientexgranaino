const API_BASE_URL = window.location.hostname === "localhost" ? "http://localhost:10000" : "";
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || "archipegv2@gmail.com";

export { API_BASE_URL, ADMIN_EMAIL };
export default API_BASE_URL;
