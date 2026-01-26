import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { FiCheckCircle, FiXCircle, FiDownload } from 'react-icons/fi';

const CompletionCertificateVerify = () => {
  const { internEmployeeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCertificate();
  }, [internEmployeeId]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BACKEND_URL}/api/public/completioncertificate/${internEmployeeId}`
      );
      setCertificate(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify certificate');
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiXCircle className="text-red-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              The certificate you're trying to verify could not be found, may have been revoked, or the internship is not completed yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col items-center justify-center p-4">
      {/* Verification Badge */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
          <FiCheckCircle className="text-green-600" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Certificate Verified</h1>
        <p className="text-gray-600 text-sm">This is an authentic completion certificate issued by SkillSwap Hub</p>
      </div>

      {/* Download Button */}
      <div className="mb-4">
        <a
          href={`${BACKEND_URL}/api/public/completioncertificate/${internEmployeeId}/download`}
          download
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg font-medium"
        >
          <FiDownload size={20} />
          Download Certificate
        </a>
      </div>

      {/* Certificate Template */}
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div 
          dangerouslySetInnerHTML={{ __html: certificate.htmlContent }}
          className="certificate-content"
        />
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-center max-w-2xl">
        <p className="text-xs text-gray-500 mb-2">
          Verified on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <p className="text-sm text-gray-600">
          For any queries, contact us at{' '}
          <a href="mailto:support@skillswaphub.in" className="text-blue-600 hover:text-blue-700 font-medium">
            support@skillswaphub.in
          </a>
        </p>
      </div>

      <style>{`
        .certificate-content {
          padding: 0;
          margin: 0;
        }
        .certificate-content * {
          max-width: 100%;
        }
        .certificate-content img {
          display: block;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
};

export default CompletionCertificateVerify;
