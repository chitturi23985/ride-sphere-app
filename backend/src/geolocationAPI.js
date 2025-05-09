const axios = require('axios');

// Function to convert coordinates to places using OpenStreetMap's Nominatim API
const convertCoordinatesToPlace = async (coordinates) => {
  const [latitude, longitude] = coordinates.split(',');

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

  try {
    const response = await axios.get(url);
    const place = response.data.display_name; // Get the formatted place name from OSM
    return place;
  } catch (error) {
    console.error("Error converting coordinates using OSM:", error);
    return "Unknown Location";
  }
};

module.exports = {
  convertCoordinatesToPlace
};
