import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FindRide = () => {
  const [rides, setRides] = useState([]);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: ''
  });

  // 🚨 ERROR: Incorrect API call with wrong parameters
  const searchRides = async () => {
    try {
      // ❌ WRONG: Sending data in wrong format
      const response = await axios.get('/api/rides', {
        params: {
          fromCity: searchParams.from, // Should be just 'from'
          toCity: searchParams.to,     // Should be just 'to' 
          rideDate: searchParams.date  // Should be just 'date'
        }
      });
      setRides(response.data);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setRides([]);
    }
  };

  return (
    <div>
      <input 
        placeholder="From" 
        value={searchParams.from}
        onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
      />
      <input 
        placeholder="To" 
        value={searchParams.to}
        onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
      />
      <input 
        type="date"
        value={searchParams.date}
        onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
      />
      <button onClick={searchRides}>Search Rides</button>
      
      {/* 🚨 ERROR: Always showing "0 rides found" */}
      <div>{rides.length} rides found</div>
    </div>
  );
};