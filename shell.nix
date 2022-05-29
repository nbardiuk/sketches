with import <nixpkgs> {};
with pkgs;
stdenv.mkDerivation {
  name = "dev_shell";
  buildInputs = [
    glslviewer
  ];
}
