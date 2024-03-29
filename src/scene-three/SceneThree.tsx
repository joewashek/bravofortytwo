import React, { useState, useRef, FC, useEffect } from 'react';
import "@babylonjs/core/Physics/physicsEngineComponent"  // side-effect adds scene.enablePhysics function
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent"; // side-effect for shadow generator
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PhysicsImpostor } from '@babylonjs/core/Physics/physicsImpostor';
import { CannonJSPlugin, HavokPlugin,Texture } from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { Engine, Scene, useScene } from 'react-babylonjs';
import * as CANNON from 'cannon';
import { Color3 } from '@babylonjs/core';
import { TerrainMaterial } from '@babylonjs/materials';

window.CANNON = CANNON;

const gravityVector = new Vector3(0, -9.81, 0);

async function getInitializedHavok() {
  return await HavokPhysics();
}

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

  return (
    <groundFromHeightMap name="ground1" url={`${process.env.PUBLIC_URL}/textures/height_map1.png`} minHeight={0} maxHeight={10} width={100} height={100} subdivisions={30} >
      <physicsImpostor type={PhysicsImpostor.BoxImpostor} _options={{ mass: 0, restitution: 0.9 }} />
      <material name='mymat' assignTo="material" fromInstance={terrainMaterial}>

      </material>
    </groundFromHeightMap>
  )
}

const SceneThree: FC = () => {
  return (  
    <div className="App">
      <Engine antialias={true} adaptToDeviceRatio={true} canvasId="sample-canvas">
          <Scene enablePhysics={[gravityVector, new CannonJSPlugin()]}>
            <freeCamera name="arc" position={new Vector3(3,4,32)} setEnabled={Vector3.Zero()} />
            <hemisphericLight name='hemi' direction={new Vector3(0, 1, 0)}  />
           <MyChild />
          </Scene>
        </Engine>
    </div>
  );
}
export default SceneThree;