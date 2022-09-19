// reproduction of Deny IV of Bridget Riley
// https://collections.artsmia.org/art/2573/deny-iv-bridget-riley

uniform vec2 u_resolution;
uniform float u_time;

#define PI 3.14159265359

mat2 rotate2d(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float rectSDF(vec2 st, vec2 s) { return max(abs(st.x / s.x), abs(st.y / s.y)); }

float random(in vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise(in vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  // Four corners in 2D of a tile
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  // Smooth Interpolation

  // Cubic Hermine Curve.  Same as SmoothStep()
  vec2 u = f * f * (3.0 - 2.0 * f);
  // u = smoothstep(0.,1.,f);

  // Mix 4 coorners percentages
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// https://www.shadertoy.com/view/4sS3zz
float ellipseSDF(in vec2 p, in vec2 ab) {
  p = abs(p);
  if (p.x > p.y) {
    p = p.yx;
    ab = ab.yx;
  }
  float l = ab.y * ab.y - ab.x * ab.x;
  float m = ab.x * p.x / l;
  float m2 = m * m;
  float n = ab.y * p.y / l;
  float n2 = n * n;
  float c = (m2 + n2 - 1.0) / 3.0;
  float c3 = c * c * c;
  float q = c3 + m2 * n2 * 2.0;
  float d = c3 + m2 * n2;
  float g = m + m * n2;
  float co;
  if (d < 0.0) {
    float h = acos(q / c3) / 3.0;
    float s = cos(h);
    float t = sin(h) * sqrt(3.0);
    float rx = sqrt(-c * (s + t + 2.0) + m2);
    float ry = sqrt(-c * (s - t + 2.0) + m2);
    co = (ry + sign(l) * rx + abs(g) / (rx * ry) - m) / 2.0;
  } else {
    float h = 2.0 * m * n * sqrt(d);
    float s = sign(q + h) * pow(abs(q + h), 1.0 / 3.0);
    float u = sign(q - h) * pow(abs(q - h), 1.0 / 3.0);
    float rx = -s - u - c * 4.0 + 2.0 * m2;
    float ry = (s - u) * sqrt(3.0);
    float rm = sqrt(rx * rx + ry * ry);
    co = (ry / sqrt(rm - rx) + 2.0 * g / rm - m) / 2.0;
  }
  vec2 r = ab * vec2(co, sqrt(1.0 - co * co));
  return length(r - p) * sign(p.y - r.y);
}

void main() {
  vec2 st = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);

  float loop = 10.;
  float t = mod(u_time, loop);

  float tiles = 23.;
  vec2 t_st = st * tiles;
  vec2 f_st = fract(t_st);
  vec2 i_st = floor(t_st);

  vec2 pos = f_st - .5;
  float a = mix(-PI / 2., PI / 2., noise(i_st / 6. + abs(loop / 2. - t)));
  pos = rotate2d(a) * pos;

  mat2 tilt = rotate2d(PI / 4.);

  float ellipse = 1. - smoothstep(0.05, .1, ellipseSDF(pos, vec2(.2, .1)));
  if (1. < rectSDF(tilt * (i_st - (tiles - 1.) / 2.), vec2(tiles / 3.)))
    ellipse = 0.;

  vec3 backgroundColor = vec3(.57, .6, .61);
  vec3 waveColor = backgroundColor * 1.03;

  float wy = 3. * sin(.5 * i_st.y - .9);
  float wave = .12 * min((i_st.x - 3.) - wy, wy - (i_st.x - 24.));

  vec3 ellipseColor = vec3(1.);
  ellipseColor = mix(ellipseColor, waveColor, clamp(wave, 0., 1.));

  float frame = rectSDF(tilt * (st - .5), vec2(.52));

  vec3 col = max(backgroundColor, ellipseColor * ellipse);
  if (frame > .65)
    col = vec3(.0);
  if (frame > .654)
    col = vec3(.78, .59, .38);
  if (frame > .659)
    col = vec3(1.);

  gl_FragColor = vec4(col, 1.);
}
