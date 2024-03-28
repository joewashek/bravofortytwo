import React from 'react';
import { Routes,Route, Link } from 'react-router-dom';
import Home from './home/Home';
import SceneOne from './scene_one/SceneOne';
import SceneTwo from './scene_two/SceneTwo';
import SceneThree from './scene-three/SceneThree';

function App() {
  return (
    <div>
        <header>
            test header
            <Link to="/scenetwo">scene two</Link>
            <Link to="/sceneone">scene one</Link>
            <Link to="/scenethree">scene three</Link>
        </header>
        <Routes>
            <Route path="/scenethree" element={<SceneThree/>}/>
            <Route path="/scenetwo" element={<SceneTwo/>}/>
            <Route path="/sceneone" element={<SceneOne/>}/>
            <Route path="/" element={<Home/>}/>
        </Routes>
    </div>
    
  );
}

export default App;
