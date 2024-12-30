{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    ags,
  }: let
    systems = ["x86_64-linux" "aarch64-linux"];
    forEachSystem = nixpkgs.lib.genAttrs systems;
    extraAgsPackages = system: (with ags.packages.${system}; [
      tray
      hyprland
      apps
      battery
      bluetooth
      mpris
      cava
      network
      notifd
      powerprofiles
      wireplumber
    ]);
    extraSysPackages = pkgs: (with pkgs; [
      fish
      typescript
      libnotify
      dart-sass
      fd
      btop
      bluez
      libgtop
      gobject-introspection
      glib
      bluez-tools
      grimblast
      brightnessctl
      gnome-bluetooth
      (python3.withPackages (
        ps:
          with ps; [
            gpustat
            dbus-python
            pygobject3
          ]
      ))
      matugen
      hyprpicker
      hyprsunset
      hypridle
      wireplumber
      networkmanager
      wf-recorder
      upower
      gvfs
      swww
      pywal
    ]);
    extraPackages = system: pkgs: (extraAgsPackages system) ++ (extraSysPackages pkgs);
  in {
    packages = forEachSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
      in rec {
        hyprpanel-unwrapped = ags.lib.bundle {
          inherit pkgs;
          src = ./.;
          name = "hyprpanel"; # name of executable
          entry = "app.ts";
          extraPackages = extraPackages system pkgs;
        };

        hyprpanel = pkgs.writeShellScriptBin "hyprpanel" ''
          if [ "$#" -eq 0 ]; then
              exec ${hyprpanel-unwrapped}/bin/hyprpanel
          else
              exec ${ags.packages.${system}.io}/bin/astal -i hyprpanel "$*"
          fi
        '';

        default = hyprpanel;
      }
    );

    # Define .overlay to expose the package as pkgs.hyprpanel based on the system
    overlay = final: prev: {
      hyprpanel = self.packages.${final.stdenv.system}.default;
    };

    homeManagerModules.hyprpanel = import ./nix/module.nix self;

    devShells = forEachSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs
            ags.packages.${system}.agsFull
            ags.packages.${system}.io
          ];
          shellHook = ''
            export GI_TYPELIB_PATH=${pkgs.lib.makeSearchPath "lib/girepository-1.0" (extraPackages system pkgs)}

            ln -sfn ${ags.packages.${system}.gjs}/share/astal/gjs astal

            # 检查目录是否存在
            if [ ! -d "@girs" ]; then
                echo "@girs 目录不存在，生成中..."
                # 这里需要使用agsFull来生成所有type
                ${pkgs.lib.getExe ags.packages.${system}.agsFull} types -d .
            fi

            echo -e '使用 \x1b[34mags run -d . \x1b[0m来运行当前项目'
          '';
        };
      }
    );
  };
}
