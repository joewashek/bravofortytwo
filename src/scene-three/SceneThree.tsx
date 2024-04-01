import React, { useState, useRef, FC, useEffect } from 'react';
import "@babylonjs/core/Physics/physicsEngineComponent"  // side-effect adds scene.enablePhysics function
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent"; // side-effect for shadow generator
import "@babylonjs/loaders/glTF";
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor';
import { AssetContainer, GroundMesh, HavokPlugin,PhysicsAggregate,PhysicsShapeType,SceneLoader,Texture, TransformNode,ArcRotateCamera } from '@babylonjs/core';
import HavokPhysics, { HavokPhysicsWithBindings, Result } from '@babylonjs/havok';
import { Engine, Scene, SceneEventArgs, useScene } from 'react-babylonjs';
import PlayerCamera from '../players/player_camera';
import { Color3 } from '@babylonjs/core';
import { TerrainMaterial } from '@babylonjs/materials';


import { ThirdPersonController } from '../players/ThirdPersonController';


const assumedFramesPerSecond = 60;
const earthGravity = -9.81;
const gravityVector = new Vector3(0, earthGravity, 0);

const MyChild: FC = () => {
  const scene = useScene();
  
  var terrainMaterial = new TerrainMaterial("terrainMaterial",scene!);
  terrainMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
  terrainMaterial.specularPower = 64;
  
  // Set the mix texture (represents the RGB values)
  terrainMaterial.mixTexture = new Texture(process.env.PUBLIC_URL+"/textures/mixMap_test.png",scene!);

  // Diffuse textures following the RGB values of the mix map
  // diffuseTexture1: Red
  // diffuseTexture2: Green
  // diffuseTexture3: Blue
  terrainMaterial.diffuseTexture1 = new Texture(process.env.PUBLIC_URL+"/textures/floor.png",scene!);
  terrainMaterial.diffuseTexture2 = new Texture(process.env.PUBLIC_URL+"/textures/rock.png",scene!);
  terrainMaterial.diffuseTexture3 = new Texture(process.env.PUBLIC_URL+"/textures/grass.png",scene!);
  
  // Bump textures according to the previously set diffuse textures
  terrainMaterial.bumpTexture1 = new Texture(process.env.PUBLIC_URL+"/textures/floor_bump.png",scene!);
  terrainMaterial.bumpTexture2 = new Texture(process.env.PUBLIC_URL+"/textures/rockn.png",scene!);
  terrainMaterial.bumpTexture3 = new Texture(process.env.PUBLIC_URL+"/textures/grassn.png",scene!);

  // Rescale textures according to the terrain
  terrainMaterial.diffuseTexture1.uScale = terrainMaterial.diffuseTexture1.vScale = 10;
  terrainMaterial.diffuseTexture2.uScale = terrainMaterial.diffuseTexture2.vScale = 10;
  terrainMaterial.diffuseTexture3.uScale = terrainMaterial.diffuseTexture3.vScale = 10;


  //const groundAggregate = new PhysicsAggregate(groundMesh as TransformNode, PhysicsShapeType.MESH, { mass: 0 });
  return (
    <groundFromHeightMap 
      name="ground1" 
      position={new Vector3(1,1,-10)}
    receiveShadows={true}
      checkCollisions={true}
      isPickable={true}
      url={`${process.env.PUBLIC_URL}/textures/height_map1.png`} 
      minHeight={0} 
      maxHeight={10} 
      width={100} 
      height={100} 
      subdivisions={30} 
      onReady={(groundMesh)=>{
        const groundAggregate = new PhysicsAggregate(groundMesh as TransformNode, PhysicsShapeType.MESH, { mass: 0 });
      }}>
      {/* <physicsAggregate type={PhysicsShapeType.MESH} _options={{ mass: 0, restitution: 0.9 }}  /> */}
      <material name='mymat' assignTo="material" fromInstance={terrainMaterial}>

      </material>
    </groundFromHeightMap>
  )
}

const SceneThree: FC = () => {

  const [HK, setHK] = useState<HavokPhysicsWithBindings>();
  const [AC,setAC] = useState<AssetContainer>();

  useEffect(() => {

    (async()=>{
      const havokInstance = await HavokPhysics();
      setTimeout(() => {
        setHK(havokInstance)
      }, 1000);
    })()

    

  }, []);
 let isLoading = false;
  const setHavok = (e: SceneEventArgs)=>{
    const { scene, canvas } = e;
    scene.enablePhysics(gravityVector, new HavokPlugin(false, HK));
    //const camera = new PlayerCamera(new Vector3(3, 5, 36), scene);
    //camera.attachControl();
    const camera = new ArcRotateCamera(
      'arcCamera1',
      0,
      0,
      6,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, false);
    camera.setPosition(new Vector3(0, 8.14, -9.26));
    camera.lowerRadiusLimit = 1;
    const isLocked = false;
    scene.onPointerDown = () => {
        if (!isLocked) {
            canvas.requestPointerLock =
                canvas.requestPointerLock ||
                canvas.msRequestPointerLock ||
                canvas.mozRequestPointerLock ||
                canvas.webkitRequestPointerLock ||
                function(){};
            if (canvas.requestPointerLock) {
                // isLocked = true;
                canvas.requestPointerLock();
            }
        }
    };
    
    
      console.log('first load')
      
      
      SceneLoader.LoadAssetContainerAsync(process.env.PUBLIC_URL+"/textures/","x-bot.glb",scene,undefined,".glb")
      .then((container)=>{
        console.log('first load complete success')
        setAC(container);
        const [mesheRoot] = container.meshes;
        container.addAllToScene();
        const character = new ThirdPersonController(container,camera,scene);
      }).catch(err=>{
        console.error('error getting glb');
        console.log(err)
      })
     
   
    
      // SceneLoader.LoadAssetContainer(process.env.PUBLIC_URL+"/textures/","x-bot.glb",scene,(container)=>{
      //   setAC(container);
      //   const [mesheRoot] = container.meshes;
      //   container.addAllToScene();
      //   const character = new ThirdPersonController(container,camera,scene);
      // })
      
  }

  return (  
    <div className="App">
      <Engine antialias={true} adaptToDeviceRatio={true} canvasId="sample-canvas">
        {
          HK ? (
            <Scene onSceneMount={setHavok}  >
            <hemisphericLight name='hemi' direction={new Vector3(0, 1, 0)}  />
            <sphere name='sphere' diameter={2} segments={32} position={new Vector3(5,4,36)}>
              <physicsAggregate type={PhysicsShapeType.SPHERE} _options={{mass:1,restitution:0.75}} />
            </sphere>
            
            <MyChild />
          </Scene>
          ) : null
        }
          
        </Engine>
    </div>
  );
}
export default SceneThree;