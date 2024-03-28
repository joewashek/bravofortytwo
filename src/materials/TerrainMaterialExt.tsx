import { BabylonNode, HostRegistrationStore, PropertyUpdate, Scene, PropsHandler,FiberMaterialPropsHandler,FiberPushMaterialPropsCtor,FiberPushMaterialPropsHandler} from "react-babylonjs";
import { TerrainMaterial } from "@babylonjs/materials";
import { Color3, Texture } from "@babylonjs/core";

export type FiberTerrainMaterialProps = {
  specularColor: Color3
  specularPower: number
  mixTexture: Texture
  diffuseTexture1: Texture
  diffuseTexture2: Texture
  diffuseTexture3: Texture
  bumpTexture1: Texture
  bumpTexture2: Texture
  bumpTexture3: Texture
  
}

class TerrainMaterialPropsHandler{
  getPropertyUpdates(oldProps: any, newProps: any){
    console.log('get props')
    const changedProps: PropertyUpdate[] = [];
    
    return changedProps.length === 0 ? null : changedProps
  }
}

class FiberTerrainMaterial{
  private propsHandlers: PropsHandler<any>[]

  constructor() {
    this.propsHandlers = [
      new TerrainMaterialPropsHandler(),
      new FiberMaterialPropsHandler(),
      new FiberPushMaterialPropsHandler()
    ]
    console.log('in terrain constructor')
  }

  getPropsHandlers() {
    return this.propsHandlers
  }

  addPropsHandler(propHandler: PropsHandler<any>) {
    this.propsHandlers.push(propHandler)
  }
}

// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       terrainMaterial: FiberTerrainMaterialProps &
//       FiberPushMaterialPropsCtor &
//         BabylonNode<TerrainMaterial>
//     }
//   }
// }

HostRegistrationStore.Register({
  hostElementName: 'terrainMaterial',
  hostFactory: (scene: any, props: any) => {
    console.log('we are here;')
    const name = 'name' in props ? props.name : 'unknown'
    console.log(`creating '${name}'`)
    const material = new TerrainMaterial(name, scene)
    return material
  },
  propHandlerInstance: new FiberTerrainMaterial(),
  createInfo: {
    creationType: '...',
    libraryLocation: '...',
    namespace: '@babylonjs/materials',
    parameters: [
      {
        name: 'name',
        type: 'string',
        optional: false,
      },
      {
        name: 'scene',
        type: 'BabylonjsCoreScene',
        optional: false,
      },
    ],
  },
  metadata: {
    isMaterial: true,
    className: 'TerrainMaterial',
  },
})