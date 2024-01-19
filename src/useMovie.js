import { useEffect, useState } from "react";

const apiKey = "2537c8";
export function useMovie(query) {
  const [movies, setMovies] = useState([]);
  // const [watched, setWatched] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    function () {
      const controller = new AbortController();

      async function fetchMovies() {
        try {
          setIsLoading(true);
          setError("");

          //fetch data from api

          const res = await fetch(
            `https://www.omdbapi.com/?apikey=${apiKey}&s=${query}`,
            { signal: controller.signal }
          );
          //if data comes false it will convert it to true to show error
          if (!res.ok) {
            throw new Error("Something Went Wrong While Loading Movies 🥺");
          }

          const data = await res.json();
          if (data.Response === "False") {
            throw new Error(`${query} Not Found! 🥺`);
          }

          setMovies(data.Search);
        } catch (err) {
          setError(err.message);
          if (err.name !== "AbortedError") {
            setError(err.message);
          }
          setIsLoading(false);
          setError("");
        } finally {
          setIsLoading(false);
        }
      }

      if (query.trim() !== "" && query.length > 2) {
        // Call fetchMovies only if the query is not empty
        fetchMovies();
      } else {
        setError("");
        // this clears the Movies if the search length is below 2
        setMovies([]);
      }
      //it closes the right movie desc if we are searching for another movie

      //this is used to abort last action if user keeps writing in search
      return function cleanup() {
        controller.abort();
      };
    },
    [query]
  );
  return { movies, isLoading, error };
}
