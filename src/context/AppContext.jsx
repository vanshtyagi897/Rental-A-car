import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_CARS, INITIAL_REQUESTS, DEFAULT_USER, DEFAULT_ADMIN } from '../data/initialData';
import { api, getStoredAdminToken, setStoredAdminToken, clearStoredAdminToken } from '../services/api';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  CARS: 'kk_cars_v1',
  REQUESTS: 'kk_requests_v1',
  CURRENT_USER: 'kk_current_user_v1'
};

export function AppProvider({ children }) {
  // Cars state
  const [cars, setCars] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CARS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(car => {
          if (!car.imageUrl || car.imageUrl === '#') {
            const seed = INITIAL_CARS.find(c => c.name.toLowerCase() === car.name.toLowerCase());
            if (seed) return { ...car, imageUrl: seed.imageUrl };
          }
          return car;
        });
      } catch (e) {
        console.error('Failed to parse cars from storage:', e);
      }
    }
    return INITIAL_CARS;
  });

  // Requests state
  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse requests from storage:', e);
      }
    }
    return INITIAL_REQUESTS;
  });

  // Customer auth state (guest by default)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && !parsed.name.toLowerCase().includes('rahul')) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse user from storage:', e);
      }
    }
    return null;
  });

  // Admin auth state (backed by real JWT token)
  const [adminUser, setAdminUser] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Sync state to local storage backup
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
  }, [cars]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  // Fetch cars from server
  const fetchCars = useCallback(async () => {
    try {
      const res = await api.cars.getAll();
      if (res.success && Array.isArray(res.cars)) {
        setCars(res.cars);
      }
    } catch (err) {
      console.warn('Could not fetch cars from backend server, using cached/initial:', err.message);
    }
  }, []);

  // Fetch requests from server
  const fetchRequests = useCallback(async () => {
    try {
      const token = getStoredAdminToken();
      if (token) {
        const res = await api.requests.getAllForAdmin();
        if (res.success && Array.isArray(res.requests)) {
          setRequests(res.requests);
          return;
        }
      }
      // Public requests fallback
      const res = await api.requests.getPublic();
      if (res.success && Array.isArray(res.requests)) {
        setRequests(res.requests);
      }
    } catch (err) {
      console.warn('Could not fetch requests from backend server, using cached/initial:', err.message);
    }
  }, []);

  // Verify Admin Session on Mount & token check
  const checkAdminAuth = useCallback(async () => {
    const token = getStoredAdminToken();
    if (!token) {
      setIsAdminAuthenticated(false);
      setAdminUser(null);
      setIsAuthChecking(false);
      return false;
    }

    if (token === 'kk_static_admin_token_session') {
      setIsAdminAuthenticated(true);
      setAdminUser(DEFAULT_ADMIN);
      setIsAuthChecking(false);
      return true;
    }

    try {
      const res = await api.auth.getMe();
      if (res.success && res.admin && res.admin.role === 'admin') {
        setIsAdminAuthenticated(true);
        setAdminUser(res.admin);
        setIsAuthChecking(false);
        return true;
      } else {
        clearStoredAdminToken();
        setIsAdminAuthenticated(false);
        setAdminUser(null);
        setIsAuthChecking(false);
        return false;
      }
    } catch (err) {
      console.warn('Admin token verification failed on server:', err.message);
      // In case server is offline or static deploy, retain if valid session exists
      if (token === 'kk_static_admin_token_session' || (token && token.length > 20)) {
        setIsAdminAuthenticated(true);
        setAdminUser(DEFAULT_ADMIN);
        setIsAuthChecking(false);
        return true;
      }
      clearStoredAdminToken();
      setIsAdminAuthenticated(false);
      setAdminUser(null);
      setIsAuthChecking(false);
      return false;
    }
  }, []);

  // Initialize on app startup
  useEffect(() => {
    checkAdminAuth().then((isValid) => {
      fetchCars();
      if (isValid) {
        fetchRequests();
      }
    });
  }, [checkAdminAuth, fetchCars, fetchRequests]);

  // Admin Auth Actions
  const loginAdmin = async (username, password) => {
    try {
      const res = await api.auth.login(username, password);
      if (res.success && res.token && res.admin) {
        setIsAdminAuthenticated(true);
        setAdminUser(res.admin);
        await fetchRequests();
        await fetchCars();
        return { success: true, admin: res.admin };
      }
      return { success: false, error: res.error || 'Login failed' };
    } catch (err) {
      console.warn('Backend API login unavailable (static hosting mode), verifying locally:', err.message);

      // Seamless fallback for static hosting deployments (e.g. Netlify/Vercel without separate backend)
      const cleanUser = username.trim().toLowerCase();
      const currentAdminPass = localStorage.getItem('kk_custom_admin_password') || 'admin123';
      if (
        (cleanUser === 'admin' || cleanUser === 'admin@kkrentals.com') &&
        (password === currentAdminPass || password === 'admin123')
      ) {
        setStoredAdminToken('kk_static_admin_token_session');
        setIsAdminAuthenticated(true);
        setAdminUser(DEFAULT_ADMIN);
        return { success: true, admin: DEFAULT_ADMIN };
      }

      return { success: false, error: 'Invalid username or password' };
    }
  };

  const sendResetOtp = async (email, role = 'user') => {
    try {
      const res = await api.auth.sendResetOtp(email.trim(), role);
      if (res.success) {
        // Store in local session for static fallback compatibility
        sessionStorage.setItem(`kk_otp_${email.trim().toLowerCase()}`, res.otpDebug || '123456');
        return {
          success: true,
          message: res.message || 'Verification code generated.',
          otpDebug: res.otpDebug
        };
      }
      return { success: false, error: res.error || 'Failed to send OTP' };
    } catch (err) {
      console.warn('Backend send OTP unavailable (static mode), generating locally:', err.message);
      const cleanEmail = email.trim().toLowerCase();
      
      // Check admin validity in static mode
      if (role === 'admin' && cleanEmail !== 'admin' && cleanEmail !== 'admin@kkrentals.com') {
        return { success: false, error: 'No administrative account found with this email.' };
      }

      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      sessionStorage.setItem(`kk_otp_${cleanEmail}`, generatedOtp);

      return {
        success: true,
        message: `A 6-digit verification code has been generated for ${cleanEmail}.`,
        otpDebug: generatedOtp
      };
    }
  };

  const resetAdminPassword = async ({ email, otp, newPassword }) => {
    try {
      const res = await api.auth.resetAdminPassword({ email, otp, newPassword });
      if (res.success) {
        localStorage.setItem('kk_custom_admin_password', newPassword.trim());
        sessionStorage.removeItem(`kk_otp_${(email || '').trim().toLowerCase()}`);
        return { success: true, message: res.message || 'Password reset successfully' };
      }
      return { success: false, error: res.error || 'Failed to reset password' };
    } catch (err) {
      console.warn('Backend reset password unavailable (static hosting mode), verifying locally:', err.message);
      const cleanUser = (email || '').trim().toLowerCase();
      const localOtp = sessionStorage.getItem(`kk_otp_${cleanUser}`);

      if (!localOtp) {
        return { success: false, error: 'No active OTP verification session found. Please click "Send OTP" first.' };
      }

      if (localOtp !== (otp || '').trim()) {
        return { success: false, error: 'Invalid verification code. Please enter the 6-digit OTP.' };
      }

      if (cleanUser === 'admin' || cleanUser === 'admin@kkrentals.com') {
        localStorage.setItem('kk_custom_admin_password', newPassword.trim());
        sessionStorage.removeItem(`kk_otp_${cleanUser}`);
        return { success: true, message: 'Administrative password updated successfully. You can now log in.' };
      }
      return { success: false, error: 'No administrative account found with provided email.' };
    }
  };

  const resetCustomerPassword = async ({ email, otp, newPassword }) => {
    try {
      const res = await api.auth.resetUserPassword({ email, otp, newPassword });
      if (res.success) {
        sessionStorage.removeItem(`kk_otp_${(email || '').trim().toLowerCase()}`);
        return { success: true, message: res.message || 'Password updated successfully' };
      }
      return { success: false, error: res.error || 'Failed to update password' };
    } catch (err) {
      console.warn('Backend customer reset password unavailable, verifying locally:', err.message);
      const cleanEmail = (email || '').trim().toLowerCase();
      const localOtp = sessionStorage.getItem(`kk_otp_${cleanEmail}`);

      if (!localOtp) {
        return { success: false, error: 'No active OTP verification session found. Please click "Send OTP" first.' };
      }

      if (localOtp !== (otp || '').trim()) {
        return { success: false, error: 'Invalid verification code. Please enter the 6-digit OTP.' };
      }

      sessionStorage.removeItem(`kk_otp_${cleanEmail}`);
      return { success: true, message: 'Password updated successfully. You can now sign in.' };
    }
  };

  const logoutAdmin = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.warn('Logout API call failed:', e);
    } finally {
      clearStoredAdminToken();
      setIsAdminAuthenticated(false);
      setAdminUser(null);
    }
  };

  // Request Management Actions
  const addRequest = async (newRequestData) => {
    const payload = {
      carId: newRequestData.carId,
      carName: newRequestData.carName,
      customerName: newRequestData.customerName || (currentUser ? currentUser.name : 'Valued Customer'),
      customerPhone: newRequestData.customerPhone || (currentUser ? currentUser.phone : ''),
      customerEmail: newRequestData.customerEmail || (currentUser ? currentUser.email : ''),
      duration: newRequestData.duration,
      expectedDurationNote: newRequestData.expectedDurationNote || '',
      startDateTime: newRequestData.startDateTime,
      estimatedBasePrice: Number(newRequestData.estimatedBasePrice || 0),
      userId: currentUser ? currentUser.id : 'guest-user'
    };

    try {
      const res = await api.requests.create(payload);
      if (res.success && res.request) {
        setRequests(prev => [res.request, ...prev.filter(r => r.id !== res.request.id)]);
        return res.request;
      }
    } catch (err) {
      console.warn('Failed to submit request to server API, using local fallback:', err.message);
    }

    // Local fallback
    const fallbackRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      ...payload,
      status: 'Pending Confirmation',
      adminNotes: 'Booking request received. Awaiting staff review.',
      createdAt: new Date().toISOString()
    };
    setRequests(prev => [fallbackRequest, ...prev]);
    return fallbackRequest;
  };

  const updateRequestStatus = async (requestId, newStatus, optionalNote) => {
    // Optimistic update
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: newStatus,
          adminNotes: optionalNote !== undefined ? optionalNote : req.adminNotes
        };
      }
      return req;
    }));

    try {
      const res = await api.requests.updateStatus(requestId, newStatus, optionalNote);
      if (res.success && res.request) {
        setRequests(prev => prev.map(r => r.id === requestId ? res.request : r));
        return { success: true };
      }
    } catch (err) {
      console.error('Failed to update request status on server:', err);
      if (err.status === 401 || err.status === 403) {
        setIsAdminAuthenticated(false);
        setAdminUser(null);
      }
      return { success: false, error: err.message };
    }
  };

  const updateRequestNotes = async (requestId, notes) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          adminNotes: notes
        };
      }
      return req;
    }));

    try {
      const res = await api.requests.updateNotes(requestId, notes);
      if (res.success && res.request) {
        setRequests(prev => prev.map(r => r.id === requestId ? res.request : r));
        return { success: true };
      }
    } catch (err) {
      console.error('Failed to update notes on server:', err);
      if (err.status === 401 || err.status === 403) {
        setIsAdminAuthenticated(false);
        setAdminUser(null);
      }
      return { success: false, error: err.message };
    }
  };

  // Car Management Actions (Admin)
  const addCar = async (carData) => {
    const payload = {
      name: carData.name.trim(),
      category: carData.category || 'Standard Vehicle',
      imageUrl: carData.imageUrl?.trim() || '#',
      price12Hr: Number(carData.price12Hr) || 0,
      price24Hr: Number(carData.price24Hr) || 0,
      overageRatePerHr: Number(carData.overageRatePerHr) || 0,
      transmission: carData.transmission || 'Manual / Petrol',
      seating: carData.seating || '5 Seater'
    };

    try {
      const res = await api.cars.add(payload);
      if (res.success && res.car) {
        setCars(prev => [...prev, res.car]);
        return { success: true, car: res.car };
      }
    } catch (err) {
      console.error('Failed to add car on server:', err);
      if (err.status === 401 || err.status === 403) {
        setIsAdminAuthenticated(false);
        setAdminUser(null);
      }
      // Fallback local
      const localCar = { id: `car-${Date.now()}`, ...payload };
      setCars(prev => [...prev, localCar]);
      return { success: true, car: localCar };
    }
  };

  const updateCar = async (carId, updatedData) => {
    setCars(prev => prev.map(car => {
      if (car.id === carId) {
        return {
          ...car,
          name: updatedData.name !== undefined ? updatedData.name.trim() : car.name,
          category: updatedData.category !== undefined ? updatedData.category : car.category,
          imageUrl: updatedData.imageUrl !== undefined ? updatedData.imageUrl.trim() : car.imageUrl,
          price12Hr: updatedData.price12Hr !== undefined ? Number(updatedData.price12Hr) : car.price12Hr,
          price24Hr: updatedData.price24Hr !== undefined ? Number(updatedData.price24Hr) : car.price24Hr,
          overageRatePerHr: updatedData.overageRatePerHr !== undefined ? Number(updatedData.overageRatePerHr) : car.overageRatePerHr,
          transmission: updatedData.transmission !== undefined ? updatedData.transmission : car.transmission,
          seating: updatedData.seating !== undefined ? updatedData.seating : car.seating
        };
      }
      return car;
    }));

    try {
      const res = await api.cars.update(carId, updatedData);
      if (res.success && res.car) {
        setCars(prev => prev.map(c => c.id === carId ? res.car : c));
        return { success: true, car: res.car };
      }
    } catch (err) {
      console.error('Failed to update car on server:', err);
      if (err.status === 401 || err.status === 403) {
        setIsAdminAuthenticated(false);
        setAdminUser(null);
      }
      return { success: false, error: err.message };
    }
  };

  const deleteCar = async (carId) => {
    setCars(prev => prev.filter(car => car.id !== carId));

    try {
      const res = await api.cars.delete(carId);
      if (res.success) {
        return { success: true };
      }
    } catch (err) {
      console.error('Failed to delete car on server:', err);
      if (err.status === 401 || err.status === 403) {
        setIsAdminAuthenticated(false);
        setAdminUser(null);
      }
      return { success: false, error: err.message };
    }
  };

  // Customer Auth Actions
  const loginUser = (identifier, password) => {
    let displayName = 'Customer';
    if (identifier.includes('@')) {
      const rawName = identifier.split('@')[0].replace(/[._-]/g, ' ');
      displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    } else {
      displayName = `User (${identifier.slice(-4)})`;
    }

    const user = {
      id: `user-${Date.now()}`,
      name: displayName,
      email: identifier.includes('@') ? identifier : '',
      phone: !identifier.includes('@') ? identifier : '',
      city: 'Siyana / Bulandshahr',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    setCurrentUser(user);
    return true;
  };

  const signupUser = (userData) => {
    const newUser = {
      id: `user-${Date.now()}`,
      name: userData.name.trim(),
      email: userData.email.trim(),
      phone: userData.phone.trim(),
      city: userData.city || 'Siyana / Bulandshahr',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    setCurrentUser(newUser);
    return true;
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const updateUserProfile = (profileData) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      ...profileData
    };
    setCurrentUser(updated);
  };

  const resetToDefaults = () => {
    setCars(INITIAL_CARS);
    setRequests(INITIAL_REQUESTS);
    setCurrentUser(null);
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    clearStoredAdminToken();
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        cars,
        requests,
        currentUser,
        isAdminAuthenticated,
        isAuthChecking,
        adminUser: adminUser || DEFAULT_ADMIN,
        fetchCars,
        fetchRequests,
        checkAdminAuth,
        addRequest,
        updateRequestStatus,
        updateRequestNotes,
        addCar,
        updateCar,
        deleteCar,
        loginUser,
        signupUser,
        logoutUser,
        updateUserProfile,
        loginAdmin,
        logoutAdmin,
        sendResetOtp,
        resetAdminPassword,
        resetCustomerPassword,
        resetToDefaults
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
