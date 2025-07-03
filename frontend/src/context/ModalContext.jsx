import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Expose open/close functions for both modals
  const openLogin = useCallback(() => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
  }, []);
  const openRegister = useCallback(() => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
  }, []);
  const closeModals = useCallback(() => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
  }, []);

  return (
    <ModalContext.Provider value={{ showLoginModal, showRegisterModal, openLogin, openRegister, closeModals }}>
      {children}
    </ModalContext.Provider>
  );
};
