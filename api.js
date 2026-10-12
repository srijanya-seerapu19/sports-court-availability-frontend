// Replace: const API_URL = "http://localhost:5000";
// With this:
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";