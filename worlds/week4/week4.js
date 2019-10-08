"use strict"

let cursor;

async function setup(state) {
    let libSources = await MREditor.loadAndRegisterShaderLibrariesForLiveEditing(gl, "libs", [
        { 
            key : "pnoise", path : "shaders/noise.glsl", foldDefault : true
        },
        {
            key : "sharedlib1", path : "shaders/sharedlib1.glsl", foldDefault : true
        },      
    ]);

    if (!libSources) {
        throw new Error("Could not load shader library");
    }

    // load vertex and fragment shaders from the server, register with the editor
    let shaderSource = await MREditor.loadAndRegisterShaderForLiveEditing(
        gl,
        "mainShader",
        { 
            onNeedsCompilation : (args, libMap, userData) => {
                const stages = [args.vertex, args.fragment];
                const output = [args.vertex, args.fragment];

                const implicitNoiseInclude = true;
                if (implicitNoiseInclude) {
                    let libCode = MREditor.libMap.get("pnoise");

                    for (let i = 0; i < 2; i += 1) {
                        const stageCode = stages[i];
                        const hdrEndIdx = stageCode.indexOf(';');
                        
                        /*
                        const hdr = stageCode.substring(0, hdrEndIdx + 1);
                        output[i] = hdr + "\n#line 1 1\n" + 
                                    libCode + "\n#line " + (hdr.split('\n').length) + " 0\n" + 
                                    stageCode.substring(hdrEndIdx + 1);
                        console.log(output[i]);
                        */
                        const hdr = stageCode.substring(0, hdrEndIdx + 1);
                        
                        output[i] = hdr + "\n#line 2 1\n" + 
                                    "#include<pnoise>\n#line " + (hdr.split('\n').length + 1) + " 0" + 
                            stageCode.substring(hdrEndIdx + 1);

                        console.log(output[i]);
                    }
                }

                MREditor.preprocessAndCreateShaderProgramFromStringsAndHandleErrors(
                    output[0],
                    output[1],
                    libMap
                );
            },
            onAfterCompilation : (program) => {
                state.program = program;

                gl.useProgram(program);

                state.uCursorLoc       = gl.getUniformLocation(program, 'uCursor');
                state.uModelLoc        = gl.getUniformLocation(program, 'uModel');
                state.uProjLoc         = gl.getUniformLocation(program, 'uProj');
                state.uTimeLoc         = gl.getUniformLocation(program, 'uTime');
                state.uViewLoc         = gl.getUniformLocation(program, 'uView');


                state.uMaterialsLoc = [];
                state.uMaterialsLoc[0] = {};
                state.uMaterialsLoc[0].diffuse              = gl.getUniformLocation(program, 'uMaterials[0].diffuse');
                state.uMaterialsLoc[0].ambient              = gl.getUniformLocation(program, 'uMaterials[0].ambient');
                state.uMaterialsLoc[0].specular             = gl.getUniformLocation(program, 'uMaterials[0].specular');
                state.uMaterialsLoc[0].power                = gl.getUniformLocation(program, 'uMaterials[0].power');
                state.uMaterialsLoc[0].reflection_factor    = gl.getUniformLocation(program, 'uMaterials[0].reflection_factor');
                state.uMaterialsLoc[0].refraction_factor    = gl.getUniformLocation(program, 'uMaterials[0].refraction_factor');
                state.uMaterialsLoc[0].index_of_refrac      = gl.getUniformLocation(program, 'uMaterials[0].index_of_refrac');
                

                state.uMaterialsLoc[1] = {};
                state.uMaterialsLoc[1].diffuse              = gl.getUniformLocation(program, 'uMaterials[1].diffuse');
                state.uMaterialsLoc[1].ambient              = gl.getUniformLocation(program, 'uMaterials[1].ambient');
                state.uMaterialsLoc[1].specular             = gl.getUniformLocation(program, 'uMaterials[1].specular');
                state.uMaterialsLoc[1].power                = gl.getUniformLocation(program, 'uMaterials[1].power');
                state.uMaterialsLoc[1].reflection_factor    = gl.getUniformLocation(program, 'uMaterials[1].reflection_factor');
                state.uMaterialsLoc[1].refraction_factor    = gl.getUniformLocation(program, 'uMaterials[1].refraction_factor');
                state.uMaterialsLoc[1].index_of_refrac      = gl.getUniformLocation(program, 'uMaterials[1].index_of_refrac');

                state.uMaterialsLoc[2] = {};
                state.uMaterialsLoc[2].diffuse              = gl.getUniformLocation(program, 'uMaterials[2].diffuse');
                state.uMaterialsLoc[2].ambient              = gl.getUniformLocation(program, 'uMaterials[2].ambient');
                state.uMaterialsLoc[2].specular             = gl.getUniformLocation(program, 'uMaterials[2].specular');
                state.uMaterialsLoc[2].power                = gl.getUniformLocation(program, 'uMaterials[2].power');
                state.uMaterialsLoc[2].reflection_factor    = gl.getUniformLocation(program, 'uMaterials[2].reflection_factor');
                state.uMaterialsLoc[2].refraction_factor    = gl.getUniformLocation(program, 'uMaterials[2].refraction_factor');
                state.uMaterialsLoc[2].index_of_refrac      = gl.getUniformLocation(program, 'uMaterials[2].index_of_refrac');

                state.uShapesLoc = [];
                state.uShapesLoc[0] = {};
                state.uShapesLoc[0].type              = gl.getUniformLocation(program, 'uShapes[0].type');
                state.uShapesLoc[0].center              = gl.getUniformLocation(program, 'uShapes[0].center');
                state.uShapesLoc[0].radius             = gl.getUniformLocation(program, 'uShapes[0].radius');
                state.uShapesLoc[0].matrix             = gl.getUniformLocation(program, 'uShapes[0].matrix');
                state.uShapesLoc[0].imatrix             = gl.getUniformLocation(program, 'uShapes[0].imatrix');

                state.uShapesLoc[1] = {};
                state.uShapesLoc[1].type              = gl.getUniformLocation(program, 'uShapes[1].type');
                state.uShapesLoc[1].center              = gl.getUniformLocation(program, 'uShapes[1].center');
                state.uShapesLoc[1].radius             = gl.getUniformLocation(program, 'uShapes[1].radius');
                state.uShapesLoc[1].matrix             = gl.getUniformLocation(program, 'uShapes[1].matrix');
                state.uShapesLoc[1].imatrix             = gl.getUniformLocation(program, 'uShapes[1].imatrix');

                state.uShapesLoc[2] = {};
                state.uShapesLoc[2].type              = gl.getUniformLocation(program, 'uShapes[2].type');
                state.uShapesLoc[2].center              = gl.getUniformLocation(program, 'uShapes[2].center');
                state.uShapesLoc[2].radius             = gl.getUniformLocation(program, 'uShapes[2].radius');
                state.uShapesLoc[2].matrix             = gl.getUniformLocation(program, 'uShapes[2].matrix');
                state.uShapesLoc[2].imatrix             = gl.getUniformLocation(program, 'uShapes[2].imatrix');
            } 
        },
        {
            paths : {
                vertex   : "shaders/vertex.vert.glsl",
                fragment : "shaders/fragment.frag.glsl"
            },
            foldDefault : {
                vertex   : true,
                fragment : false
            }
        }
    );

    cursor = ScreenCursor.trackCursor(MR.getCanvas());

    if (!shaderSource) {
        throw new Error("Could not load shader");
    }


    // Create a square as a triangle strip consisting of two triangles
    state.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,0, 1,1,0, -1,-1,0, 1,-1,0]), gl.STATIC_DRAW);

    // Assign aPos attribute to each vertex
    let aPos = gl.getAttribLocation(state.program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
}

// I HAVE IMPLEMENTED inverse() FOR YOU. FOR HOMEWORK, YOU WILL STILL NEED TO IMPLEMENT:
// identity(), translate(x,y,z), rotateX(a), rotateY(a) rotateZ(a), scale(x,y,z), multiply(A,B)

let inverse = src => {
  let dst = [], det = 0, cofactor = (c, r) => {
     let s = (i, j) => src[c+i & 3 | (r+j & 3) << 2];
     return (c+r & 1 ? -1 : 1) * ( (s(1,1) * (s(2,2) * s(3,3) - s(3,2) * s(2,3)))
                                 - (s(2,1) * (s(1,2) * s(3,3) - s(3,2) * s(1,3)))
                                 + (s(3,1) * (s(1,2) * s(2,3) - s(2,2) * s(1,3))) );
  }
  for (let n = 0 ; n < 16 ; n++) dst.push(cofactor(n >> 2, n & 3));
  for (let n = 0 ; n <  4 ; n++) det += src[n] * dst[n << 2];
  for (let n = 0 ; n < 16 ; n++) dst[n] /= det;
  return dst;
}

function translate(matrix, x, y, z){
    let transformation_matrix = [1,0,0,0,  0,1,0,0,  0,0,1,0,  x,y,z,1];
    return multiply(transformation_matrix, matrix);
}

function rotateX(matrix, degrees){
    const radians = degrees * (180 / Math.PI);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    let transformation_matrix = [1,0,0,0,  0,cos,sin,0,  0,-1*sin,cos,0   ,0,0,0,1];
    // return matrix;
    return multiply(transformation_matrix, matrix);
}

function rotateY(matrix, degrees){
    const radians = degrees * (180 / Math.PI);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    let transformation_matrix = [cos,0,-1*sin,0,  0,1,0,0,  sin,0,cos,0,  0,0,0,1];
    return multiply(transformation_matrix, matrix);
}

function rotateZ(matrix, degrees){
    const radians = degrees * (180 / Math.PI);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    let transformation_matrix = [cos,sin,0,0,  -1*sin,cos,0,0,  0,0,1,0   ,0,0,0,1];
    return multiply(transformation_matrix, matrix);
}

function scale(matrix, x, y, z){
    let transformation_matrix = [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
    return multiply(transformation_matrix, matrix);
}


function identity(matrix){
    let transformation_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    return multiply(transformation_matrix, matrix);
}

function multiply(A, B){
    //simplyfying matrix multiplication since its always going to be a 4x4 and 4x1
    let ret_matrix = [0,0,0,0, 0,0,0,0,  0,0,0,0,  0,0,0,0];
    const stride = 4;
    for(let i = 0; i< 4; i++){
        for(let j = 0; j<4; j++){
            let temp = 0;
            //computing for ret_matrix[i + stride*j]
            for(let k = 0; k< 4; k++){
                temp = temp + A[i + stride*k]*B[stride*j + k];
            }
            ret_matrix[i+stride*j] = temp;
        }
    }
    return ret_matrix;
}


// NOTE: t is the elapsed time since system start in ms, but
// each world could have different rules about time elapsed and whether the time
// is reset after returning to the world
function onStartFrame(t, state) {

    let tStart = t;
    if (!state.tStart) {
        state.tStart = t;
        state.time = t;
    }

    let cursorValue = () => {
       let p = cursor.position(), canvas = MR.getCanvas();
       return [ p[0] / canvas.clientWidth * 2 - 1, 1 - p[1] / canvas.clientHeight * 2, p[2] ];
    }

    tStart = state.tStart;

    let now = (t - tStart);
    // different from t, since t is the total elapsed time in the entire system, best to use "state.time"
    state.time = now;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let time = now / 1000;

    gl.uniform3fv(state.uCursorLoc     , cursorValue());
    gl.uniform1f (state.uTimeLoc       , time);

    gl.uniform1f(state.uTimeLoc, time);
    gl.uniform3fv(state.uMaterialsLoc[0].ambient , [.0,.0,.0]);
    gl.uniform3fv(state.uMaterialsLoc[0].diffuse , [.1,.4,.2]);
    gl.uniform3fv(state.uMaterialsLoc[0].specular, [0.5,.5,.5]);
    gl.uniform1f(state.uMaterialsLoc[0].power   , 20);
    gl.uniform1f(state.uMaterialsLoc[0].reflection_factor   , .2);
    gl.uniform1f(state.uMaterialsLoc[0].refraction_factor   , 1.);
    gl.uniform1f(state.uMaterialsLoc[0].index_of_refrac   , 2.8);

    gl.uniform3fv(state.uMaterialsLoc[1].ambient , [.03,.03,.0]);
    gl.uniform3fv(state.uMaterialsLoc[1].diffuse , [0.1,.1,.0]);
    gl.uniform3fv(state.uMaterialsLoc[1].specular, [0.5,.5,.5]);
    gl.uniform1f(state.uMaterialsLoc[1].power   , 20);
    gl.uniform1f(state.uMaterialsLoc[1].reflection_factor   , .2);
    gl.uniform1f(state.uMaterialsLoc[1].refraction_factor   , 1.);
    gl.uniform1f(state.uMaterialsLoc[1].index_of_refrac   , 2.8);

    gl.uniform3fv(state.uMaterialsLoc[2].ambient , [.2,.0,.0]);
    gl.uniform3fv(state.uMaterialsLoc[2].diffuse , [0.8,.0,.0]);
    gl.uniform3fv(state.uMaterialsLoc[2].specular, [0.5,.5,.2]);
    gl.uniform1f(state.uMaterialsLoc[2].power   , 20);
    gl.uniform1f(state.uMaterialsLoc[2].reflection_factor   , .2);
    gl.uniform1f(state.uMaterialsLoc[2].refraction_factor   , 1.);
    gl.uniform1f(state.uMaterialsLoc[2].index_of_refrac   , 2.8);

    const identity_matrix = [1,0,0,0, 0,1,0,0, 0,0,1,0,  0,0,0,1];
    let octa_matrix = rotateZ(scale([1,0,0,0, 0,1,0,0, 0,0,1,0,  0,0,0,1], 0.5, 2, 2),time/100);
    // octa_matrix = translate(octa_matrix, 0, 0, 5);
    // console.log(octa_matrix);

    gl.uniform1f(state.uShapesLoc[0].type , 0);
    gl.uniform3fv(state.uShapesLoc[0].center , [.6,.7,4 - 2.*Math.sin(time)]);
    gl.uniform1f(state.uShapesLoc[0].radius, 0.37);
    gl.uniformMatrix4fv(state.uShapesLoc[0].matrix , false, identity_matrix);
    gl.uniformMatrix4fv(state.uShapesLoc[0].imatrix , false, inverse(identity_matrix));

    gl.uniform1f(state.uShapesLoc[1].type , 1);
    gl.uniform3fv(state.uShapesLoc[1].center , [-.4,.7,4.+2.*Math.sin(time)]);
    gl.uniform1f(state.uShapesLoc[1].radius, 0.3);
    gl.uniformMatrix4fv(state.uShapesLoc[1].matrix , false, identity_matrix);
    gl.uniformMatrix4fv(state.uShapesLoc[1].imatrix , false, inverse(identity_matrix));

    gl.uniform1f(state.uShapesLoc[2].type , 2);
    gl.uniform3fv(state.uShapesLoc[2].center , [-.4,.5+Math.sin(time),2.]);
    gl.uniform1f(state.uShapesLoc[2].radius, 0.3);
    gl.uniformMatrix4fv(state.uShapesLoc[2].matrix , false, octa_matrix);
    gl.uniformMatrix4fv(state.uShapesLoc[2].imatrix , false, inverse(octa_matrix));


    
    gl.enable(gl.DEPTH_TEST);
}

function onDraw(t, projMat, viewMat, state, eyeIdx) {
    const sec = state.time / 1000;

    const my = state;
  
    gl.uniformMatrix4fv(my.uModelLoc, false, new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-1,1]));
    gl.uniformMatrix4fv(my.uViewLoc, false, new Float32Array(viewMat));
    gl.uniformMatrix4fv(my.uProjLoc, false, new Float32Array(projMat));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function onEndFrame(t, state) {
}

export default function main() {
    const def = {
        name         : 'week4',
        setup        : setup,
        onStartFrame : onStartFrame,
        onEndFrame   : onEndFrame,
        onDraw       : onDraw,
    };

    return def;
}
