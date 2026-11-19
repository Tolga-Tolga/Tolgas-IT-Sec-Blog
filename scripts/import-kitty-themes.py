import argparse
import json
from pathlib import Path
import re
import shutil


ROOT = Path(__file__).resolve().parent.parent
# Defaults from kitty v0.50.0, kitty/options/definition.py.
DEFAULT_ANSI = "#000000 #cc0403 #19cb00 #cecb00 #0d73cc #cb1ed1 #0dcdcd #dddddd".split()
DEFAULT_COLORS = {"background": "#000000", "foreground": "#dddddd"}
DEFAULT_COLORS.update({f"color{i}": color for i, color in enumerate(DEFAULT_ANSI)})


def read_palette(path):
    colors = DEFAULT_COLORS.copy()
    for line in path.read_text(encoding="utf-8").splitlines():
        color = re.match(r"\s*(background|foreground|color[0-7])\s+(\S+)", line)
        if color:
            name, value = color.groups()
            if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
                raise ValueError(f"{path}: unsupported color {value}")
            colors[name] = value.lower()
    return colors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("revision")
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.revision):
        parser.error("revision must be a full Git commit SHA")

    index = json.loads((args.source / "themes.json").read_text(encoding="utf-8"))
    themes = []
    for entry in index:
        path = args.source / entry["file"]
        palette = read_palette(path)
        themes.append({
            "id": path.stem,
            "name": entry["name"],
            "background": palette["background"],
            "foreground": palette["foreground"],
            "ansi": [palette[f"color{i}"] for i in range(8)],
        })
    catalog = {"source": f"https://github.com/kovidgoyal/kitty-themes/tree/{args.revision}", "themes": themes}
    (ROOT / "assets/kitty-themes.json").write_text(
        json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )

    license_path = ROOT / "static/licenses/kitty-themes.txt"
    license_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(args.source / "LICENSE", license_path)
    print(f"Imported {len(themes)} Kitty themes.")


if __name__ == "__main__":
    main()
