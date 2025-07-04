import React, { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Login from "./auth/Login";
import Register from "./auth/Register";
import { useModal } from "./context/ModalContext";

const GlobalModals = () => {
  const { showLoginModal, showRegisterModal, closeModals } = useModal();

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .modal-overlay-fix {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        filter: none !important;
        background-color: rgba(0, 0, 0, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <AnimatePresence>
      {showLoginModal && (
        <>
          <div
            className="modal-overlay-fix fixed inset-0 z-[1000]"
            onClick={closeModals}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[1001] p-4">
            <Login onClose={closeModals} isModal={true} />
          </div>
        </>
      )}
      {showRegisterModal && (
        <>
          <div
            className="modal-overlay-fix fixed inset-0 z-[1000]"
            onClick={closeModals}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[1001] p-4">
            <Register onClose={closeModals} isModal={true} />
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalModals;
