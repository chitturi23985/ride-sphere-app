const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const request = require('request');
const geolib = require('geolib');
const router = express.Router();
const geolocationAPI = require('./geolocationAPI');
const axios = require('axios'); // Add this line if it's not already present
const twilio = require('twilio');


const port = 3000; // or any port you prefer

app.use(cors());

app.use(bodyParser.json());
// Allows cross-origin requests

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'ride_sharing_app',
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
});

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Successfully connected to MySQL database');
  connection.release();
});

// Create promise wrapper for the pool
const promisePool = db.promise();

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Internal Server Error',
    message: err.message 
  });
});

// Login endpoint for admin
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // SQL query to check the credentials
  const query = 'SELECT * FROM admin WHERE user_name = ?';

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length > 0) {
      // Compare the hashed password
      const hashedPassword = results[0].password;

      // Check if the password looks like a hash
      const isHash = hashedPassword.length === 60; // bcrypt hashes are 60 characters long

      if (isHash) {
        bcrypt.compare(password, hashedPassword, (err, isMatch) => {
          if (err) {
            console.error('Error comparing password:', err);
            return res.status(500).json({ message: 'Error comparing passwords' });
          }

          if (isMatch) {
            res.status(200).json({ success: true, message: 'Login successful' });
          } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
          }
        });
      } else {
        // Handle plain-text password scenario
        if (password === hashedPassword) {
          res.status(200).json({ success: true, message: 'Login successful' });
        } else {
          res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
      }
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  });
});

// API Endpoint to Fetch Drivers

app.get('/available-drivers', (req, res) => {
  const query = 'SELECT name, latitude, longitude FROM driver_details WHERE is_available = 1';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

// API Endpoint to Fetch Drivers
app.get('/drivers', (req, res) => {
  const userLatitude = parseFloat(req.query.latitude);
  const userLongitude = parseFloat(req.query.longitude);

  const query = 'SELECT * FROM drivers';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching drivers:', err);
      return res.status(500).json({ error: 'Failed to fetch drivers' });
    }

    const drivers = results.map(driver => {
      return {
        id: driver.id,
        name: driver.name,
        vehicle_type: driver.vehicle_type,
        latitude: parseFloat(driver.latitude),
        longitude: parseFloat(driver.longitude),
      };
    });

    res.json(drivers);
  });
});

// Route to handle ride retrieval
app.post('/getPastRides', async (req, res) => {
  const { userEmail } = req.body;
  console.log("Received userEmail:", userEmail);  // Debugging line

  if (!userEmail) {
    return res.status(400).json({ error: 'User email not provided' });
  }

  try {
    // 1. Get the user's phone number from the user_info table
    const userQuery = 'SELECT mobile FROM user_info WHERE email = ?';
    db.query(userQuery, [userEmail], (err, userResult) => {
      if (err) {
        console.error("Error fetching user from user_info:", err);  // Log the error
        return res.status(500).json({ error: 'Database query error' });
      }
      if (userResult.length === 0) {
        return res.status(400).json({ error: 'User not found' });
      }

      const userMobile = userResult[0].mobile;
      console.log("User mobile:", userMobile);  // Debugging line

      // 2. Get the ride info from ride_info table where status is 0
      const rideQuery = 'SELECT source, destination, charge, ride_date FROM ride_info WHERE user_ph = ? AND status = 0';
      db.query(rideQuery, [userMobile], async (err, rideResult) => {
        if (err) {
          console.error("Error fetching rides from ride_info:", err);  // Log the error
          return res.status(500).json({ error: 'Database query error' });
        }
        if (rideResult.length === 0) {
          return res.status(400).json({ error: 'No past rides found' });
        }

        const ride = rideResult[0];
        console.log("Ride result:", ride);  // Debugging line

        const sourceCoords = JSON.parse(ride.source);
        const destCoords = JSON.parse(ride.destination);
        console.log("Source Coordinates:", sourceCoords);
        console.log("Destination Coordinates:", destCoords);

        // 3. Convert coordinates to place names using OpenStreetMap API
        const getPlaceName = async (lat, lon) => {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
          const response = await axios.get(url);
          return response.data.display_name || 'Unknown location';
        };

        try {
          const sourceName = await getPlaceName(sourceCoords.latitude, sourceCoords.longitude);
          const destinationName = await getPlaceName(destCoords.latitude, destCoords.longitude);

          console.log("Source Name:", sourceName);
          console.log("Destination Name:", destinationName);

          // 4. Send the response back to the frontend
          res.json({
            source: sourceName,
            destination: destinationName,
            charge: ride.charge,
            ride_date: ride.ride_date
          });
        } catch (apiErr) {
          console.error("Error fetching location names:", apiErr);  // Log the error
          res.status(500).json({ error: 'Error fetching location names' });
        }
      });
    });
  } catch (error) {
    console.error("Internal server error:", error);  // Log the error
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to handle driver past ride retrieval
app.post('/getDriverPastRides', async (req, res) => {
  const { driverEmail } = req.body;
  console.log("Received driverEmail:", driverEmail); // Debugging line

  if (!driverEmail) {
    return res.status(400).json({ error: 'Driver email not provided' });
  }

  try {
    // Check for rides with the given driver email and status = 0
    const rideQuery = 'SELECT ride_id, source, destination, charge, ride_date FROM ride_info WHERE driver_email = ? AND status = 0';
    db.query(rideQuery, [driverEmail], async (err, rideResult) => {
      if (err) {
        console.error("Error fetching rides from ride_info:", err); // Log the error
        return res.status(500).json({ error: 'Database query error' });
      }
      if (rideResult.length === 0) {
        return res.status(400).json({ error: 'No past rides found' });
      }

      const rides = await Promise.all(rideResult.map(async (ride) => {
        const sourceCoords = JSON.parse(ride.source);
        const destCoords = JSON.parse(ride.destination);

        // Convert coordinates to place names using OpenStreetMap API
        const getPlaceName = async (lat, lon) => {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
          const response = await axios.get(url);
          return response.data.display_name || 'Unknown location';
        };

        try {
          const sourceName = await getPlaceName(sourceCoords.latitude, sourceCoords.longitude);
          const destinationName = await getPlaceName(destCoords.latitude, destCoords.longitude);

          return {
            source: sourceName,
            destination: destinationName,
            charge: ride.charge,
            ride_date: ride.ride_date,
            ride_id: ride.ride_id,
          };
        } catch (apiErr) {
          console.error("Error fetching location names:", apiErr); // Log the error
          return {
            source: 'Unknown location',
            destination: 'Unknown location',
            charge: ride.charge,
            ride_date: ride.ride_date,
            ride_id: ride.ride_id,
          };
        }
      }));

      // Send the response back to the frontend
      res.json(rides);
    });
  } catch (error) {
    console.error("Internal server error:", error); // Log the error
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to handle feedback submission
app.post('/submitFeedback', async (req, res) => {
  const { feedback } = req.body;
  
  if (!feedback || feedback.trim() === '') {
    return res.status(400).json({ error: 'Feedback cannot be empty' });
  }

  try {
    const feedbackQuery = 'INSERT INTO feedback (feedback) VALUES (?)';
    db.query(feedbackQuery, [feedback], (err, result) => {
      if (err) {
        console.error("Error inserting feedback:", err);
        return res.status(500).json({ error: 'Database error' });
      }
      return res.status(200).json({ message: 'Feedback submitted successfully' });
    });
  } catch (error) {
    console.error("Internal server error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to handle fetching feedback for drivers
app.get('/getFeedback', async (req, res) => {
  try {
    // Query to select all feedback from the feedback table
    const query = 'SELECT feedback, created_at FROM feedback ORDER BY created_at DESC';
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching feedback:", err);
        return res.status(500).json({ error: 'Failed to fetch feedback' });
      }

      // Send feedback to the frontend
      res.json(results);
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Convert coordinates to place names using OpenStreetMap API
const getPlaceName = async (lat, lon) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const response = await axios.get(url);
  return response.data.display_name || 'Unknown location';
};

// API endpoint to retrieve ride details
app.get('/api/getRideDetails', (req, res) => {
  const rideQuery = `SELECT ride_id, user_ph, source, destination, distance, charge, driver_ph, driver_email, ride_date 
                     FROM ride_info`;

  db.query(rideQuery, async (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'No rides found' });
    }

    // Process each ride to convert coordinates to place names
    const rides = await Promise.all(
      result.map(async (ride) => {
        const sourceCoords = JSON.parse(ride.source);
        const destCoords = JSON.parse(ride.destination);

        try {
          const sourceName = await getPlaceName(sourceCoords.latitude, sourceCoords.longitude);
          const destinationName = await getPlaceName(destCoords.latitude, destCoords.longitude);

          return {
            ride_id: ride.ride_id,
            user_ph: ride.user_ph,
            source: sourceName,
            destination: destinationName,
            distance: ride.distance,
            charge: ride.charge,
            driver_ph: ride.driver_ph,
            driver_email: ride.driver_email,
            ride_date: ride.ride_date
          };
        } catch (error) {
          console.error('Error fetching location names:', error);
          return null;
        }
      })
    );

    res.json(rides.filter(ride => ride !== null));  // Filter out failed rides
  });
});


// Twilio setup
const accountSid = 'AC388ce5e2a2059aaddccf2eab84df4554'; // Your Twilio Account SID
const authToken = 'a8cecab5d9e7d9ab11e0dec8168a8a0f'; // Your Twilio Auth Token
const twilioPhoneNumber = '+18127140949'; // Your Twilio phone number
const client = require('twilio')(accountSid, authToken);

// Function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Function to send OTP using Fast2SMS API
const sendOtp = async (phone, otp) => {
  const apiKey = 'tfnxWKvQXZjaDMmo4lESHzr0yPpYJNcOUieuGLqsB8k193dhT2A8fnMcyO3IQ1uY0URe2P94iB7GvHqT'; // Add your Fast2SMS API key here
  const url = `https://www.fast2sms.com/dev/bulkV2`;

  const queryParams = new URLSearchParams({
    authorization: apiKey,
    variables_values: otp,  // The OTP
    route: 'otp',
    numbers: phone
  });

  const options = {
    method: 'GET', // Fast2SMS OTP route expects GET
    headers: {
      'cache-control': 'no-cache'
    }
  };

  try {
    const response = await fetch(`${url}?${queryParams}`, options);
    if (response.ok) {
      const result = await response.json();
      console.log('Fast2SMS Response:', result);
      return true;
    } else {
      console.error('Error sending OTP. Status:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
};

// Function to send notification via Twilio
const sendNotification = async (phoneNumber) => {
  try {
    const message = await client.messages.create({
      body: 'You have a new ride, check the app!',
      from: twilioPhoneNumber,
      to: phoneNumber
    });
    console.log('Twilio Notification Sent:', message.sid);
    return true;
  } catch (error) {
    console.error('Error sending Twilio Notification:', error);
    return false;
  }
};

app.get('/available-drivers', (req, res) => {
  const { gender } = req.query;
  
  let query = 'SELECT * FROM driver_details WHERE is_available = 1';
  const params = [];
  
  if (gender) {
    query += ' AND gender = ?';
    params.push(gender);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching drivers' });
    }
    res.json(results);
  });
});
app.post('/book-ride', async (req, res) => {
  const { email, source, destination, distance, charge } = req.body;

  // Retrieve user's phone number from user_info table
  db.query('SELECT mobile FROM user_info WHERE email = ?', [email], (err, userResult) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching user info' });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userPhone = userResult[0].mobile;

    // Fetch all available drivers (is_available = 1) from driver_details table
    db.query('SELECT * FROM driver_details WHERE is_available = 1', (err, driverResults) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching driver details' });
      }

      if (driverResults.length === 0) {
        return res.status(404).json({ message: 'No available drivers' });
      }

      let nearestDriver = null;
      let minDistance = Infinity;

      // Calculate the nearest driver
      driverResults.forEach((driver) => {
        const driverDistance = calculateDistance(
          parseFloat(source.latitude),
          parseFloat(source.longitude),
          parseFloat(driver.latitude),
          parseFloat(driver.longitude)
        );

        if (driverDistance < minDistance) {
          minDistance = driverDistance;
          nearestDriver = driver;
        }
      });

      if (!nearestDriver) {
        nearestDriver = driverResults[Math.floor(Math.random() * driverResults.length)];
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate OTP

      // Insert ride details into ride_info table
      db.query(
        'INSERT INTO ride_info (user_ph, source, destination, distance, charge, driver_ph, driver_email, status, OTP) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          userPhone,
          JSON.stringify(source),
          JSON.stringify(destination),
          distance,
          charge,
          nearestDriver.phone_number,
          nearestDriver.email_id,
          1,
          otp,
        ],
        (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Error booking ride' });
          }

          // Send the OTP to the user
          sendOtp(userPhone, otp).then(otpSent => {
            if (otpSent) {
              // Send notification to nearest driver
              sendNotification(nearestDriver.phone_number).then(notificationSent => {
                if (notificationSent) {
                  // Update driver's is_available to 0 after sending OTP and notification
                  db.query(
                    'UPDATE driver_details SET is_available = 0 WHERE email_id = ?',
                    [nearestDriver.email_id],
                    (err, updateResult) => {
                      if (err) {
                        return res.status(500).json({ message: 'Error updating driver availability' });
                      }
                      return res.status(200).json({
                        message: 'Ride booked successfully, OTP and notification sent, and driver availability updated',
                        driverPhone: nearestDriver.phone_number,
                        driverEmail: nearestDriver.email_id,
                        otp: otp, // Include OTP in the response
                      });
                    }
                  );
                } else {
                  return res.status(500).json({ message: 'Error sending notification to the driver' });
                }
              });
            } else {
              return res.status(200).json({
                message: 'Ride booked successfully but failed to send OTP',
                driverPhone: nearestDriver.phone_number,
                driverEmail: nearestDriver.email_id,
              });
            }
          });
        }
      );
    });
  });
});





// API to get current ride details for the driver
app.post('/current-ride', (req, res) => {
  const { email } = req.body;

  console.log("Request body:", req.body); // Log the request body

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const query = `
    SELECT source, destination, distance, charge, user_ph
    FROM ride_info
    WHERE driver_email = ? AND status = 1
  `;

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error fetching ride details:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No active ride found for this driver' });
    }

    const ride = results[0];
    const source = JSON.parse(ride.source);
    const destination = JSON.parse(ride.destination);

    res.json({
      source,
      destination,
      distance: ride.distance,
      charge: ride.charge,
      user_ph: ride.user_ph,
    });
  });
});

// API route to verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp, source, destination } = req.body;

  // Query to check if the email, source, and destination match any record in ride_info
  db.query(
    'SELECT OTP FROM ride_info WHERE driver_email = ? AND source = ? AND destination = ?',
    [email, JSON.stringify(source), JSON.stringify(destination)],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error retrieving ride information' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Ride details not found' });
      }

      const storedOtp = results[0].OTP;

      // Check if the entered OTP matches the stored OTP
      if (otp === storedOtp) {
        return res.status(200).json({ message: 'OTP verified successfully' });
      } else {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
    }
  );
});


// Route to complete ride
app.post('/complete-ride', (req, res) => {
  console.log("Request body:", req.body); // Log the entire request body
  const { driver_email, user_ph, source, destination, charge, distance } = req.body;

  if (!driver_email || !user_ph || !source || !destination || !charge || !distance) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Save ride completion details in the database
  db.query(
    'INSERT INTO completed_rides (driver_email, user_ph, source, destination, charge, distance) VALUES (?, ?, ?, ?, ?, ?)',
    [driver_email, user_ph, JSON.stringify(source), JSON.stringify(destination), charge, distance],
    (err, results) => {
      if (err) {
        console.error('Error saving ride completion:', err);
        return res.status(500).json({ message: 'Error completing ride.' });
      }
      res.status(200).json({ message: 'Ride completed successfully.' });
    }
  );
});

// Route to update ride status and reset driver availability
app.post('/update-ride-status', (req, res) => {
  const { driver_email, user_ph } = req.body;

  // Update ride status to 0 (completed)
  db.query(
    'UPDATE ride_info SET status = ? WHERE driver_email = ? AND user_ph = ?',
    [0, driver_email, user_ph], // Assuming status '0' means ride completed
    (err, results) => {
      if (err) {
        console.error('Error updating ride status:', err);
        return res.status(500).json({ message: 'Error updating ride status.' });
      }

      // After updating the ride status, update driver availability
      db.query(
        'UPDATE driver_details SET is_available = ? WHERE email_id = ?',
        [1, driver_email], // Set is_available to 1 for the driver
        (err, updateResult) => {
          if (err) {
            console.error('Error updating driver availability:', err);
            return res.status(500).json({ message: 'Error updating driver availability.' });
          }

          res.status(200).json({ message: 'Ride status updated and driver availability reset successfully.' });
        }
      );
    }
  );
});





// Endpoint to get driver details by email
app.get('/api/driver-details', (req, res) => {
  const email = req.query.email; // Retrieve email from query parameters

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // SQL query to select driver details by email
  const query = 'SELECT id, name, dob, address, phone_number, email_id, driving_license_number FROM driver_details WHERE email_id = ?';

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length > 0) {
      res.status(200).json(results[0]); // Return the first matching driver details
    } else {
      res.status(404).json({ message: 'Driver not found' });
    }
  });
});
// Login endpoint
// Login endpoint for drivers
// Driver Login Endpoint
app.post('/api/driver-login', (req, res) => {
  const { username, password, latitude, longitude } = req.body;

  if (!username || !password || !latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const query = 'SELECT * FROM driver_details WHERE email_id = ?';
  
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length > 0) {
      const driver = results[0];
      const hashedPassword = driver.password;

      // Determine if the password is hashed
      const isHash = hashedPassword.startsWith('$2b$'); // bcrypt hashes start with $2b$

      if (isHash) {
        // Compare hashed password
        bcrypt.compare(password, hashedPassword, (err, isMatch) => {
          if (err) {
            console.error('Error comparing password:', err);
            return res.status(500).json({ success: false, message: 'Error comparing passwords' });
          }

          if (isMatch) {
            // Update driver's location and availability
            const updateQuery = 'UPDATE driver_details SET latitude = ?, longitude = ?, is_available = 1 WHERE email_id = ?';
            db.query(updateQuery, [latitude, longitude, username], (updateErr) => {
              if (updateErr) {
                console.error('Error updating driver location:', updateErr);
                return res.status(500).json({ success: false, message: 'Error updating driver location' });
              }

              res.status(200).json({
                success: true,
                message: 'Login successful',
                driverId: driver.id,
                driverName: driver.name
              });
            });
          } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
          }
        });
      } else {
        // Handle plain-text password scenario
        if (password === hashedPassword) {
          // Update driver's location and availability
          const updateQuery = 'UPDATE driver_details SET latitude = ?, longitude = ?, is_available = 1 WHERE email_id = ?';
          db.query(updateQuery, [latitude, longitude, username], (updateErr) => {
            if (updateErr) {
              console.error('Error updating driver location:', updateErr);
              return res.status(500).json({ success: false, message: 'Error updating driver location' });
            }

            res.status(200).json({
              success: true,
              message: 'Login successful',
              driverId: driver.id,
              driverName: driver.name
            });
          });
        } else {
          res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
      }
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  });
});





// Define the POST /api/logout route
app.post('/api/driver/logout', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Update driver's status or perform any necessary logout operations in the database
  const query = 'UPDATE driver_details SET is_available = "0" WHERE email_id = ?';

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.affectedRows > 0) {
      res.status(200).json({ message: 'Driver status updated successfully' });
    } else {
      res.status(404).json({ message: 'Driver not found' });
    }
  });
});




// Endpoint to create driver
app.post('/api/drivers', (req, res) => {
  const { name, dob, address, phone_number, email_id, driving_license_number, password } = req.body;

  if (!name || !dob || !address || !phone_number || !email_id || !driving_license_number || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).json({ message: 'Error hashing the password' });
    }

    // SQL query to insert the driver details
    const query = 'INSERT INTO driver_details (name, dob, address, phone_number, email_id, driving_license_number, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [name, dob, address, phone_number, email_id, driving_license_number, hashedPassword];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.status(200).json({ message: 'Driver details added successfully' });
    });
  });
});

// Endpoint to get all driver details
app.get('/api/drivers', (req, res) => {
  const query = 'SELECT * FROM driver_details';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// New Endpoint for resetting password
app.post('/api/reset-password', (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Email, current password, and new password are required' });
  }

  // Fetch the existing hashed password
  const fetchQuery = 'SELECT password FROM driver_details WHERE email_id = ?';
  db.query(fetchQuery, [email], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const hashedPassword = results[0].password;

    // Compare the current password
    bcrypt.compare(currentPassword, hashedPassword, (err, isMatch) => {
      if (err) {
        console.error('Error comparing password:', err);
        return res.status(500).json({ message: 'Error comparing passwords' });
      }

      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Hash the new password
      bcrypt.hash(newPassword, 10, (err, newHashedPassword) => {
        if (err) {
          console.error('Error hashing new password:', err);
          return res.status(500).json({ message: 'Error hashing the new password' });
        }

        // Update the password in the database
        const updateQuery = 'UPDATE driver_details SET password = ? WHERE email_id = ?';
        db.query(updateQuery, [newHashedPassword, email], (err) => {
          if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Database error' });
          }

          res.status(200).json({ message: 'Password reset successfully' });
        });
      });
    });
  });
});

//new user registration
app.post('/register', async (req, res) => {
  const { name, dob, age, gender, email, mobile, password } = req.body;

  try {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user details into the database
    const query = 'INSERT INTO users (name, dob, age, gender, email, mobile, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [name, dob, age, gender, email, mobile, hashedPassword], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      // ✅ Fix: Include success: true
      res.status(201).json({ success: true, message: 'User registered successfully', userId: result.insertId });
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ success: false, message: 'Error during registration' });
  }
});


// Endpoint to handle user login
// User Login Endpoint
app.post('/api/userlogin', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const query = 'SELECT * FROM user_info WHERE email = ?';

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length > 0) {
      const user = results[0];
      const hashedPassword = user.password;

      bcrypt.compare(password, hashedPassword, (err, isMatch) => {
        if (err) {
          console.error('Error comparing password:', err);
          return res.status(500).json({ success: false, message: 'Error comparing passwords' });
        }

        if (isMatch) {
          // Generate a JWT token
          const token = jwt.sign({ email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });
          res.status(200).json({ success: true, message: 'Login successful', token });
        } else {
          res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  });
});

// Endpoint to get user details
// Endpoint to get user details
app.post('/api/getUserDetails', (req, res) => {
  const { token } = req.body;

  jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const email = decoded.email;

    const query = 'SELECT name, dob, email, gender, age FROM user_info WHERE email = ?';
    db.query(query, [email], (error, results) => {
      if (error) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.length > 0) {
        res.json({ success: true, user: results[0] });
      } else {
        res.status(404).json({ success: false, message: 'User not found' });
      }
    });
  });
});

// Endpoint to reset user password
app.post('/api/user/resetPassword', (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const query = 'SELECT password FROM user_info WHERE email = ?';
  
  // Fetch the existing hashed password
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hashedPassword = results[0].password;

    // Compare the current password with the hashed one
    bcrypt.compare(currentPassword, hashedPassword, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ success: false, message: 'Error comparing passwords' });
      }

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }

      // Hash the new password
      bcrypt.hash(newPassword, 10, (err, newHashedPassword) => {
        if (err) {
          console.error('Error hashing new password:', err);
          return res.status(500).json({ success: false, message: 'Error hashing new password' });
        }

        // Update the password in the database
        const updateQuery = 'UPDATE user_info SET password = ? WHERE email = ?';
        db.query(updateQuery, [newHashedPassword, email], (err) => {
          if (err) {
            console.error('Database update error:', err);
            return res.status(500).json({ success: false, message: 'Database error during update' });
          }

          res.status(200).json({ success: true, message: 'Password reset successfully' });
        });
      });
    });
  });
});


// Get available drivers for rental
app.get('/api/rental/drivers', async (req, res) => {
  try {
    const { 
      vehicleType, 
      minPrice = 20, 
      maxPrice = 100, 
      latitude, 
      longitude,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;

    // Base query with pricing based on vehicle type
    let query = `
      SELECT 
        id, name, phone_number, email_id, 
        vehicle_type,
        CASE 
          WHEN vehicle_type = 'standard' THEN 25
          WHEN vehicle_type = 'premium' THEN 35
          WHEN vehicle_type = 'luxury' THEN 50
          ELSE 30
        END AS price_per_hour,
        latitude, longitude, is_available,
        ROUND(4.0 + RAND() * 1, 1) AS rating,
        FLOOR(10 + RAND() * 100) AS rides_completed
      FROM driver_details
      WHERE is_available = 1
    `;

    const queryParams = [];

    // Apply filters
    if (vehicleType && vehicleType !== 'all') {
      query += ' AND vehicle_type = ?';
      queryParams.push(vehicleType);
    }

    // Add price range filter
    query += `
      AND CASE 
        WHEN vehicle_type = 'standard' THEN 25
        WHEN vehicle_type = 'premium' THEN 35
        WHEN vehicle_type = 'luxury' THEN 50
        ELSE 30
      END BETWEEN ? AND ?
    `;
    queryParams.push(minPrice, maxPrice);

    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    // Execute query
    const [drivers] = await db.promise().query(query, queryParams);

    // Calculate distance if coordinates provided
    if (latitude && longitude) {
      drivers.forEach(driver => {
        if (driver.latitude && driver.longitude) {
          driver.distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(driver.latitude),
            parseFloat(driver.longitude)
          );
        }
      });

      // Sort by distance
      drivers.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM').split('LIMIT')[0];
    const [[{ total }]] = await db.promise().query(countQuery, queryParams.slice(0, -2));

    res.json({
      success: true,
      data: drivers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching rental drivers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get driver details for rental
app.get('/api/rental/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [driver] = await db.promise().query(`
      SELECT 
        id, name, phone_number, email_id, 
        vehicle_type, driving_license_number,
        latitude, longitude, is_available,
        CASE 
          WHEN vehicle_type = 'standard' THEN 25
          WHEN vehicle_type = 'premium' THEN 35
          WHEN vehicle_type = 'luxury' THEN 50
          ELSE 30
        END AS price_per_hour,
        ROUND(4.0 + RAND() * 1, 1) AS rating,
        FLOOR(10 + RAND() * 100) AS rides_completed
      FROM driver_details
      WHERE id = ?
    `, [id]);

    if (!driver.length) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Add mock availability schedule (replace with real data from your system)
    const driverData = {
      ...driver[0],
      vehicle_model: `${driver[0].vehicle_type.charAt(0).toUpperCase() + driver[0].vehicle_type.slice(1)} Vehicle`,
      availability: {
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        hours: '08:00 - 20:00'
      },
      reviews: [] // Can be populated with actual reviews if available
    };

    res.json({ success: true, data: driverData });

  } catch (error) {
    console.error('Error fetching driver details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create rental booking
app.post('/api/rental/bookings', async (req, res) => {
  try {
    const { driver_id, user_email, start_time, hours, pickup_location } = req.body;

    // Validate input
    if (!driver_id || !user_email || !start_time || !hours || !pickup_location) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Get user phone number
    const [user] = await db.promise().query('SELECT mobile FROM user_info WHERE email = ?', [user_email]);
    if (!user.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user_ph = user[0].mobile;

    // Check driver availability
    const [driver] = await db.promise().query('SELECT * FROM driver_details WHERE id = ? AND is_available = 1', [driver_id]);
    if (!driver.length) {
      return res.status(400).json({ success: false, message: 'Driver not available' });
    }

    // Calculate end time and price
    const end_time = new Date(new Date(start_time).getTime() + hours * 60 * 60 * 1000).toISOString();
    const pricePerHour = {
      standard: 25,
      premium: 35,
      luxury: 50
    }[driver[0].vehicle_type] || 30;
    const total_price = pricePerHour * hours;

    // Create booking in ride_info table
    const [result] = await db.promise().query(`
      INSERT INTO ride_info (
        user_ph, driver_ph, driver_email, 
        source, charge, ride_date, status, hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_ph,
      driver[0].phone_number,
      driver[0].email_id,
      JSON.stringify({ address: pickup_location }),
      total_price,
      start_time,
      1, // status 1 for booked
      hours
    ]);

    // Update driver availability
    await db.promise().query('UPDATE driver_details SET is_available = 0 WHERE id = ?', [driver_id]);

    res.status(201).json({
      success: true,
      bookingId: result.insertId,
      totalPrice: total_price,
      driverPhone: driver[0].phone_number,
      endTime: end_time
    });

  } catch (error) {
    console.error('Error creating rental booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
