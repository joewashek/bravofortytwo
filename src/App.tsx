import React from 'react';
import { Routes,Route, Link } from 'react-router-dom';
import Home from './home/Home';
import SceneOne from './scene_one/SceneOne';
import SceneTwo from './scene_two/SceneTwo';

function App() {
  return (
    <div>
        <header>
            test header
            <Link to="/scenetwo">scene two</Link>
        </header>
        <Routes>
            <Route path="/scenetwo" element={<SceneTwo/>}/>
            <Route path="/sceneone" element={<SceneOne/>}/>
            <Route path="/" element={<Home/>}/>
        </Routes>
    </div>
    
  );
}

export default App;
