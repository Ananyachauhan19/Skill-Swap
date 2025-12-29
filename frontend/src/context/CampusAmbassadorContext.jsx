import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config.js';

const CampusAmbassadorContext = createContext();

export const useCampusAmbassador = () => {
  const context = useContext(CampusAmbassadorContext);
  if (!context) {
    throw new Error('useCampusAmbassador must be used within CampusAmbassadorProvider');
  }
  return context;
};

export const CampusAmbassadorProvider = ({ children }) => {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle API errors, especially password change requirement
  const handleApiError = (err) => {
    if (err.response?.data?.requiresPasswordChange || err.response?.data?.isFirstLogin) {
      navigate('/change-password');
      return;
    }
    const errorMsg = err.response?.data?.message || 'An error occurred';
    setError(errorMsg);
    console.error('API Error:', err);
  };

  // Fetch institutes managed by campus ambassador
  const fetchInstitutes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/campus-ambassador/institutes`, {
        withCredentials: true
      });
      setInstitutes(response.data.institutes);
      setError(null);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new institute
  const createInstitute = async (formData) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/campus-ambassador/institutes`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      await fetchInstitutes();
      setError(null);
      return response.data;
    } catch (err) {
      handleApiError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an institute
  const updateInstitute = async (id, formData) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${BACKEND_URL}/api/campus-ambassador/institutes/${id}`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      await fetchInstitutes();
      setError(null);
      return response.data;
    } catch (err) {
      handleApiError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete an institute
  const deleteInstitute = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${BACKEND_URL}/api/campus-ambassador/institutes/${id}`, {
        withCredentials: true
      });
      await fetchInstitutes();
      setError(null);
    } catch (err) {
      handleApiError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload students via Excel
  const uploadStudents = async (instituteId, file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('excelFile', file);

      const response = await axios.post(
        `${BACKEND_URL}/api/campus-ambassador/institutes/${instituteId}/upload-students`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      await fetchInstitutes();
      setError(null);
      return response.data;
    } catch (err) {
      handleApiError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Validate campus ID
  const validateCampusId = async (studentId) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/campus-ambassador/validate-campus-id`,
        { studentId },
        { withCredentials: true }
      );
      setError(null);
      return response.data;
    } catch (err) {
      handleApiError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get students of an institute
  const getInstituteStudents = async (instituteId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BACKEND_URL}/api/campus-ambassador/institutes/${instituteId}/students`,
        { withCredentials: true }
      );
      setError(null);
      return response.data;
    } catch (err) {
      handleApiError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    institutes,
    selectedInstitute,
    setSelectedInstitute,
    loading,
    error,
    setError,
    fetchInstitutes,
    createInstitute,
    updateInstitute,
    deleteInstitute,
    uploadStudents,
    validateCampusId,
    getInstituteStudents
  };

  return (
    <CampusAmbassadorContext.Provider value={value}>
      {children}
    </CampusAmbassadorContext.Provider>
  );
};
