import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, DollarSign, Star, User, TrendingUp, Activity, Search, Car, Check, X, Menu, Wallet, Settings, LogOut } from 'lucide-react';

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
  const [rideStatus, setRideStatus] = useState('idle'); // idle, searching, accepted, inProgress, completed
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [userRating, setUserRating] = useState(0);

  // Driver State
  const [selectedDriverId, setSelectedDriverId] = useState(1);

  // Map State
  const [pickupCoords, setPickupCoords] = useState([13.0418, 80.2341]);
  const [dropoffCoords, setDropoffCoords] = useState([13.0827, 80.2707]);

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
    setRideStatus('searching');
    
    // Simulate finding driver
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

  // Driver accepts ride
  const acceptRide = (rideId) => {
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      setRides(prev => prev.map(r => 
        r.id === rideId ? { ...r, status: 'accepted' } : r
      ));
      setDrivers(prev => prev.map(d => 
        d.id === selectedDriverId ? { ...d, currentRide: rideId } : d
      ));
      
      if (currentRole === 'rider' && currentRide?.id === rideId) {
        setRideStatus('accepted');
        setAssignedDriver(drivers.find(d => d.id === selectedDriverId));
      }
    }
  };

  // Start ride
  const startRide = (rideId) => {
    setRides(prev => prev.map(r => 
      r.id === rideId ? { ...r, status: 'inProgress' } : r
    ));
    if (currentRole === 'rider' && currentRide?.id === rideId) {
      setRideStatus('inProgress');
    }
  };

  // Complete ride
  const completeRide = (rideId) => {
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      setRides(prev => prev.map(r => 
        r.id === rideId ? { ...r, status: 'completed' } : r
      ));
      
      // Update driver earnings
      setDrivers(prev => prev.map(d => 
        d.id === ride.driverId ? { 
          ...d, 
          earnings: d.earnings + ride.driverEarnings,
          currentRide: null 
        } : d
      ));
      
      if (currentRole === 'rider' && currentRide?.id === rideId) {
        setRideStatus('completed');
      }
    }
  };

  // Submit rating
  const submitRating = () => {
    if (currentRide && userRating > 0) {
      setRides(prev => prev.map(r => 
        r.id === currentRide.id ? { ...r, rating: userRating } : r
      ));
      
      // Update driver rating
      const driver = drivers.find(d => d.id === currentRide.driverId);
      if (driver) {
        const completedRides = rides.filter(r => r.driverId === driver.id && r.rating).length + 1;
        const newRating = ((driver.rating * (completedRides - 1)) + userRating) / completedRides;
        setDrivers(prev => prev.map(d => 
          d.id === driver.id ? { ...d, rating: parseFloat(newRating.toFixed(1)) } : d
        ));
      }
      
      // Reset for new ride
      setRideStatus('idle');
      setCurrentRide(null);
      setFareEstimate(null);
      setPickup('');
      setDropoff('');
      setDistance('');
      setUserRating(0);
    }
  };

  // Toggle driver online status
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
        
        .map-container {
          background: linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%);
          position: relative;
          overflow: hidden;
        }
        
        .map-grid {
          background-image: 
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
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
                <p className="text-xs text-gray-500">By Aaradhya archie</p>
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
            {/* Map Section */}
            <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-6">
              <div className="map-container map-grid h-80 relative">
                {/* Map content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full h-full">
                    {/* Pickup marker */}
                    <div className="absolute animate-pulse-green" style={{ left: '20%', top: '30%' }}>
                      <div className="w-8 h-8 bg-[#CDDC39] rounded-full flex items-center justify-center shadow-lg">
                        <MapPin className="w-5 h-5 text-black" />
                      </div>
                      {pickup && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap">
                          {pickup}
                        </div>
                      )}
                    </div>
                    
                    {/* Dropoff marker */}
                    <div className="absolute" style={{ right: '20%', top: '60%' }}>
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-lg">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      {dropoff && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap">
                          {dropoff}
                        </div>
                      )}
                    </div>
                    
                    {/* Route line */}
                    {pickup && dropoff && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <line
                          x1="20%"
                          y1="30%"
                          x2="80%"
                          y2="60%"
                          stroke="#CDDC39"
                          strokeWidth="3"
                          strokeDasharray="10,5"
                        />
                      </svg>
                    )}
                    
                    {/* Status overlay */}
                    {rideStatus === 'searching' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl p-8 text-center">
                          <div className="w-16 h-16 border-4 border-[#CDDC39] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-xl font-bold">Finding your driver...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            {rideStatus === 'idle' && (
              <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-6">Book a Ride</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#CDDC39]" />
                      <input
                        type="text"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        placeholder="Enter pickup location"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#CDDC39] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Drop-off Location</label>
                    <div className="relative">
                      <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                      <input
                        type="text"
                        value={dropoff}
                        onChange={(e) => setDropoff(e.target.value)}
                        placeholder="Enter drop-off location"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#CDDC39] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Distance (km)</label>
                    <input
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      placeholder="Enter distance"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#CDDC39] focus:outline-none transition-colors"
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
                </div>
              </div>
            )}

            {/* Trip Receipt */}
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
                      <span className="font-semibold">{currentRide.pickup}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To</span>
                      <span className="font-semibold">{currentRide.dropoff}</span>
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
                  Submit Rating
                </button>
              </div>
            )}
          </div>
        )}

        {/* DRIVER VIEW */}
        {currentRole === 'driver' && (
          <div className="animate-slide-up">
            {/* Driver Header */}
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

            {/* Vehicle Info */}
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

            {/* Incoming Requests */}
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
                        <span className="font-semibold">{ride.pickup}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="w-5 h-5" />
                        <span className="font-semibold">{ride.dropoff}</span>
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

            {/* Active Ride */}
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
                        <span className="font-semibold">{ride.pickup}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="w-5 h-5" />
                        <span className="font-semibold">{ride.dropoff}</span>
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

            {/* No rides message */}
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

        {/* ADMIN VIEW */}
        {currentRole === 'admin' && (
          <div className="animate-slide-up">
            {/* Stats Cards */}
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

            {/* Live Rides */}
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
                        <p className="text-sm text-gray-600">{ride.pickup} → {ride.dropoff}</p>
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

            {/* Completed Rides */}
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
                          <p className="font-semibold">{ride.pickup} → {ride.dropoff}</p>
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

      {/* Footer */}
      <footer className="bg-black text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-semibold">Developed by <span className="text-[#CDDC39]">Aaradhya archie</span></p>
          <p className="text-gray-400 text-sm mt-2">21CSC101T •  Object-Oriented Design & Programming</p>
        </div>
      </footer>
    </div>
  );
};

export default RideSharingApp;
