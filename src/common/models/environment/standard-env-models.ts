import { Color3, CubeTexture,MeshBuilder, Scene, StandardMaterial, Texture } from "@babylonjs/core";

const defaultSkybox = (scene:Scene,size: number):void => {
  const skybox = MeshBuilder.CreateBox("skyBox", {size:size}, scene);
  const skyboxMaterial = new StandardMaterial("skyBox", scene);
  skybox.infiniteDistance = true;
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.disableLighting = true;
  skyboxMaterial.reflectionTexture = new CubeTexture(process.env.PUBLIC_URL+"/textures/skybox/skybox", scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
  skyboxMaterial.specularColor = new Color3(0, 0, 0);
  skybox.material = skyboxMaterial;
}

export {
  defaultSkybox
}