import { useEffect, useRef, useState } from "react";
import StarRating from "./Stars";
import { useMovie } from "./useMovie";
import { useLocalStorageState } from "./useLocalStorageState";
import { useKey } from "./useKey";
const apiKey = "2537c8";

export default function App() {
  const [query, setQuery] = useState("");
  const [selectId, setSelectId] = useState("tt0903747");
  const { movies, isLoading, error } = useMovie(query);
  const [watched, setWatched] = useLocalStorageState([], "watched");

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
  const [totalEpisodes, setTotalEpisodes] = useState([]);
  const ratingCounterRef = useRef(0);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  //add to watchlist function
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
  //userrating handle
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

  //fetch movielink and episodes
  useEffect(() => {
    let isMounted = true;

    // Fetch episodes

    async function fetchEpisodes() {
      // Check if the type is 'series'
      if (type === "series") {
        try {
          // Fetch episode data from the OMDB API
          const response = await fetch(
            `https://www.omdbapi.com/?apikey=${apiKey}&i=${selectId}&season=${selectedSeason}&episodes`
          );

          // Extract JSON data from the response
          const data = await response.json();

          // Check if the response is not okay (status code other than 2xx)
          if (!response.ok) {
            // If not okay, throw an error with the error message or a default "Failed to fetch data" message
            throw new Error(data.error || "Failed to fetch data");
          }

          // Extract the total number of episodes from the fetched data
          const allEpisodes = data.Episodes.length;

          // Set the total number of episodes in the component state
          setTotalEpisodes(allEpisodes);
        } catch (error) {
          // Handle any errors that occurred during the fetch operation
          console.error("Error fetching episodes:", error.message);

          // Set an error message in the component state
          setErrors("Failed to fetch episode data");
        }
      }
    }

    // Fetch movie link
    const fetchMyMovies = async () => {
      isMounted = true;
      try {
        // Clear any previous errors
        setErrors("");

        // Check if 'type' is truthy (not undefined, null, false, 0, or an empty string)
        if (type) {
          // Initialize an empty URL string
          let url = "";

          // Construct the URL based on the 'type'
          if (type === "series") {
            url = `https://vidsrc.xyz/embed/tv?imdb=${selectId}&season=${selectedSeason}&episode=${selectedEpisode}`;
          } else {
            url = `https://vidsrc.xyz/embed/${type}/${selectId}`;
          }

          // Fetch data from the constructed URL
          const response = await fetch(url);

          // Extract the data from the response
          const data = await response;

          // Check if the response is not okay (status code other than 2xx)
          if (!data.ok) {
            // If not okay, throw an error with the error message or a default "Not found" message
            throw new Error(data.error || "Not found");
          }

          // If the component is still mounted, set the movie link using the URL
          if (isMounted) {
            setMovieLink(data.url);
          }
        }
      } catch (err) {
        // Handle any errors that occurred during the fetch operation
        console.error("Error fetching movie link:", err);

        // If the component is still mounted, set the error message
        if (isMounted) {
          setErrors(err.message);
        }
      }
    };

    // Call both fetch functions
    fetchEpisodes();
    fetchMyMovies();

    return () => {
      isMounted = false; // Set the flag to false when the component is unmounted
    };
  }, [selectId, type, selectedSeason, selectedEpisode]);

  ////////////////////////////////////////////////////////////////////////
  //fetching the movie from OMDB Server setting setMovie
  useEffect(
    function () {
      setIsLoading(true);
      async function fetchMovieDetails() {
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${apiKey}&i=${selectId}`
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

  useKey("Escape", onCloseMovie);

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
                      size={20}
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
  useKey("Enter", function callBack(e) {
    //console.log(e);
    if (!inputEl.current) return; // Check if inputEl is not null

    // Check if the active element is already the input
    if (document.activeElement === inputEl.current) return;

    // Focus on the input element
    if (inputEl.current) {
      inputEl.current.focus();
    }
    // Perform any additional actions or set state as needed
    setQuery("");
  });

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
