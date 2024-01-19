import { useEffect } from "react";
export function useKey(key, action) {
  ////uses escape function to come back
  useEffect(() => {
    function handleKeyPress(e) {
      if (e.code.toLowerCase() === key.toLowerCase()) {
        action();
      }
    }

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [action, key]);
}
