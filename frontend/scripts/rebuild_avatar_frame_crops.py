#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image


ASSETS_ROOT = Path(__file__).resolve().parents[1] / "public" / "assets"
SKIP_PHILOSOPHERS = {"camus"}

REGIONS = {
    "bust-neutral": (0.00, 0.00, 0.39, 1.00),
    "bust-active": (0.39, 0.00, 0.76, 1.00),
    "icon-panel": (0.75, 0.00, 1.00, 0.52),
}


def gold_border_mask(rgb: np.ndarray) -> np.ndarray:
    red = rgb[:, :, 0]
    green = rgb[:, :, 1]
    blue = rgb[:, :, 2]
    return (
        (red > 110)
        & (green > 75)
        & (blue < 95)
        & ((red - blue) > 35)
        & ((green - blue) > 15)
    )


def frame_bbox(mask: np.ndarray, region: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
    height, width = mask.shape
    x0 = int(width * region[0])
    y0 = int(height * region[1])
    x1 = int(width * region[2])
    y1 = int(height * region[3])
    submask = mask[y0:y1, x0:x1]
    ys, xs = np.where(submask)
    if ys.size == 0 or xs.size == 0:
        raise RuntimeError(f"no gold frame detected in region {region}")
    return x0 + int(xs.min()), y0 + int(ys.min()), x0 + int(xs.max()) + 1, y0 + int(ys.max()) + 1


def square_icon_panel(panel: Image.Image, background_rgb: tuple[int, int, int], size: int = 512) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), background_rgb + (255,))
    scale = min(size / panel.width, size / panel.height)
    scaled = panel.resize(
        (int(round(panel.width * scale)), int(round(panel.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas.alpha_composite(scaled, ((size - scaled.width) // 2, (size - scaled.height) // 2))
    return canvas


def rebuild_avatar_assets(philosopher: str) -> None:
    avatar_dir = ASSETS_ROOT / philosopher / "avatar"
    sheet_path = avatar_dir / "sheet.png"
    sheet = Image.open(sheet_path).convert("RGBA")
    rgb = np.array(sheet.convert("RGB"))
    mask = gold_border_mask(rgb)
    background_rgb = tuple(int(v) for v in rgb[0, 0])

    neutral_box = frame_bbox(mask, REGIONS["bust-neutral"])
    active_box = frame_bbox(mask, REGIONS["bust-active"])
    icon_box = frame_bbox(mask, REGIONS["icon-panel"])

    neutral = sheet.crop(neutral_box)
    active = sheet.crop(active_box)
    icon_panel = sheet.crop(icon_box)
    icon_master = square_icon_panel(icon_panel, background_rgb)

    neutral.save(avatar_dir / "bust-neutral.png")
    active.save(avatar_dir / "bust-active.png")
    icon_master.save(avatar_dir / "icon-master.png")
    icon_master.resize((256, 256), Image.Resampling.LANCZOS).save(avatar_dir / "icon-256.png")
    icon_master.resize((128, 128), Image.Resampling.LANCZOS).save(avatar_dir / "icon-128.png")
    icon_master.resize((64, 64), Image.Resampling.LANCZOS).save(avatar_dir / "icon-64.png")


def main() -> None:
    for philosopher_dir in sorted(ASSETS_ROOT.iterdir()):
        if not philosopher_dir.is_dir() or philosopher_dir.name in SKIP_PHILOSOPHERS:
            continue
        avatar_dir = philosopher_dir / "avatar"
        sheet_path = avatar_dir / "sheet.png"
        if not sheet_path.exists():
            continue
        rebuild_avatar_assets(philosopher_dir.name)
        print(f"rebuilt avatar crops for {philosopher_dir.name}")


if __name__ == "__main__":
    main()
