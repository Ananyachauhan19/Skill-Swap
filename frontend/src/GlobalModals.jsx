import React from "react";
import { AnimatePresence } from "framer-motion";
import Login from "./auth/Login";
import Register from "./auth/Register";
import { useModal } from "./context/ModalContext";

const GlobalModals = () => {
  const { showLoginModal, showRegisterModal, closeModals } = useModal();
  return (
    <AnimatePresence>
      {showLoginModal && (
        <>
          <div className="fixed inset-0 z-[1000] backdrop-blur-[6px] bg-transparent" onClick={closeModals} />
          <div className="fixed inset-0 flex items-center justify-center z-[1001] p-4">
            <Login onClose={closeModals} isModal={true} />
          </div>
        </>
      )}
      {showRegisterModal && (
        <>
          <div className="fixed inset-0 z-[1000] backdrop-blur-[6px] bg-transparent" onClick={closeModals} />
          <div className="fixed inset-0 flex items-center justify-center z-[1001] p-4">
            <Register onClose={closeModals} isModal={true} />
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalModals;
