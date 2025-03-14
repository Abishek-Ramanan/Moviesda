import React,{useEffect,useState} from 'react'
import Search from './Components/Search'
import Spinner from './Components/Spinner';
import MovieCard from './Components/MovieCard';
import { useDebounce} from 'react-use';
import { updateSearchCount, getTrendingMovies} from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY= import.meta.env.VITE_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers:
  {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  }
}

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const [errorMessage, seterrorMessage] = useState('');
  const [movieList, setmovieList] = useState([]);
  const [trendingMovies, settrendingMovies] = useState([]);
  const [isLoading, setisLoading] = useState(false);
  const [debouncedsearchTerm, setdebouncedsearchTerm] = useState('')

  useDebounce(() => {
    setdebouncedsearchTerm(searchTerm);
  }, 750, [searchTerm]);

  const fetchMovies = async (query='') => {
    setisLoading(true);
    seterrorMessage('');
    try{
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint,API_OPTIONS);
      if(!response.ok){
        throw new Error('Failed to fetch movies');
      }
      const data = await response.json(); 
      if(data.Response === 'False'){
        seterrorMessage(data.Error || 'Failed to fetch movies');
        setmovieList([]);
        return;
      }
      setmovieList(data.results || []);
      if(query && data.results.length > 0){
        updateSearchCount(query, data.results[0]);
      }
    }
    catch(error){
      console.error(`Error fetching movies:${error}`);
      seterrorMessage('Error fetching movies. Please try again later.');
    }finally{
      setisLoading(false);
    }
  }
  const loadTrendingMovies = async () => {
    try{
      const movies = await getTrendingMovies();
      settrendingMovies(movies);

    } catch(error){
      console.error(`Error fetching trending movies:${error}`);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedsearchTerm);
  },[debouncedsearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  },[]);

  return (
    <main>
      <div className="pattern"></div>
      <div className='wrapper'>
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Find <span className='text-gradient'>Movies</span> You'll Enjoy Without The Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>
        {trendingMovies.length > 0 && (
          <section className='trending'>
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie,index)=>(
              <li key={movie.$id}>
                <p>{index + 1}</p>
                <img src={movie.poster_url} alt={movie.title} />
              </li>
              ))}
            </ul>
          </section>
        )}

        <section className='all-movies'>
          <h2>All-Movies</h2>
          {isLoading ?( <Spinner/>
        ):errorMessage ?(<p className='text-red-500'>{errorMessage}</p>
        ):(
          <ul>
            {movieList.map((movie) => (
              <MovieCard key={movie.id} movie={movie}/>
            ))}
          </ul>
        ) }
        </section>
      </div>
      
    </main>
  )
}

export default App
