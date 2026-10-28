"""Build static SVG expressions from one approved portrait and facial overrides."""
import argparse
import copy
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)
LAYERS = {name: f"expression-{name}" for name in ("brows", "eyes", "mouth")}


def portraits(recipe_path):
    recipe = json.loads(recipe_path.read_text(encoding="utf-8"))
    if set(recipe) != {"name", "base", "expressions"}:
        raise ValueError("Recipe requires only name, base and expressions")
    if not isinstance(recipe["name"], str) or not recipe["name"].strip():
        raise ValueError("Character name is required")
    base = ET.parse(recipe_path.parent / recipe["base"]).getroot()
    expressions = recipe["expressions"]
    if not isinstance(expressions, dict) or "neutral" not in expressions:
        raise ValueError("Expressions must include neutral")
    for name, layer_id in LAYERS.items():
        if len(base.findall(f".//{{{SVG}}}g[@id='{layer_id}']")) != 1:
            raise ValueError(f"Base requires exactly one {name} layer")
    results = {}
    for expression, changes in expressions.items():
        if not re.fullmatch(r"[a-z][a-z0-9-]*", expression) or not isinstance(changes, dict):
            raise ValueError("Invalid expression identifier or overrides")
        root = copy.deepcopy(base)
        for layer_name, shapes in changes.items():
            if layer_name not in LAYERS:
                raise ValueError(f"Unsupported expression layer: {layer_name}")
            if not isinstance(shapes, list) or not 1 <= len(shapes) <= 32:
                raise ValueError(f"Invalid shapes for {layer_name}")
            layer = root.find(f".//{{{SVG}}}g[@id='{LAYERS[layer_name]}']")
            for child in list(layer):
                layer.remove(child)
            for shape in shapes:
                if not isinstance(shape, dict) or set(shape) != {"fill", "d"}:
                    raise ValueError("Shapes require only fill and d")
                if not isinstance(shape["fill"], str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", shape["fill"]):
                    raise ValueError("Shape fill must be a six-digit hex color")
                if not isinstance(shape["d"], str) or not re.fullmatch(r"[MmLlHhVvZz0-9,\s-]+", shape["d"]):
                    raise ValueError("Shape paths must use integer pixel lines")
                ET.SubElement(layer, f"{{{SVG}}}path", shape)
        root.set("data-expression", expression)
        title = root.find(f"{{{SVG}}}title")
        if title is not None:
            title.text = f"{recipe['name']} — {expression}"
        ET.indent(root, space="  ")
        results[f"{expression}.svg"] = ET.tostring(root, encoding="unicode") + "\n"
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--recipe", required=True, type=Path, help="JSON recipe; base SVG path is relative to it")
    parser.add_argument("--out", required=True, type=Path, help="Directory for generated expression SVGs")
    args = parser.parse_args()
    try:
        # Validate and build every result before touching existing output files.
        results = portraits(args.recipe)
    except (OSError, ValueError, TypeError, KeyError, ET.ParseError) as error:
        parser.error(str(error))
    args.out.mkdir(parents=True, exist_ok=True)
    for name, svg in results.items():
        (args.out / name).write_text(svg, encoding="utf-8")
        print(name)


if __name__ == "__main__":
    main()
