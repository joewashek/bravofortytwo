import React, { useState, useRef, FC, useEffect } from 'react';

import "@babylonjs/core/Physics/physicsEngineComponent"  // side-effect adds scene.enablePhysics function
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent"; // side-effect for shadow generator
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor';
import { CannonJSPlugin,StandardMaterial,Texture } from '@babylonjs/core';


import { Engine, Scene, useScene } from 'react-babylonjs';

import * as CANNON from 'cannon';
import { Color3 } from '@babylonjs/core';
import { GridMaterial, NormalMaterial, TerrainMaterial,TriPlanarMaterial } from '@babylonjs/materials';

window.CANNON = CANNON;

const gravityVector = new Vector3(0, -9.81, 0);

const MyChild: FC = () => {
  const scene = useScene();
  // console.log('my child');
  // console.log(scene);
  // const newmat = new StandardMaterial("normalMat",scene!)
  // newmat.diffuseColor = Color3.Red(); 
  var terrainMaterial = new TerrainMaterial("terrainMaterial",scene!);
    terrainMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
    terrainMaterial.specularPower = 64;
	
	// Set the mix texture (represents the RGB values)
    terrainMaterial.mixTexture = new Texture(process.env.PUBLIC_URL+"/textures/mixMap.png",scene!);
	
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

  return (
    <groundFromHeightMap name="ground1" url={`${process.env.PUBLIC_URL}/textures/heightMap.png`} minHeight={0} maxHeight={10} width={100} height={100} subdivisions={30} >
              <physicsImpostor type={PhysicsImpostor.BoxImpostor} _options={{ mass: 0, restitution: 0.9 }} />
              <material name='mymat' assignTo="material" fromInstance={terrainMaterial}>

              </material>
            </groundFromHeightMap>
  )
}

const SceneThree: FC = () => {

//  const terrainMaterial = new TerrainMaterial("terrainMaterial");
//   terrainMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
//   terrainMaterial.specularPower = 64;

// // Set the mix texture (represents the RGB values)
//   terrainMaterial.mixTexture = new Texture(process.env.PUBLIC_URL+"/textures/mixMap.png");

// // Diffuse textures following the RGB values of the mix map
// // diffuseTexture1: Red
// // diffuseTexture2: Green
// // diffuseTexture3: Blue
//   terrainMaterial.diffuseTexture1 = new Texture(process.env.PUBLIC_URL+"/textures/floor.png");
//   terrainMaterial.diffuseTexture2 = new Texture(process.env.PUBLIC_URL+"/textures/rock.png");
//   terrainMaterial.diffuseTexture3 = new Texture(process.env.PUBLIC_URL+"/textures/grass.png");
  
// // Bump textures according to the previously set diffuse textures
//   terrainMaterial.bumpTexture1 = new Texture(process.env.PUBLIC_URL+"/textures/floor_bump.png");
//   terrainMaterial.bumpTexture2 = new Texture(process.env.PUBLIC_URL+"/textures/rockn.png");
//   terrainMaterial.bumpTexture3 = new Texture(process.env.PUBLIC_URL+"/textures/grassn.png");
 
//   // Rescale textures according to the terrain
//   terrainMaterial.diffuseTexture1.uScale = terrainMaterial.diffuseTexture1.vScale = 10;
//   terrainMaterial.diffuseTexture2.uScale = terrainMaterial.diffuseTexture2.vScale = 10;
//   terrainMaterial.diffuseTexture3.uScale = terrainMaterial.diffuseTexture3.vScale = 10;
 



  return (
    
    <div className="App">
      <Engine antialias={true} adaptToDeviceRatio={true} canvasId="sample-canvas">
          <Scene enablePhysics={[gravityVector, new CannonJSPlugin()]}>
            {

            }
            
            <arcRotateCamera name="arc" alpha={- Math.PI / 3} beta={5 * Math.PI / 12} radius={50} target={Vector3.Zero()} />
            <hemisphericLight name='hemi' direction={new Vector3(0, 1, 0)}  />
            
            {/* <ground name='ground' width={6} height={6}>
              <standardMaterial name="redcolor" diffuseColor={Color3.Red()} />
              </ground> */}
           <MyChild />
          </Scene>
        </Engine>
    </div>
  );
}
export default SceneThree;