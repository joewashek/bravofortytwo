import React, { useState, useRef, FC, useEffect } from 'react';
import "@babylonjs/core/Physics/v2/physicsEngineComponent"  // side-effect adds scene.enablePhysics function
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent"; // side-effect for shadow generator
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import HavokPhysics, { HavokPhysicsWithBindings } from '@babylonjs/havok'
import { Scene, Engine,useBeforeRender, SceneEventArgs } from 'react-babylonjs';
import BouncySphere from '../sphere/BouncySphere';
import '../App.css';
import { Color3, PhysicsBody, PhysicsShapeBox } from '@babylonjs/core';

const gravityVector = new Vector3(0, -9.81, 0);
const RADIUS = 5;
const NUMBER_OF_BOXES = 8;

const SceneOne: FC = () => {
  
  const [fontsReady, setFontsReady] = useState(false);
  const [HK, setHK] = useState<HavokPhysicsWithBindings>();

  const faLoaded = useRef(false);
  useEffect(() => {
    if (document.fonts.check("16px FontAwesome") === false) {
      document.fonts.load("16px FontAwesome").then(() => {
        if (faLoaded.current !== true) {
          faLoaded.current = true;
          setFontsReady(true);
        }
      });
    } else if (faLoaded.current !== true) {
      faLoaded.current = true;
      setFontsReady(true);
    }
    (async()=>{
      const havokInstance = await HavokPhysics();
      setTimeout(() => {
        setHK(havokInstance)
      }, 1000);
    })()
  }, []);

  const setHavok = (e: SceneEventArgs)=>{
    const scene = e.scene;
    scene.enablePhysics(null, new HavokPlugin(false, HK))
  }

  return (
    <div className="App">
      <header className="App-header">
        <Engine antialias={true} adaptToDeviceRatio={true} canvasId="sample-canvas" >
          {
            HK ? 
            (
              <Scene onSceneMount={setHavok} >
                <arcRotateCamera name="arc" target={new Vector3(0, 1, 0)}
                  alpha={-Math.PI / 2} beta={(0.2 + (Math.PI / 4))} wheelPrecision={50}
                  radius={14} minZ={0.001} lowerRadiusLimit={8} upperRadiusLimit={20} upperBetaLimit={Math.PI / 2} />
                <hemisphericLight name='hemi' direction={new Vector3(0, -1, 0)} intensity={0.8} />
                <directionalLight name="shadow-light" setDirectionToTarget={[Vector3.Zero()]} direction={Vector3.Zero()} position={new Vector3(-40, 30, -40)}
                  intensity={0.4} shadowMinZ={1} shadowMaxZ={2500}>
                  <shadowGenerator mapSize={1024} useBlurExponentialShadowMap={true} blurKernel={32} darkness={0.8} forceBackFacesOnly={true} depthScale={100} shadowCastChildren>
                  {Array.from(new Array(NUMBER_OF_BOXES), (_, index) => index).map(x => (
                      <BouncySphere
                        key={x}
                        name={x.toFixed()}
                        fontsReady={fontsReady}
                        position={new Vector3(Math.cos(2 * Math.PI / NUMBER_OF_BOXES * x) * RADIUS, 3, Math.sin(2 * Math.PI / NUMBER_OF_BOXES * x) * RADIUS)}
                        color={new Color3(Math.abs(x -(NUMBER_OF_BOXES/2)) / 10, Math.abs(x -(NUMBER_OF_BOXES/2)) / 10, Math.abs(x -(NUMBER_OF_BOXES/2)) / 10)}
                      />
                    ))}
                  </shadowGenerator>
                </directionalLight>

                <ground name="ground1" width={24} height={24} subdivisions={2} receiveShadows={true}>
                  <physicsAggregate type={PhysicsShapeType.BOX} _options={{ mass: 0, restitution: 0.8 }} />
                  
                </ground>
                
              </Scene>
            ) : null
          }
          
        </Engine>
      </header>
    </div>
  );
}
export default SceneOne;