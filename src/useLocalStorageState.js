// Import the necessary React hooks
import { useState, useEffect } from "react";

// Define a custom hook for managing state in local storage
export function useLocalStorageState(initialState, key) {
  // Use the useState hook to create state with a default value retrieved from local storage or the provided initial state
  const [value, setValue] = useState(() => {
    // Retrieve the stored value from local storage using the provided key
    const storedValue = localStorage.getItem(key);

    // Parse the stored value as JSON, or use the provided initial state if it doesn't exist
    return storedValue ? JSON.parse(storedValue) : initialState;
  });

  // Use the useEffect hook to update local storage whenever the state value or the key changes
  useEffect(
    function () {
      // Save the current state value to local storage as a JSON string
      localStorage.setItem(key, JSON.stringify(value));
    },
    [value, key] // The effect will run when either the 'value' or the 'key' changes
  );

  // Return an array containing the current state value and the function to update the state
  return [value, setValue];
}
