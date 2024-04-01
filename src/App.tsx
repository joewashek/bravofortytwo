import SceneTwo from './scene_two/SceneTwo';
import { FC, lazy, useState,Suspense } from 'react';
import "./App.css";

const Game = lazy(()=> import('./game/Game'))

function App() {

  const [playClicked,setPlayClicked] = useState(false);

  return (
    <div id="app-container">
      {
        playClicked ? (
          
          <Suspense fallback={<div>loading..</div>}>
            <Game />
          </Suspense>
          
        ) : (
          <div className="game-home">
              <header className="Game-header">
                  <h4>Bravo 1942</h4>
                  <button className='play-button' onClick={()=> setPlayClicked(true)}>Play</button>
              </header>
          </div>
        )
      }
        {/* <header>
            test header
            <Link to="/scenetwo">scene two</Link>
            <Link to="/sceneone">scene one</Link>
            <Link to="/scenethree">scene three</Link>
        </header>
        <Routes>
            
            <Route path="/scenetwo" element={<SceneTwo/>}/>
            
            <Route path="/" element={<Home/>}/>
        </Routes> */}
    </div>
    
  );
}

export default App;
