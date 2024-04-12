import {lazy, useState,Suspense } from 'react';
import "./App.css";
import LoadingModal from './game/LoadingModal';

const Game = lazy(()=> import('./game/Game'))

function App() {
  
  const [playClicked,setPlayClicked] = useState(false);

  return (
    <div id="app-container">
      {
        playClicked ? (
          
          <Suspense fallback={<LoadingModal />}>
            <Game />
          </Suspense>
          
        ) : (
          <div className="game-home">
              <header className="Game-header">
                  <h4>Bravo 1942</h4>
                  <button className='play-button font-allerta' onClick={()=> setPlayClicked(true)}>Play</button>
              </header>
          </div>
        )
      }
    </div>
    
  );
}

export default App;
