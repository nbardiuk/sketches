// Credit:
// https://www.shadertoy.com/view/ttXBzB
// by Martijn Steinrucken aka BigWings/CountFrolic - 2020
// License https://creativecommons.org/licenses/by-nc-sa/3.0
//
// Animation of Escher Spirals
// https://www.wikiart.org/en/m-c-escher/spirals

uniform vec2 u_resolution;
uniform float u_time;

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .001

mat3 rotate3d(in vec3 axis, in float radians) {
  axis = normalize(axis);
  float s = sin(radians);
  float c = cos(radians);
  float oc = 1.0 - c;

  return mat3(oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s,
              oc * axis.z * axis.x + axis.y * s,
              oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c,
              oc * axis.y * axis.z - axis.x * s,
              oc * axis.z * axis.x - axis.y * s,
              oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c);
}

float spiral(in vec3 p, in float torus_thickness, in float faze) {
  float df = u_time * .1;
  float f0 = 1. / 5. * faze + df;
  float f1 = 2. / 5. * faze + df;
  float f2 = 3. / 5. * faze + df;
  float f3 = 4. / 5. * faze + df;
  float torus_radius = 1.;
  float torus_circle = length(vec2(length(p.xz) - torus_radius, p.y));
  float fr = 3.;
  float a = atan(p.x, p.z);
  torus_thickness *= 1. + .6 * sin(.5 * a);

  vec3 c = torus_radius * vec3(sin(a), 0., cos(a));
  vec3 b = vec3(c.z, 0., -c.x); // c rot 90 in xz plane
  vec3 r = torus_thickness * vec3(sin(a), 0., cos(a));
  vec3 s0 = c + r * rotate3d(b, fr * (a + f0));
  vec3 s1 = c + r * rotate3d(b, fr * (a + f1));
  vec3 s2 = c + r * rotate3d(b, fr * (a + f2));
  vec3 s3 = c + r * rotate3d(b, fr * (a + f3));
  float pc = length(p - c);
  float d = min(p.y + 1.2,
                max(max(-(pc - torus_thickness * .9), pc - torus_thickness),
                    min(min(length(p - s0), length(p - s1)),
                        min(length(p - s2), length(p - s3))) -
                        torus_thickness * .4));
  return d;
}

float GetDist(in vec3 p) {
  float faze = 2.6;
  return min(spiral(p, .4, faze), spiral(p, .1, faze)) * .4;
}

float RayMarch(vec3 ro, vec3 rd) {
  float dO = 0.;

  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * dO;
    float dS = GetDist(p);
    dO += dS;
    if (dO > MAX_DIST || abs(dS) < SURF_DIST)
      break;
  }

  return dO;
}

vec3 GetNormal(vec3 p) {
  float d = GetDist(p);
  vec2 e = vec2(.001, 0);

  vec3 n = d - vec3(GetDist(p - e.xyy), GetDist(p - e.yxy), GetDist(p - e.yyx));

  return normalize(n);
}

vec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z) {
  vec3 f = normalize(l - p), r = normalize(cross(vec3(0, 1, 0), f)),
       u = cross(f, r), c = f * z, i = c + uv.x * r + uv.y * u,
       d = normalize(i);
  return d;
}

float GetLight(vec3 p) {
  vec3 lightPos = vec3(-30., 0., -5.);
  vec3 l = normalize(lightPos - p);
  vec3 n = GetNormal(p);

  float dif = clamp(dot(n, l) * .5 + .5, 0., 1.);
  float d = RayMarch(p + n * SURF_DIST * 2., l);
  if (p.y < .01 && d < length(lightPos - p))
    dif *= .5;

  return dif;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / u_resolution.y;

  vec3 col = vec3(0);

  vec3 ro = vec3(2., 3., -2.);

  vec3 rd = GetRayDir(uv, ro, vec3(0), 1.);

  float d = RayMarch(ro, rd);
  if (d < MAX_DIST) {
    vec3 p = ro + rd * d;
    vec3 n = GetNormal(p);
    float dif = dot(n, normalize(vec3(-10., -2., 5.))) * .5 + .5;
    col = vec3(dif);
  }

  col = pow(col, vec3(.4545)); // gamma correction

  gl_FragColor = vec4(col, 1.);
}
