import { TerrainMaterial } from "@babylonjs/materials";
import { FiberTerrainMaterialProps }from './materials/TerrainMaterialExt'
import { BabylonNode, FiberPushMaterialPropsCtor} from "react-babylonjs";

export declare global {
  namespace JSX {
    interface IntrinsicElements {
      terrainMaterial: FiberTerrainMaterialProps &
      FiberPushMaterialPropsCtor &
        BabylonNode<TerrainMaterial>
    }
  }
}

