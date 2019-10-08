#version 300 es        // NEWER VERSION OF GLSL
precision highp float; // HIGH PRECISION FLOATS

uniform float uTime;   // TIME, IN SECONDS
in vec3 vPos;          // POSITION IN IMAGE
out vec4 fragColor;    // RESULT WILL GO HERE


struct Material {
      vec3  ambient;
      vec3  diffuse;
      vec3  specular;
      float power;
      float reflection_factor;
      float refraction_factor;
      float index_of_refrac;
};

struct Shape {
      float   type;   // 0 for sphere. 1,2,etc for other kinds of shapes.
      vec3  center;
      float radius;
      mat4 matrix;
      mat4 imatrix;
};

const int NS = 3; // Number of shapes in the scene
const int NL = 2; // Number of light sources in the scene
const float NULL = 100000.;

vec4 cube_half_space[6];
vec4 octahedron_half_space[8];
uniform Material uMaterials[NS];
uniform Shape uShapes[NS];
// Declarations of arrays for shapes, lights and phong shading:
vec3 Ldir[NL], Lcol[NL];

//normalizes a vector
vec3 normal(vec3 vector){
     float length = length(vector);
     return vec3(float(vector.x/length), float(vector.y/length), float(vector.z/length));
}

//returns the dot product of the normalized vectors
float directional_dot_product(vec3 vector_1, vec3 vector_2){
     return dot(normal(vector_1), normal(vector_2));
}

void fill_half_space_info(float radius, int shape_index){
    float neg_radius = -1.*radius;
    cube_half_space[0] = vec4(-1., 0., 0., neg_radius)*uShapes[shape_index].imatrix;
    cube_half_space[1] = vec4(1., 0., 0., neg_radius)*uShapes[shape_index].imatrix;
    cube_half_space[2] = vec4(0., -1., 0., neg_radius)*uShapes[shape_index].imatrix;
    cube_half_space[3] = vec4(0., 1., 0., neg_radius)*uShapes[shape_index].imatrix;
    cube_half_space[4] = vec4(0., 0., -1., neg_radius)*uShapes[shape_index].imatrix;
    cube_half_space[5] = vec4(0., 0., 1., neg_radius)*uShapes[shape_index].imatrix;

    float pos = 0.5773;
    float neg = -0.5773;
    octahedron_half_space[0] = vec4(neg, neg, neg, neg_radius)*uShapes[shape_index].imatrix;
    octahedron_half_space[1] = vec4(neg, neg, pos, neg_radius)*uShapes[shape_index].imatrix;
    octahedron_half_space[2] = vec4(neg, pos, neg, neg_radius)*uShapes[shape_index].imatrix;
    octahedron_half_space[3] = vec4(neg, pos, pos, neg_radius)*uShapes[shape_index].imatrix;
    octahedron_half_space[4] = vec4(pos, neg, neg, neg_radius)*uShapes[shape_index].imatrix;
    octahedron_half_space[5] = vec4(pos, neg, pos, neg_radius)*uShapes[shape_index].imatrix;
    octahedron_half_space[6] = vec4(pos, pos, neg, neg_radius)*uShapes[shape_index].imatrix;
    octahedron_half_space[7] = vec4(pos, pos, pos, neg_radius)*uShapes[shape_index].imatrix;
}

vec2 ray_trace_half_space(vec3 v, vec3 w, vec4 plane){
    float point_dot_product = dot(plane, vec4(v, 1.));
    float ray_dot_product = dot(plane, vec4(w, 0.));

    float neg_point_dot_product = -1.*point_dot_product;
    float t = neg_point_dot_product/ray_dot_product;
    return vec2(t, point_dot_product);
}

vec4 ray_shape_octahedron(vec3 v, vec3 w, int shape_index){
    vec3 v_altered = v- uShapes[shape_index].center;
    fill_half_space_info(uShapes[shape_index].radius, shape_index);
    float tmin = -1000.;
    float tmax = 1000.;
    vec2 temp;
    float temp_t;
    float pv;
    int min_i;
    int max_i;
    for(int i = 0;i < 8; i++){
        temp = ray_trace_half_space(v_altered, w, octahedron_half_space[i]);
        temp_t = temp.x;
        pv = temp.y;
        pv = temp.y;

        if(temp_t < 0. && pv > 0.){
            return vec4(NULL, NULL, NULL, NULL); //case 1 : ray has missed the space
        }else if(temp_t > 0. && pv > 0.){ 
            if(temp_t > tmin){      //case 2 : ray entering space at v + tw
                tmin = temp_t;
                min_i = i;
            }
        }
        else if(temp_t > 0. && pv < 0.){
            if(temp_t < tmax){
                tmax = temp_t;
                max_i = i; //case 3 : ray exiting space at v + tw
            }
        }else{
            //do nothing
        }
    }

    if(tmin <= tmax){
        return vec4(tmin, tmax, min_i, max_i);
    }else{
        return vec4(NULL, NULL, NULL, NULL);
    }
}

vec4 ray_shape_cube(vec3 v, vec3 w, int shape_index){
    vec3 v_altered = v- uShapes[shape_index].center;
    fill_half_space_info(uShapes[shape_index].radius, shape_index);
    float tmin = -1000.;
    float tmax = 1000.;
    vec2 temp;
    float temp_t;
    float pv;
    int min_i;
    int max_i;
    for(int i = 0;i < 6; i++){
        temp = ray_trace_half_space(v_altered, w, cube_half_space[i]);
        temp_t = temp.x;
        pv = temp.y;

        if(temp_t < 0. && pv > 0.){
            return vec4(NULL, NULL, NULL, NULL); //case 1 : ray has missed the space
        }else if(temp_t > 0. && pv > 0.){ 
            if(temp_t > tmin){      //case 2 : ray entering space at v + tw
                tmin = temp_t;
                min_i = i;
            }
        }
        else if(temp_t > 0. && pv < 0.){
            if(temp_t < tmax){
                tmax = temp_t;
                max_i = i; //case 3 : ray exiting space at v + tw
            }
        }else{
            //do nothing
        }
    }

    if(tmin <= tmax){
        return vec4(tmin, tmax, min_i, max_i);
    }else{
        return vec4(NULL, NULL, NULL, NULL);
    }
}

vec4 ray_shape_sphere(vec3 v, vec3 w, int shape_index){
    vec3 v_altered = v - uShapes[shape_index].center;
    float b = dot(w, v_altered);
    float discriminant = b*b - dot(v_altered, v_altered) + uShapes[shape_index].radius*uShapes[shape_index].radius;
    if(discriminant < 0.){
        return vec4(NULL, NULL, NULL, NULL);
    }
    float neg_root = -1.*(sqrt(discriminant) + dot(w, v_altered));
    float pos_root = sqrt(discriminant) - dot(w, v_altered);
    return vec4(neg_root, pos_root, 0., 0.);
}

vec3 specular_light(int light_index, int shape_index, vec3 surface, vec3 w, vec3 surface_normal){
    vec3 temp = 2.*dot(surface_normal, Ldir[light_index])*surface_normal - Ldir[light_index];
    float reflection_factor = max(0., pow(dot(-1.*w, temp), uMaterials[shape_index].power));
    return uMaterials[shape_index].specular*reflection_factor;
}

vec3 diffuse_light(int light_index, int shape_index, vec3 surface, vec3 surface_vector_normal){
    float diffuse_dot_product = max(0., dot(Ldir[light_index], surface_vector_normal));
    return diffuse_dot_product*Lcol[light_index]*uMaterials[shape_index].diffuse;
}


vec4 ray_shape(vec3 v, vec3 w, int shape_index){
    if(uShapes[shape_index].type == 0.){
        return ray_shape_sphere(v, w, shape_index);
    }else if(uShapes[shape_index].type == 1.){
        return ray_shape_cube(v, w, shape_index);
    }
    else if(uShapes[shape_index].type == 2.){
        return ray_shape_octahedron(v, w, shape_index);
    }
}

bool check_if_shape_is_blocking(vec3 surface, int shape_index, vec3 light){
    vec3 dir = normal(surface-light);
    float t = ray_shape(surface, light, shape_index).x;
    if(t == NULL || t < 0.001){
        return false;
    }else{
        return true;
    }
}

vec3 total_specular_light(int shape_index, vec3 surface, vec3 w, vec3 surface_normal){
    vec3 light = vec3(0., 0., 0.);
    bool skip_light = true;
    bool is_blocking = false;
    for(int i = 0; i < NL; i++){
        skip_light = false;
        for(int j = 0; j < NS; j++){
            if(j != shape_index){
                is_blocking = check_if_shape_is_blocking(surface, j, Ldir[i]);
                if(is_blocking == true){
                    skip_light = true;
                    break;
                }
            }
                    
        }
        if(is_blocking == false){
            light = light + specular_light(i, shape_index, surface, w, surface_normal);
        }
        
    }
    return light;
}

vec3 reflected_light(int shape_index, vec3 surface_point, vec3 surface_normal, vec3 w){
    
    vec3 reflected_w = normal(w-2.*dot(surface_normal, w)*surface_normal);
    //check if this reflected ray hits any other shape
    
    float temp_t;
    float min_t = NULL;
    int min_i;
    vec4 min_vec;
    vec4 temp_vec;
    for(int i = 0; i < NS; i++){
        temp_vec = ray_shape(surface_point, reflected_w, i);
       temp_t = temp_vec.x;
       if(temp_t > 0.001){
            if(min_t == NULL || temp_t < min_t){
                min_t = temp_t;
                min_i = i;
                min_vec = temp_vec;
            }
       }
    }
    if(min_t == NULL){
        return vec3(0., 0., 0.);
    }

    vec3 reflected_surface = surface_point + min_t*reflected_w;
    vec3 reflected_surface_normal;
    if(uShapes[min_i].type == 0.){
        reflected_surface_normal = normal(reflected_surface - uShapes[min_i].radius);
    }else if(uShapes[min_i].type == 1.){
        highp int front_surface_plane = int(min_vec.z);
        reflected_surface_normal = cube_half_space[front_surface_plane].xyz;
    }
    else if(uShapes[min_i].type == 2.){
        highp int front_surface_plane = int(min_vec.z);
        reflected_surface_normal = octahedron_half_space[front_surface_plane].xyz;
    }

    vec3 reflected_light = total_specular_light(min_i, reflected_surface, reflected_w, reflected_surface_normal);
    return uMaterials[min_i].reflection_factor*reflected_light;
}

vec3 refracted_light(int shape_index, vec3 surface_point, vec3 surface_normal, vec3 w){
    
    vec3 reflected_w = normal(w-2.*dot(surface_normal, w)*surface_normal);
    //check if this reflected ray hits any other shape
    
    float temp_t;
    float min_t = NULL;
    int min_i;
    vec4 min_vec;
    vec4 temp_vec;
    for(int i = 0; i < NS; i++){
        temp_vec = ray_shape(surface_point, reflected_w, i);
       temp_t = temp_vec.x;
       if(temp_t > 0.001){
            if(min_t == NULL || temp_t < min_t){
                min_t = temp_t;
                min_i = i;
                min_vec = temp_vec;
            }
       }
    }
    if(min_t == NULL){
        return vec3(0., 0., 0.);
    }

    vec3 reflected_surface = surface_point + min_t*reflected_w;
    vec3 reflected_surface_normal;
    if(uShapes[min_i].type == 0.){
        reflected_surface_normal = normal(reflected_surface - uShapes[min_i].radius);
    }else if(uShapes[min_i].type == 1.){
        highp int front_surface_plane = int(min_vec.z);
        reflected_surface_normal = cube_half_space[front_surface_plane].xyz;
    }
    else if(uShapes[min_i].type == 2.){
        highp int front_surface_plane = int(min_vec.z);
        reflected_surface_normal = octahedron_half_space[front_surface_plane].xyz;
    }

    vec3 reflected_light = total_specular_light(min_i, reflected_surface, reflected_w, reflected_surface_normal);
    return uMaterials[min_i].reflection_factor*reflected_light;
}

vec3 shade_pixel(vec3 v, vec3 w){
    vec4 temp;
    vec4 min_vec;
    float min_t = NULL;
    int min_i = -1;
    for(int i = 0; i < NS; i++){
        temp = ray_shape(v, w, i);
        if(temp.x == NULL){
            continue;
        }else{
            if(min_t == NULL || temp.x < min_t){
                min_t = temp.x;
                min_i = i;
                min_vec = temp;
            }
        }
    }

    if(min_t == NULL){
        return vec3(0.0, 0.0, 0.0);
    }

    vec3 surface = v + min_t*w;
    vec3 surface_normal;
    if(uShapes[min_i].type == 0.){
        surface_normal = normal(surface - uShapes[min_i].radius);
    }else if(uShapes[min_i].type == 1.){
        highp int front_surface_plane = int(min_vec.z);
        surface_normal = cube_half_space[front_surface_plane].xyz;
    }
    else if(uShapes[min_i].type == 2.){
        highp int front_surface_plane = int(min_vec.z);
        surface_normal = octahedron_half_space[front_surface_plane].xyz;
    }
    
    vec3 total_light = uMaterials[min_i].ambient;
    bool skip_light = false;
    bool is_blocking = false;
    for(int i = 0; i< NL; i++){
        skip_light = false;
        for(int j = 0; j < NS; j++){
            if(j != min_i){
               is_blocking = check_if_shape_is_blocking(surface, j, Ldir[i]);
                if(is_blocking == true){
                    skip_light = true;
                    break;
                }    
            }
                
        }

        if(skip_light == false){
            total_light = total_light + diffuse_light(i, min_i, surface, surface_normal);
            total_light = total_light + specular_light(i, min_i,surface,w, surface_normal);
            total_light = total_light + reflected_light(i, surface, surface_normal, w);
        } 
    }
    return total_light;
}

void main() {


    Ldir[1] = normalize(vec3(-1.,1.,0.));
    Lcol[1] = vec3(1.,1.,1.);

    Ldir[0] = normalize(vec3(1.,1.,0.));
    Lcol[0] = vec3(1.,1.,1.);

    float fl = -5.;

    vec3 v = vec3(0., 0., fl);
    vec3 w = vec3(vPos.x, vPos.y, -1.*fl);
    vec3 w_normal = normal(w);
    vec3 light = shade_pixel(v, w_normal);
    fragColor = vec4(sqrt(light), 1.0);
}