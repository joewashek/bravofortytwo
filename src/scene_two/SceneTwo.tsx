import React, { useState, useRef, FC, useEffect } from 'react';

import "@babylonjs/core/Physics/physicsEngineComponent"  // side-effect adds scene.enablePhysics function
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent"; // side-effect for shadow generator
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor';
import { CannonJSPlugin, Texture } from '@babylonjs/core';


import { Scene, Engine } from 'react-babylonjs';

import * as CANNON from 'cannon';
import { Color3 } from '@babylonjs/core';
import { TerrainMaterial } from '@babylonjs/materials';

window.CANNON = CANNON;

const gravityVector = new Vector3(0, -9.81, 0);

var terrainMaterial = new TerrainMaterial("terrainMaterial");
    terrainMaterial.specularColor = new Color3(0.5, 0.5, 0.5);
    terrainMaterial.specularPower = 64;
	
	// Set the mix texture (represents the RGB values)
    terrainMaterial.mixTexture = new Texture(process.env.PUBLIC_URL+"/textures/mixMap.png");
	
	// Diffuse textures following the RGB values of the mix map
	// diffuseTexture1: Red
	// diffuseTexture2: Green
	// diffuseTexture3: Blue
    terrainMaterial.diffuseTexture1 = new Texture(process.env.PUBLIC_URL+"/textures/floor.png");
    terrainMaterial.diffuseTexture2 = new Texture(process.env.PUBLIC_URL+"/textures/rock.png");
    terrainMaterial.diffuseTexture3 = new Texture(process.env.PUBLIC_URL+"/textures/grass.png");
    
	// Bump textures according to the previously set diffuse textures
    terrainMaterial.bumpTexture1 = new Texture(process.env.PUBLIC_URL+"/textures/floor_bump.png");
    terrainMaterial.bumpTexture2 = new Texture(process.env.PUBLIC_URL+"/textures/rockn.png");
    terrainMaterial.bumpTexture3 = new Texture(process.env.PUBLIC_URL+"/textures/grassn.png");
   
    // Rescale textures according to the terrain
    terrainMaterial.diffuseTexture1.uScale = terrainMaterial.diffuseTexture1.vScale = 10;
    terrainMaterial.diffuseTexture2.uScale = terrainMaterial.diffuseTexture2.vScale = 10;
    terrainMaterial.diffuseTexture3.uScale = terrainMaterial.diffuseTexture3.vScale = 10;

const SceneTwo: FC = () => {

  return (
    <div className="App">
      <Engine antialias={true} adaptToDeviceRatio={true} canvasId="sample-canvas">
          <Scene enablePhysics={[gravityVector, new CannonJSPlugin()]}>
            <freeCamera name="arc" target={Vector3.Zero()} position={new Vector3(5,2,-47)}/>
            <hemisphericLight name='hemi' direction={new Vector3(0, 1, 0)} intensity={0.8} />
            

            <groundFromHeightMap name="ground1" url={`${process.env.PUBLIC_URL}+"/textures/heightMap.png`} width={100} height={100} subdivisions={100} material={terrainMaterial} position={new Vector3(0,-2.05,0)}>
              <physicsImpostor type={PhysicsImpostor.BoxImpostor} _options={{ mass: 0, restitution: 0.9 }} />
              
            </groundFromHeightMap>
          </Scene>
        </Engine>
    </div>
  );
}
export default SceneTwo;