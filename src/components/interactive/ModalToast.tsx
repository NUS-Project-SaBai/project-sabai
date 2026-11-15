import { useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function ModalToast() {
  useEffect(() => {
    return () => {
      toast.removeAll("modal");
    };
  }, []);

  return <Toaster toasterId="modal" />;
}
