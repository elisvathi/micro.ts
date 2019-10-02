import { GlobalMetadata, ControllerMetadata } from "./types/ControllerMetadataTypes";
import { MethodDescription } from "./types/MethodMetadataTypes";
import { ParamDescription } from "./types/ParamMetadataTypes";

const metadata: GlobalMetadata = {
    controllers : new Map<any, ControllerMetadata>(),
    methods : new Map<any, {[key: string]: MethodDescription}>(),
    parameters : new Map<any, {[key: string]: (ParamDescription | null)[]}>(),
};

export function getGlobalMetadata() {
    return metadata;
}

export function printMetadata(){
    console.dir(metadata, {depth: null});
}
