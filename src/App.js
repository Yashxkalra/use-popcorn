import { useCallback, useEffect, useRef, useState } from "react";
import StarRating from "./Stars";

const apiKey = "2537c8";
export default function App() {
  const [movies, setMovies] = useState([]);
  // const [watched, setWatched] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectId, setSelectId] = useState("tt0903747");
  const controller = new AbortController();
  const [watched, setWatched] = useState(() => {
    const storedWatched = localStorage.getItem("watched");
    return storedWatched ? JSON.parse(storedWatched) : [];
  });

  function handleSelectMovie(id) {
    setSelectId((selectId) => (selectId === id ? null : id));
  }
  //close the movie
  function handleCloseMovie(id) {
    setSelectId(null);
  }
  // this the adds the new movie to the watched array
  function handleWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }
  //this delets the movie
  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }
  //store the watched array in local storage
  useEffect(
    function () {
      localStorage.setItem("watched", JSON.stringify(watched));
    },
    [watched]
  );
  //fetch data and error handling
  useEffect(
    function () {
      async function fetchMovies() {
        try {
          setIsLoading(true);
          setError("");

          //fetch data from api

          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${apiKey}&s=${query}`,
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
      handleCloseMovie();

      //this is used to abort last action if user keeps writing in search
      return function cleanup() {
        controller.abort();
      };
    },
    [query]
  );

  //this is the front part of the app that we see in the web
  return (
    <>
      <Navbar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </Navbar>

      <Main>
        <Box>
          {isLoading && <Loader />}

          {!isLoading && !error && (
            <MovieList
              movies={movies}
              onSelectMovie={handleSelectMovie}
              onCloseMovie={handleCloseMovie}
            />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>

        <Box>
          {selectId ? (
            <MovieDetails
              selectId={selectId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <MovieWatchedList
                watched={watched}
                onDeleteWatched={handleDeleteWatched}
                onSelectMovie={handleSelectMovie}
                onwatched={watched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

//it just shows loading if it takes time to load
function Loader() {
  return (
    <div className="loader--center">
      <p className="loader">☢️ Loading...</p>
    </div>
  );
}

//this is used to show error on left box if there is not movie searched for
function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>🛑</span>
      {message}
    </p>
  );
}

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

//MovieDetails contains all the data about movie from image to desc and show it on right box
function MovieDetails({ selectId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState();
  const [userRating, setUserRating] = useState("");
  const [movieLink, setMovieLink] = useState("");
  const [errors, setErrors] = useState("");
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [totalEpisodes, setTotalEpisodes] = useState();
  const ratingCounterRef = useRef(0);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  useEffect(
    function () {
      if (userRating) {
        ratingCounterRef.current += 1;
      }
    },
    [userRating]
  );
  //it filters the movie we have watched before so we cant add the same movie twice
  const isWatched = watched.map((movie) => movie.imdbID).includes(selectId);
  const watchedUserRAting = watched.find(
    (movie) => movie.imdbID === selectId
  )?.userRating;

  //all the movie details like title & image that can be used to get data from api which is coming from movie
  const {
    Title: title,
    Year: year,
    Poster: poster,
    imdbRating,
    Runtime: runtime,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
    Type: type,
    Country: country,
    totalSeasons,
  } = movie;
  // console.log(movie);

  const fetchEpisodes = useCallback(async () => {
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${apiKey}&i=${selectId}&season=${selectedSeason}&episodes`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data");
      }
      const allEpisodes = data.Episodes.length;
      setTotalEpisodes(allEpisodes);
    } catch (error) {
      console.error("Error fetching episodes:", error.message);
      setErrors("Failed to fetch episode data");
    }
  }, [selectId, selectedSeason]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes, selectId, selectedSeason, totalEpisodes]);

  function handleAddToWatchList() {
    const newWatchedMovie = {
      imdbID: selectId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      countRatingDecision: ratingCounterRef.current,
    };
    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  ////uses escape function to come back
  useEffect(() => {
    function closeMovieDetails(e) {
      if (e.code === "Escape") {
        onCloseMovie();
      }
    }

    document.addEventListener("keydown", closeMovieDetails);

    return () => {
      document.removeEventListener("keydown", closeMovieDetails);
    };
  }, [onCloseMovie]);

  //fetching the movie setting setMovie
  useEffect(
    function () {
      setIsLoading(true);
      async function fetchMovieDetails() {
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${apiKey}&i=${selectId}`
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error("Something Went Wrong While Loading Movies 🥺");
        }
        setMovie(data);
        setIsLoading(false);
      }

      fetchMovieDetails();
    },
    [selectId]
  );

  //Setting the movielink for videosource
  useEffect(
    function () {
      let isMounted = true;
      //console.log(episodeData);
      async function fetchMovieLink() {
        try {
          setErrors("");
          if (type) {
            if (type === "series") {
              const seriesUrl = await fetch(
                `https://vidsrc.xyz/embed/tv?imdb=${selectId}&season=${selectedSeason}&episode=${selectedEpisode}`
              );
              const data = await seriesUrl;

              if (!seriesUrl.ok) {
                throw new Error(data.error || "Not found");
              }

              if (isMounted) {
                setMovieLink(seriesUrl.url);
              }
            } else {
              const res = await fetch(
                `https://vidsrc.xyz/embed/${type}/${selectId}`
              );
              let data = await res;
              if (!res.ok) throw new Error(data.error || "Not found");
              if (isMounted) {
                setMovieLink(data.url);
              }
            }
          }
        } catch (err) {
          if (isMounted) {
            setErrors(err.message);
          }
        }
      }

      fetchMovieLink();
      return () => {
        isMounted = false; // Set the flag to false when the component is unmounted
      };
    },
    [selectId, type, selectedSeason, selectedEpisode]
  );

  //change app title in browser with movies name
  useEffect(
    function () {
      if (!title) return;
      document.title = `${type} | ${title}`;

      return () => {
        document.title = "Use Popcorn";
      };
    },
    [type, title]
  );

  //displays the movie details on web
  return (
    <>
      <div className="details">
        {isLoading ? (
          <>
            <Loader />
          </>
        ) : (
          <>
            <header>
              <button className="btn-back" onClick={onCloseMovie}>
                &larr;
              </button>

              <img src={poster} alt={`Poster of ${movie} movie`} />
              <div className="details-overview">
                <p>{type}</p>
                <h2>{title}</h2>
                <p>
                  {released} &bull; {runtime} &bull; {country}
                </p>
                <p>{genre}</p>

                <p>
                  <span>⭐</span>
                  {imdbRating} IMDb Rating
                </p>
              </div>
            </header>
            <section>
              <div className="rating">
                {!isWatched ? (
                  <>
                    <StarRating
                      maxRating={10}
                      size={24}
                      onSetRating={setUserRating}
                    />
                    {userRating > 0 && (
                      <button
                        className="btn-add"
                        onClick={handleAddToWatchList}
                      >
                        + Add to List
                      </button>
                    )}
                  </>
                ) : (
                  <p>
                    ⭐ You already rated movie with {watchedUserRAting} stars
                  </p>
                )}
              </div>

              <p>
                <em>{plot}</em>
              </p>
              <p>starring {actors}</p>
              <p>Directed by {director}</p>

              {type === "series" && (
                <>
                  <div className="select-container">
                    <div className="select-wrap">
                      <p>
                        <strong>Season</strong>
                      </p>
                      <select
                        value={selectedSeason}
                        onChange={(e) =>
                          setSelectedSeason(Number(e.target.value))
                        }
                      >
                        {Array.from({ length: totalSeasons }, (_, index) => (
                          <option value={index + 1} key={index + 1}>
                            {index + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="select-wrap">
                      <p>
                        <strong>Episode</strong>
                      </p>
                      {console.log(selectedEpisode)}
                      <select
                        value={selectedEpisode}
                        onChange={(e) =>
                          setSelectedEpisode(Number(e.target.value))
                        }
                      >
                        Episodes
                        <option value={0}>Select Episode</option>
                        {Array.from({ length: totalEpisodes }, (_, index) => (
                          <option value={index + 1} key={index + 1}>
                            {index + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
              {errors ? (
                <ErrorMessage message={`${type} Link Not Found `} />
              ) : (
                <>
                  <iframe
                    title="Video Player"
                    width="100%"
                    height="250"
                    src={movieLink}
                    allowFullScreen
                  >
                    Your browser does not support the video tag.
                  </iframe>

                  <a href={movieLink} rel="noreferrer" target="_blank">
                    <button className="btn-add">Watch the movie 🍿</button>
                  </a>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}

// *************Navigation Bar Starts Here *********************
function Navbar({ children }) {
  return (
    <>
      <nav className="nav-bar">{children}</nav>
    </>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);
  //see if the input is focused or typing so when we press enter nothing happens and if input is not focused then we can press enter to clear the data
  useEffect(
    function () {
      function callBack(e) {
        //console.log(e);
        if (document.activeElement === inputEl.current) return;
        if (e.code === "Enter") {
          inputEl.current.focus();
          setQuery("");
        }
      }

      document.addEventListener("keydown", callBack);
      return document.addEventListener("keydown", callBack);
    },
    [setQuery]
  );

  return (
    <>
      <input
        className="search"
        type="text"
        placeholder="Search movies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        ref={inputEl}
      />
    </>
  );
}

function NumResults({ movies }) {
  return (
    <>
      <p className="num-results">
        Found <strong>{movies.length}</strong> results
      </p>
    </>
  );
}
// *************Navigation Bar Ends Here *********************

//it contains all the element of the app
function Main({ children }) {
  return (
    <>
      <main className="main">{children}</main>
    </>
  );
}

///open close the movies with - button at top right
function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <div className="box">
        <button
          className="btn-toggle"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? "–" : "+"}
        </button>

        {isOpen && children}
      </div>
    </>
  );
}

//movielist contains Movie elements and shows all the movies on left box with ul
function MovieList({ movies, onSelectMovie }) {
  return (
    <>
      <ul className="list list-movies">
        {movies?.map((movie) => (
          <Movie
            movie={movie}
            key={movie.imdbID}
            onSelectMovie={onSelectMovie}
          />
        ))}
      </ul>
    </>
  );
}
//Movie is left side box single movie element which is used by MovieList to show on web by ul.
function Movie({ movie, onSelectMovie }) {
  return (
    <>
      <li onClick={() => onSelectMovie(movie.imdbID)} key={movie.imdbID}>
        <img src={movie.Poster} alt={`${movie.Title} poster`} />
        <h3>{movie.Title}</h3>
        <div>
          <p>
            <span>🗓</span>
            <span>{movie.Year}</span>
          </p>
        </div>
      </li>
    </>
  );
}

//MovieWatchedList is ul element which shows on rated list below rated box
function MovieWatchedList({
  watched,
  onDeleteWatched,
  onSelectMovie,
  onwatched,
}) {
  return (
    <>
      <ul className="list">
        {watched.map((movie) => (
          <WatchedMovie
            movie={movie}
            key={movie.imdbID}
            onDeleteWatched={onDeleteWatched}
            selectMovie={onSelectMovie}
            onwatched={onwatched}
          />
        ))}
      </ul>
    </>
  );
}

//WatchedMovie is single li element of MovieWatchedList which uses ul to style and sshow
function WatchedMovie({ movie, onDeleteWatched, selectMovie, onwatched }) {
  const handleItemClick = (event) => {
    // Check if the click target is the remove button
    if (!event.target.classList.contains("btn-delete")) {
      // If not, call selectMovie
      selectMovie(movie.imdbID);
    }
  };

  return (
    <>
      <li key={movie.imdbID} onClick={handleItemClick}>
        <img src={movie.poster} alt={`${movie.title} poster`} />
        <h3>{movie.title}</h3>
        <div>
          <p>
            <span>⭐️</span>
            <span>{movie.imdbRating}</span>
          </p>
          <p>
            <span>🌟</span>
            <span>{movie.userRating}</span>
          </p>
          <p>
            <span>⏳</span>
            <span>{movie.runtime} min</span>
          </p>
          <button
            className="btn-delete"
            onClick={() => onDeleteWatched(movie.imdbID)}
          >
            &times;
          </button>
        </div>
      </li>
    </>
  );
}

//watched and rated movies box with data
function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <>
      <div className="summary">
        <h2>Movies you watched</h2>
        <div>
          <p>
            <span>#️⃣</span>
            <span>{watched.length} movies</span>
          </p>
          <p>
            <span>⭐️</span>
            <span>{avgImdbRating.toFixed(2)}</span>
          </p>
          <p>
            <span>🌟</span>
            <span>{avgUserRating.toFixed(2)}</span>
          </p>
          <p>
            <span>⏳</span>
            <span>{avgRuntime.toFixed(2)} min</span>
          </p>
        </div>
      </div>
    </>
  );
}
