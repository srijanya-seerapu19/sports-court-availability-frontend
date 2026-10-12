import React, { useState, useEffect } from 'react';

// Dynamic API URL for Vite
const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

function CourtComponent() {
  const [courts, setCourts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/courts`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Server response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setCourts(data);
      })
      .catch((err) => {
        console.error(err);
        setError('Could not load courts. Make sure the Spring Boot backend is running.');
      });
  }, []);

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Available Courts</h2>
      <ul>
        {courts.map((court, index) => (
          <li key={index}>{court.name || court}</li>
        ))}
      </ul>
    </div>
  );
}

export default CourtComponent;