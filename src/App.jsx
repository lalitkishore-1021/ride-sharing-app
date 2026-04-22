import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { MapPin, Navigation, Clock, DollarSign, Star, User, TrendingUp, Activity, Search, Car, Check, X, Menu, Wallet, Settings, LogOut, Locate } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDIiIHZpZXdCb3g9IjAgMCAzMiA0MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMEMxMC40NzcgMCA2IDQuNDc3IDYgMTBDNiAxNy41IDE2IDQyIDE2IDQyQzE2IDQyIDI2IDE3LjUgMjYgMTBDMjYgNC40NzcgMjEuNTIzIDAgMTYgMFoiIGZpbGw9IiNDRERDMzkiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjEwIiByPSI0IiBmaWxsPSIjMDAwIi8+PC9zdmc+',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42]
});

const dropoffIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDIiIHZpZXdCb3g9IjAgMCAzMiA0MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMEMxMC40NzcgMCA2IDQuNDc3IDYgMTBDNiAxNy41IDE2IDQyIDE2IDQyQzE2IDQyIDI2IDE3LjUgMjYgMTBDMjYgNC40NzcgMjEuNTIzIDAgMTYgMFoiIGZpbGw9IiMwMDAiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjEwIiByPSI0IiBmaWxsPSIjZmZmIi8+PC9zdmc+',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42]
});

// Map recenter component
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

// Haversine distance calculator
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const RideSharingApp = () => {
  // Centralized State
  const [currentRole, setCurrentRole] = useState('rider');
  const [riders, setRiders] = useState([
    { id: 1, name: 'Rajesh Kumar', wallet: 500, location: 'Chrompet' }
  ]);
  const [drivers, setDrivers] = useState([
    { id: 1, name: 'Ravi Kumar', vehicle: 'Toyota Innova', plate: 'TN-01-AB-1234', isOnline: false, rating: 4.8, earnings: 0, currentRide: null },
    { id: 2, name: 'Suresh Babu', vehicle: 'Honda City', plate: 'TN-02-CD-5678', isOnline: false, rating: 4.9, earnings: 0, currentRide: null }
  ]);
  const [rides, setRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  
  // Rider State
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [distance, setDistance] = useState('');
  const [fareEstimate, setFareEstimate] = useState(null);
  const [rideStatus, setRideStatus] = useState('idle');
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [userRating, setUserRating] = useState(0);

  // Map State
  const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]); // Chennai
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  
  // Search State
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);

  // Driver State
  const [selectedDriverId, setSelectedDriverId] = useState(1);

  // Car Animation State
  const [carAnimationProgress, setCarAnimationProgress] = useState(0);

  // FIXED: State Sync - Watch rides array and update rideStatus
  useEffect(() => {
    if (currentRide) {
      const updatedRide = rides.find(r => r.id === currentRide.id);
      if (updatedRide) {
        // Sync status changes from global rides array to local rideStatus
        if (updatedRide.status === 'accepted' && rideStatus !== 'accepted') {
          setRideStatus('accepted');
          setAssignedDriver(drivers.find(d => d.id === updatedRide.driverId));
        } else if (updatedRide.status === 'inProgress' && rideStatus !== 'inProgress') {
          setRideStatus('inProgress');
        } else if (updatedRide.status === 'completed' && rideStatus !== 'completed') {
          setRideStatus('completed');
        }
      }
    }
  }, [rides, currentRide, rideStatus, drivers]);

  // Car animation when ride is in progress
  useEffect(() => {
    if (rideStatus === 'inProgress') {
      const interval = setInterval(() => {
        setCarAnimationProgress(prev => {
          if (prev >= 100) return 100;
          return prev + 0.5;
        });
      }, 50);
      return () => clearInterval(interval);
    } else {
      setCarAnimationProgress(0);
    }
  }, [rideStatus]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setPickupCoords([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          
          // Reverse geocode to get address
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(data => {
              setPickup(data.display_name);
            })
            .catch(err => console.error('Reverse geocoding error:', err));
        },
        (error) => {
          alert('Unable to get your location. Please enable location services.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  // Search for address using Nominatim
  const searchAddress = async (query, isPickup) => {
    if (query.length < 3) {
      if (isPickup) setPickupSuggestions([]);
      else setDropoffSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      
      if (isPickup) {
        setPickupSuggestions(data);
        setShowPickupSuggestions(true);
      } else {
        setDropoffSuggestions(data);
        setShowDropoffSuggestions(true);
      }
    } catch (error) {
      console.error('Address search error:', error);
    }
  };

  // Handle pickup address selection
  const selectPickupAddress = (suggestion) => {
    setPickup(suggestion.display_name);
    setPickupCoords([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
    setMapCenter([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
    setShowPickupSuggestions(false);
    
    // Calculate distance if both points are set
    if (dropoffCoords) {
      const dist = calculateDistance(
        parseFloat(suggestion.lat),
        parseFloat(suggestion.lon),
        dropoffCoords[0],
        dropoffCoords[1]
      );
      setDistance(dist.toFixed(2));
    }
  };

  // Handle dropoff address selection
  const selectDropoffAddress = (suggestion) => {
    setDropoff(suggestion.display_name);
    setDropoffCoords([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
    setShowDropoffSuggestions(false);
    
    // Calculate distance if both points are set
    if (pickupCoords) {
      const dist = calculateDistance(
        pickupCoords[0],
        pickupCoords[1],
        parseFloat(suggestion.lat),
        parseFloat(suggestion.lon)
      );
      setDistance(dist.toFixed(2));
    }
  };

  // Calculate Fare
  const calculateFare = () => {
    if (!distance || distance <= 0) {
      alert('Please enter a valid distance');
      return;
    }
    const baseFare = 30;
    const perKm = 12;
    const serviceTax = 0.05;
    const subtotal = baseFare + (parseFloat(distance) * perKm);
    const total = subtotal * (1 + serviceTax);
    setFareEstimate({
      baseFare,
      perKm,
      distance: parseFloat(distance),
      subtotal: subtotal.toFixed(2),
      tax: (subtotal * serviceTax).toFixed(2),
      total: total.toFixed(2),
      driverCut: (total * 0.8).toFixed(2)
    });
  };

  // Request Ride
  const requestRide = () => {
    if (!fareEstimate) {
      alert('Please calculate fare first');
      return;
    }
    if (!pickupCoords || !dropoffCoords) {
      alert('Please select both pickup and dropoff locations on the map');
      return;
    }
    
    setRideStatus('searching');
    
    setTimeout(() => {
      const availableDriver = drivers.find(d => d.isOnline && !d.currentRide);
      if (availableDriver) {
        const newRide = {
          id: Date.now(),
          riderId: riders[0].id,
          riderName: riders[0].name,
          driverId: availableDriver.id,
          driverName: availableDriver.name,
          driverVehicle: availableDriver.vehicle,
          driverPlate: availableDriver.plate,
          pickup,
          dropoff,
          pickupCoords,
          dropoffCoords,
          distance: fareEstimate.distance,
          fare: parseFloat(fareEstimate.total),
          driverEarnings: parseFloat(fareEstimate.driverCut),
          status: 'pending',
          timestamp: new Date().toLocaleTimeString(),
          rating: null
        };
        setCurrentRide(newRide);
        setRides(prev => [...prev, newRide]);
      } else {
        alert('No drivers available. Please try again.');
        setRideStatus('idle');
      }
    }, 2000);
  };

  // FIXED: Removed currentRole checks - state syncs via useEffect
  const acceptRide = (rideId) => {
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      setRides(prev => prev.map(r => 
        r.id === rideId ? { ...r, status: 'accepted' } : r
      ));
      setDrivers(prev => prev.map(d => 
        d.id === selectedDriverId ? { ...d, currentRide: rideId } : d
      ));
    }
  };

  const startRide = (rideId) => {
    setRides(prev => prev.map(r => 
      r.id === rideId ? { ...r, status: 'inProgress' } : r
    ));
  };

  const completeRide = (rideId) => {
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      setRides(prev => prev.map(r => 
        r.id === rideId ? { ...r, status: 'completed' } : r
      ));
      
      setDrivers(prev => prev.map(d => 
        d.id === ride.driverId ? { 
          ...d, 
          earnings: d.earnings + ride.driverEarnings,
          currentRide: null 
        } : d
      ));
    }
  };

  // Submit rating
  const submitRating = () => {
    if (currentRide && userRating > 0) {
      setRides(prev => prev.map(r => 
        r.id === currentRide.id ? { ...r, rating: userRating } : r
      ));
      
      const driver = drivers.find(d => d.id === currentRide.driverId);
      if (driver) {
        const completedRides = rides.filter(r => r.driverId === driver.id && r.rating).length + 1;
        const newRating = ((driver.rating * (completedRides - 1)) + userRating) / completedRides;
        setDrivers(prev => prev.map(d => 
          d.id === driver.id ? { ...d, rating: parseFloat(newRating.toFixed(1)) } : d
        ));
      }
      
      setRideStatus('idle');
      setCurrentRide(null);
      setFareEstimate(null);
      setPickup('');
      setDropoff('');
      setDistance('');
      setPickupCoords(null);
      setDropoffCoords(null);
      setUserRating(0);
    }
  };

  const toggleDriverStatus = () => {
    setDrivers(prev => prev.map(d => 
      d.id === selectedDriverId ? { ...d, isOnline: !d.isOnline } : d
    ));
  };

  const currentDriver = drivers.find(d => d.id === selectedDriverId);
  const pendingRides = rides.filter(r => r.status === 'pending' && r.driverId === selectedDriverId);
  const activeRide = rides.find(r => r.status === 'accepted' || r.status === 'inProgress');
  const completedRides = rides.filter(r => r.status === 'completed');
  const totalRevenue = completedRides.reduce((sum, r) => sum + r.fare, 0);
  const activeDrivers = drivers.filter(d => d.isOnline).length;

  // Calculate car position for animation
  const getCarPosition = () => {
    if (!pickupCoords || !dropoffCoords) return null;
    const progress = carAnimationProgress / 100;
    const lat = pickupCoords[0] + (dropoffCoords[0] - pickupCoords[0]) * progress;
    const lng = pickupCoords[1] + (dropoffCoords[1] - pickupCoords[1]) * progress;
    return [lat, lng];
  };

  const carPosition = getCarPosition();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }
        
        .animate-slide-up {
          animation: slideUp 0.4s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-pulse-green {
          animation: pulseGreen 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulseGreen {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .leaflet-container {
          height: 100%;
          border-radius: 1.5rem;
          z-index: 0;
        }

        .suggestion-item {
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .suggestion-item:hover {
          background-color: #f5f5f5;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#CDDC39] rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">RideShare</h1>
                <p className="text-xs text-gray-500">by B.LALIT KISHORE</p>
              </div>
            </div>
            
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setCurrentRole('rider')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  currentRole === 'rider' 
                    ? 'bg-[#CDDC39] text-black shadow-md' 
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Rider
              </button>
              <button
                onClick={() => setCurrentRole('driver')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  currentRole === 'driver' 
                    ? 'bg-[#CDDC39] text-black shadow-md' 
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Driver
              </button>
              <button
                onClick={() => setCurrentRole('admin')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  currentRole === 'admin' 
                    ? 'bg-[#CDDC39] text-black shadow-md' 
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* RIDER VIEW */}
        {currentRole === 'rider' && (
          <div className="animate-slide-up">
            {/* Real Map Section */}
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-6">
              <div className="h-96 relative">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap center={mapCenter} />
                  
                  {/* Pickup Marker */}
                  {pickupCoords && (
                    <Marker position={pickupCoords} icon={pickupIcon}>
                      <Popup>
                        <strong>Pickup</strong><br />
                        {pickup}
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Dropoff Marker */}
                  {dropoffCoords && (
                    <Marker position={dropoffCoords} icon={dropoffIcon}>
                      <Popup>
                        <strong>Drop-off</strong><br />
                        {dropoff}
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Route Line */}
                  {pickupCoords && dropoffCoords && (
                    <Polyline
                      positions={[pickupCoords, dropoffCoords]}
                      color="#CDDC39"
                      weight={4}
                      opacity={0.8}
                      dashArray="10, 10"
                    />
                  )}
                  
                  {/* Animated Car */}
                  {rideStatus === 'inProgress' && carPosition && (
                    <Marker
                      position={carPosition}
                      icon={new L.DivIcon({
                        className: 'car-marker',
                        html: `<div style="width: 40px; height: 40px; background: black; border-radius: 8px; display: flex; align-items: center; justify-content: center; transform: rotate(45deg); box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style="transform: rotate(-45deg);">
                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                          </svg>
                        </div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                      })}
                    />
                  )}
                </MapContainer>
                
                {/* Searching Overlay */}
                {rideStatus === 'searching' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1000] rounded-3xl">
                    <div className="bg-white rounded-2xl p-8 text-center">
                      <div className="w-16 h-16 border-4 border-[#CDDC39] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-xl font-bold">Finding your driver...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Form */}
            {rideStatus === 'idle' && (
              <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-6">Book a Ride</h2>
                
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#CDDC39] z-10" />
                      <input
                        type="text"
                        value={pickup}
                        onChange={(e) => {
                          setPickup(e.target.value);
                          searchAddress(e.target.value, true);
                        }}
                        onFocus={() => setShowPickupSuggestions(true)}
                        placeholder="Search pickup location"
                        className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#CDDC39] focus:outline-none transition-colors"
                      />
                      <button
                        onClick={getCurrentLocation}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Use current location"
                      >
                        <Locate className="w-5 h-5 text-[#CDDC39]" />
                      </button>
                    </div>
                    
                    {/* Pickup Suggestions */}
                    {showPickupSuggestions && pickupSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                        {pickupSuggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            onClick={() => selectPickupAddress(suggestion)}
                            className="suggestion-item p-3 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                              <span className="text-sm">{suggestion.display_name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Drop-off Location</label>
                    <div className="relative">
                      <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black z-10" />
                      <input
                        type="text"
                        value={dropoff}
                        onChange={(e) => {
                          setDropoff(e.target.value);
                          searchAddress(e.target.value, false);
                        }}
                        onFocus={() => setShowDropoffSuggestions(true)}
                        placeholder="Search drop-off location"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#CDDC39] focus:outline-none transition-colors"
                      />
                    </div>
                    
                    {/* Dropoff Suggestions */}
                    {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                        {dropoffSuggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            onClick={() => selectDropoffAddress(suggestion)}
                            className="suggestion-item p-3 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-start gap-2">
                              <Navigation className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                              <span className="text-sm">{suggestion.display_name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Distance (km) {distance && <span className="text-[#CDDC39]">• Auto-calculated</span>}
                    </label>
                    <input
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      placeholder="Distance will be auto-calculated"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#CDDC39] focus:outline-none transition-colors"
                      readOnly={pickupCoords && dropoffCoords}
                    />
                  </div>
                  
                  <button
                    onClick={calculateFare}
                    className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors"
                  >
                    Calculate Fare
                  </button>
                </div>

                {/* Fare Estimate */}
                {fareEstimate && (
                  <div className="mt-6 bg-gradient-to-br from-[#CDDC39] to-[#b8c534] rounded-2xl p-6 text-black">
                    <h3 className="text-lg font-bold mb-4">Fare Estimate</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Base Fare</span>
                        <span className="font-semibold">₹{fareEstimate.baseFare}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Distance ({fareEstimate.distance} km @ ₹{fareEstimate.perKm}/km)</span>
                        <span className="font-semibold">₹{(fareEstimate.distance * fareEstimate.perKm).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Tax (5%)</span>
                        <span className="font-semibold">₹{fareEstimate.tax}</span>
                      </div>
                      <div className="border-t-2 border-black/20 pt-2 mt-2">
                        <div className="flex justify-between text-2xl font-bold">
                          <span>Total</span>
                          <span>₹{fareEstimate.total}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={requestRide}
                      className="w-full mt-6 py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-900 transition-colors"
                    >
                      Request Ride
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Ride Accepted */}
            {rideStatus === 'accepted' && assignedDriver && (
              <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 animate-slide-up">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-[#CDDC39] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold">Driver Found!</h2>
                  <p className="text-gray-600">Your driver is on the way</p>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{assignedDriver.name}</h3>
                      <div className="flex items-center gap-1 text-[#CDDC39]">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-semibold">{assignedDriver.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle</span>
                      <span className="font-semibold">{assignedDriver.vehicle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plate Number</span>
                      <span className="font-semibold">{assignedDriver.plate}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ride In Progress */}
            {rideStatus === 'inProgress' && (
              <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 animate-slide-up">
                <div className="text-center">
                  <div className="w-20 h-20 bg-[#CDDC39] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Car className="w-10 h-10 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Ride in Progress</h2>
                  <p className="text-gray-600">Enjoy your ride!</p>
                  <div className="mt-4 bg-gray-50 rounded-2xl p-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#CDDC39] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${carAnimationProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{carAnimationProgress.toFixed(0)}% Complete</p>
                  </div>
                </div>
              </div>
            )}

            {/* Trip Receipt - FIXED: Now appears properly */}
            {rideStatus === 'completed' && currentRide && (
              <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 animate-slide-up">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-[#CDDC39] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold">Trip Completed!</h2>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <h3 className="font-bold mb-4">Trip Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">From</span>
                      <span className="font-semibold text-right max-w-xs truncate">{currentRide.pickup}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To</span>
                      <span className="font-semibold text-right max-w-xs truncate">{currentRide.dropoff}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance</span>
                      <span className="font-semibold">{currentRide.distance} km</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-200">
                      <span>Total Fare</span>
                      <span>₹{currentRide.fare.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-bold mb-3">Rate your driver</h3>
                  <div className="flex gap-3 justify-center">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setUserRating(rating)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-10 h-10 ${
                            rating <= userRating 
                              ? 'fill-[#CDDC39] text-[#CDDC39]' 
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={submitRating}
                  disabled={userRating === 0}
                  className="w-full py-4 bg-[#CDDC39] text-black font-bold rounded-2xl hover:bg-[#b8c534] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Rating & Book Another Ride
                </button>
              </div>
            )}
          </div>
        )}

        {/* DRIVER VIEW - Same as before with fixes */}
        {currentRole === 'driver' && (
          <div className="animate-slide-up">
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{currentDriver.name}</h2>
                    <div className="flex items-center gap-1 text-[#CDDC39]">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{currentDriver.rating}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{currentDriver.isOnline ? 'Online' : 'Offline'}</span>
                  <button
                    onClick={toggleDriverStatus}
                    className={`relative w-16 h-8 rounded-full transition-colors ${
                      currentDriver.isOnline ? 'bg-[#CDDC39]' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-transform ${
                      currentDriver.isOnline ? 'translate-x-9' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm font-semibold">Total Earnings</span>
                  </div>
                  <p className="text-3xl font-bold">₹{currentDriver.earnings.toFixed(2)}</p>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Activity className="w-5 h-5" />
                    <span className="text-sm font-semibold">Completed Rides</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {completedRides.filter(r => r.driverId === currentDriver.id).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
              <h3 className="font-bold mb-4">Vehicle Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Model</span>
                  <span className="font-semibold">{currentDriver.vehicle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plate Number</span>
                  <span className="font-semibold">{currentDriver.plate}</span>
                </div>
              </div>
            </div>

            {currentDriver.isOnline && pendingRides.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 animate-slide-up">
                <h3 className="font-bold text-xl mb-4">Incoming Ride Request</h3>
                {pendingRides.map(ride => (
                  <div key={ride.id} className="bg-[#CDDC39] rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{ride.riderName}</h4>
                        <p className="text-sm text-black/70">{ride.timestamp}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        <span className="font-semibold text-sm">{ride.pickup}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="w-5 h-5" />
                        <span className="font-semibold text-sm">{ride.dropoff}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="font-semibold">Your earnings: ₹{ride.driverEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => acceptRide(ride.id)}
                        className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentDriver.currentRide && (() => {
              const ride = rides.find(r => r.id === currentDriver.currentRide);
              return ride && (
                <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
                  <h3 className="font-bold text-xl mb-4">
                    {ride.status === 'accepted' ? 'Navigate to Pickup' : 'Ride in Progress'}
                  </h3>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#CDDC39]" />
                        <span className="font-semibold text-sm">{ride.pickup}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="w-5 h-5" />
                        <span className="font-semibold text-sm">{ride.dropoff}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="font-semibold">You'll earn: ₹{ride.driverEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {ride.status === 'accepted' && (
                    <button
                      onClick={() => startRide(ride.id)}
                      className="w-full py-4 bg-[#CDDC39] text-black font-bold rounded-2xl hover:bg-[#b8c534] transition-colors"
                    >
                      Start Ride
                    </button>
                  )}
                  
                  {ride.status === 'inProgress' && (
                    <button
                      onClick={() => completeRide(ride.id)}
                      className="w-full py-4 bg-[#CDDC39] text-black font-bold rounded-2xl hover:bg-[#b8c534] transition-colors"
                    >
                      End Trip
                    </button>
                  )}
                </div>
              );
            })()}

            {currentDriver.isOnline && pendingRides.length === 0 && !currentDriver.currentRide && (
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">Waiting for ride requests...</h3>
                <p className="text-gray-500">You'll be notified when a passenger requests a ride</p>
              </div>
            )}

            {!currentDriver.isOnline && (
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">You're offline</h3>
                <p className="text-gray-500">Go online to start receiving ride requests</p>
              </div>
            )}
          </div>
        )}

        {/* ADMIN VIEW - Same as before */}
        {currentRole === 'admin' && (
          <div className="animate-slide-up">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#CDDC39] rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <span className="font-semibold text-gray-600">Total Users</span>
                </div>
                <p className="text-4xl font-bold">{riders.length + drivers.length}</p>
                <p className="text-sm text-gray-500 mt-2">{riders.length} riders, {drivers.length} drivers</p>
              </div>
              
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-gray-600">Total Revenue</span>
                </div>
                <p className="text-4xl font-bold">₹{totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-2">{completedRides.length} completed rides</p>
              </div>
              
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#CDDC39] rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-black" />
                  </div>
                  <span className="font-semibold text-gray-600">Active Drivers</span>
                </div>
                <p className="text-4xl font-bold">{activeDrivers}</p>
                <p className="text-sm text-gray-500 mt-2">Online now</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
              <h3 className="font-bold text-xl mb-4">Live Rides</h3>
              {rides.filter(r => r.status !== 'completed').length > 0 ? (
                <div className="space-y-3">
                  {rides.filter(r => r.status !== 'completed').map(ride => (
                    <div key={ride.id} className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            ride.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            ride.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ride.status.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">{ride.timestamp}</span>
                        </div>
                        <p className="font-semibold">{ride.riderName} → {ride.driverName}</p>
                        <p className="text-sm text-gray-600 truncate">{ride.pickup} → {ride.dropoff}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl">₹{ride.fare.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{ride.distance} km</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-2" />
                  <p>No active rides</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h3 className="font-bold text-xl mb-4">Completed Rides</h3>
              {completedRides.length > 0 ? (
                <div className="space-y-3">
                  {completedRides.map(ride => (
                    <div key={ride.id} className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            COMPLETED
                          </span>
                          <span className="text-sm text-gray-500">{ride.timestamp}</span>
                        </div>
                        {ride.rating && (
                          <div className="flex items-center gap-1 text-[#CDDC39]">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-semibold">{ride.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Rider</p>
                          <p className="font-semibold">{ride.riderName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Driver</p>
                          <p className="font-semibold">{ride.driverName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Route</p>
                          <p className="font-semibold text-sm truncate">{ride.pickup} → {ride.dropoff}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Fare</p>
                          <p className="font-semibold">₹{ride.fare.toFixed(2)} ({ride.distance} km)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Check className="w-12 h-12 mx-auto mb-2" />
                  <p>No completed rides yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-black text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-semibold">Developed by <span className="text-[#CDDC39]">B.LALIT KISHORE</span></p>
          <p className="text-gray-400 text-sm mt-2">21CSC101T • C++ Object-Oriented Design & Programming</p>
        </div>
      </footer>
    </div>
  );
};

export default RideSharingApp;
