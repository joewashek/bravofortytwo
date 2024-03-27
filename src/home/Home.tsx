import logo from '../logo.svg';
import { Link } from 'react-router-dom';
import '../App.css';

const Home = () => {
    return(
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                Edit <code>src/App.tsx</code> and save to reload!
                </p>
                <Link
                className="App-link"
                to="/sceneone"
                target="_blank"
                rel="noopener noreferrer"
                >
                Enter
                </Link>
            </header>
        </div>
    )
}

export default Home;