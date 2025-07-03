import { useEffect } from "react";
import { useModal } from "./context/ModalContext";

const ModalBodyScrollLock = () => {
  const { showLoginModal, showRegisterModal } = useModal();
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    let originalHtmlOverflow = html.style.overflow;
    let originalBodyOverflow = body.style.overflow;
    let originalHtmlPaddingRight = html.style.paddingRight;
    let originalBodyPaddingRight = body.style.paddingRight;

    if (showLoginModal || showRegisterModal) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        html.style.paddingRight = `${scrollbarWidth}px`;
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
    } else {
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
      html.style.paddingRight = originalHtmlPaddingRight;
      body.style.paddingRight = originalBodyPaddingRight;
    }
    return () => {
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
      html.style.paddingRight = originalHtmlPaddingRight;
      body.style.paddingRight = originalBodyPaddingRight;
    };
  }, [showLoginModal, showRegisterModal]);
  return null;
};

export default ModalBodyScrollLock;
