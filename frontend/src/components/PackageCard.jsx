import React from 'react';
import { FaCoins } from 'react-icons/fa';
import { GiTwoCoins } from 'react-icons/gi';

const PackageCard = ({ package: pkg, onPurchase, isLoading, selectedPackageId }) => {
  const isSelected = selectedPackageId === pkg._id;
  
  const getTypeStyles = () => {
    switch (pkg.type) {
      case 'ONLY_SILVER':
        return {
          gradient: 'bg-gray-300',
          badge: 'bg-gray-100 text-gray-800 border-gray-300',
          label: 'Silver'
        };
      case 'ONLY_BRONZE':
        return {
          gradient: 'bg-gradient-to-r from-amber-600 to-amber-700',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          label: 'Bronze'
        };
      case 'COMBO':
        return {
          gradient: 'bg-gradient-to-r from-purple-500 to-indigo-500',
          badge: 'bg-purple-100 text-purple-800 border-purple-300',
          label: 'Combo'
        };
      default:
        return {
          gradient: 'bg-blue-300',
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          label: 'Package'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-lg border-2 transition-all duration-300 hover:-translate-y-2 ${
        isSelected
          ? 'border-blue-500 shadow-xl ring-4 ring-blue-100'
          : 'border-blue-100'
      }`}
    >
      {/* Top gradient bar */}
      <div className={`p-1 ${typeStyles.gradient}`}></div>

      <div className="p-4 sm:p-6">
        {/* Badge and Popular Tag */}
        <div className="flex justify-between items-start mb-4">
          <span
            className={`text-xs font-semibold px-2 sm:px-3 py-1 rounded-full border ${typeStyles.badge}`}
          >
            {typeStyles.label}
          </span>
          {pkg.type === 'COMBO' && (
            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
              POPULAR
            </span>
          )}
        </div>

        {/* Package Name */}
        <h4 className="font-bold text-lg sm:text-xl text-blue-900 mb-2">
          {pkg.name}
        </h4>

        {/* Coin Counts */}
        <div className="space-y-2 mb-3">
          {pkg.silverCoins > 0 && (
            <div className="flex items-center text-gray-700">
              <FaCoins className="text-gray-400 mr-2" />
              <span className="text-base sm:text-lg font-semibold">
                {pkg.silverCoins} Silver Coins
              </span>
            </div>
          )}
          {pkg.bronzeCoins > 0 && (
            <div className="flex items-center text-amber-700">
              <GiTwoCoins className="text-amber-600 mr-2" />
              <span className="text-base sm:text-lg font-semibold">
                {pkg.bronzeCoins} Bronze Coins
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <p className="text-2xl sm:text-3xl font-bold text-blue-800 mb-2">
          ₹{pkg.priceInINR.toFixed(2)}
        </p>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
          {pkg.description}
        </p>

        {/* Purchase Button */}
        <div className="my-4 sm:my-6">
          <button
            className={`w-full py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 text-sm sm:text-base ${
              isSelected
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 shadow-md'
            }`}
            onClick={() => onPurchase(pkg._id)}
            disabled={isLoading}
          >
            {isLoading && isSelected ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Buy Now - ₹${pkg.priceInINR.toFixed(2)}`
            )}
          </button>
        </div>

        {/* Features List */}
        <ul className="text-left text-xs sm:text-sm text-gray-600 space-y-2 mt-4">
          <li className="flex items-center">
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {pkg.type === 'COMBO'
              ? 'Silver + Bronze coins combo'
              : `${typeStyles.label} coins only`}
          </li>
          <li className="flex items-center">
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Instant coin delivery
          </li>
          <li className="flex items-center">
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {pkg.type === 'COMBO' ? 'Best value for money' : 'No expiration'}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PackageCard;
