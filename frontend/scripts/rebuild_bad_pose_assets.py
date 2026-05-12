#!/usr/bin/env python3

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi


ASSETS_ROOT = Path(__file__).resolve().parents[1] / "public" / "assets"
STATE_ORDER = ["listening", "weighing", "challenging", "monologue", "settling"]

REBUILD_POSES: dict[str, list[str]] = {
    "kafka": STATE_ORDER[:],
    "dostoevsky": STATE_ORDER[:],
    "hemingway": STATE_ORDER[:],
    "thompson": STATE_ORDER[:],
    "nietzsche": STATE_ORDER[:],
    "jung": STATE_ORDER[:],
    "twain": STATE_ORDER[:],
    "austen": STATE_ORDER[:],
    "plath": STATE_ORDER[:],
    "carlin": STATE_ORDER[:],
    "socrates": STATE_ORDER[:],
    "freud": STATE_ORDER[:],
}


@dataclass(frozen=True)
class PoseTuning:
    overlap_left_ratio: float = 0.18
    overlap_right_ratio: float = 0.18
    center_band_ratio: float = 0.34
    center_score_band_ratio: float = 0.22
    row_fill_start_ratio: float = 0.34
    shadow_trim_start_ratio: float = 0.84


TUNING_OVERRIDES: dict[tuple[str, str], PoseTuning] = {
    # These two states were still pulling pixels from the neighboring lane.
    ("nietzsche", "weighing"): PoseTuning(
        overlap_left_ratio=0.14,
        overlap_right_ratio=0.06,
        center_band_ratio=0.28,
        center_score_band_ratio=0.18,
    ),
    ("carlin", "challenging"): PoseTuning(
        overlap_left_ratio=0.14,
        overlap_right_ratio=0.06,
        center_band_ratio=0.30,
        center_score_band_ratio=0.20,
    ),
    ("thompson", "challenging"): PoseTuning(
        overlap_left_ratio=0.10,
        overlap_right_ratio=0.02,
        center_band_ratio=0.26,
        center_score_band_ratio=0.16,
    ),
    ("twain", "challenging"): PoseTuning(
        overlap_left_ratio=0.14,
        overlap_right_ratio=0.06,
        center_band_ratio=0.30,
        center_score_band_ratio=0.20,
    ),
}


def bg_mask(height: int, width: int) -> np.ndarray:
    mask = np.zeros((height, width), dtype=bool)
    top = max(10, int(height * 0.12))
    side = max(10, int(width * 0.06))
    bottom = max(10, int(height * 0.06))
    mask[:top, :] = True
    mask[:, :side] = True
    mask[:, width - side :] = True
    mask[height - bottom :, :] = True
    return mask


def extract_pose_from_sheet(
    sheet_path: Path, philosopher: str, state: str, tuning: PoseTuning
) -> tuple[Image.Image, Image.Image]:
    sheet = np.array(Image.open(sheet_path).convert("RGB")).astype(np.float32)
    height, width, _ = sheet.shape
    lane_width = width / len(STATE_ORDER)
    lane_index = STATE_ORDER.index(state)

    left_overlap = int(round(lane_width * tuning.overlap_left_ratio))
    right_overlap = int(round(lane_width * tuning.overlap_right_ratio))
    lane_left = max(0, int(round(lane_index * lane_width)) - left_overlap)
    lane_right = min(width, int(round((lane_index + 1) * lane_width)) + right_overlap)
    lane = sheet[:, lane_left:lane_right]

    lane_height, lane_width_px, _ = lane.shape
    median_bg = np.median(lane[bg_mask(lane_height, lane_width_px)], axis=0)
    diff = np.sqrt(((lane - median_bg) ** 2).sum(axis=2))
    gray = lane.mean(axis=2)
    grad = np.hypot(ndi.sobel(gray, axis=0), ndi.sobel(gray, axis=1))

    nominal_center = (lane_index + 0.5) * lane_width - lane_left
    columns = np.arange(lane_width_px)[None, :]
    center_band = (columns > nominal_center - lane_width * tuning.center_band_ratio) & (
        columns < nominal_center + lane_width * tuning.center_band_ratio
    )

    seed = ((diff > 30) | (gray > 52) | (grad > 26)) & center_band
    soft = (diff > 9) | ((gray > 13) & (grad > 4)) | (grad > 11)
    soft |= center_band & (diff > 7)

    mask = ndi.binary_propagation(seed, mask=soft)
    mask = ndi.binary_closing(mask, structure=np.ones((9, 9), dtype=bool))
    mask = ndi.binary_fill_holes(mask)

    labels, count = ndi.label(mask)
    if count == 0:
        raise RuntimeError(f"no foreground component found for {philosopher}/{state}")

    best_label = 1
    best_score = -1
    score_band = (columns > nominal_center - lane_width * tuning.center_score_band_ratio) & (
        columns < nominal_center + lane_width * tuning.center_score_band_ratio
    )
    for label in range(1, count + 1):
        component = labels == label
        ys, xs = np.where(component)
        if xs.size == 0:
            continue
        overlap_score = score_band[0, xs].sum()
        score = int(overlap_score) * 5 + int(xs.size)
        if score > best_score:
            best_label = label
            best_score = score
    mask = labels == best_label

    ys, xs = np.where(mask)
    top, bottom = ys.min(), ys.max()
    fill_start = int(top + (bottom - top) * tuning.row_fill_start_ratio)
    for row_index in range(fill_start, bottom + 1):
        row = np.where(mask[row_index])[0]
        if row.size < 3:
            continue
        left, right = row.min(), row.max()
        row_fill = (diff[row_index] > 4) | (gray[row_index] > 8)
        mask[row_index, left : right + 1] |= row_fill[left : right + 1]

    mask = ndi.binary_fill_holes(mask)
    mask = ndi.binary_dilation(mask, iterations=1)

    ys, xs = np.where(mask)
    top, bottom = ys.min(), ys.max()
    box_height = bottom - top + 1
    shadow_trim_start = int(top + box_height * tuning.shadow_trim_start_ratio)
    support_kernel = np.ones(17, dtype=bool)
    for row_index in range(shadow_trim_start, bottom + 1):
        previous_row = mask[max(row_index - 1, top)]
        support = ndi.binary_dilation(previous_row, structure=support_kernel)
        extra = mask[row_index] & ~support
        low_signal = (diff[row_index] < 14) & (gray[row_index] < 24)
        mask[row_index, extra & low_signal] = False

    ys, xs = np.where(mask)
    pad_x = max(12, int((xs.max() - xs.min() + 1) * 0.06))
    pad_y = max(12, int((ys.max() - ys.min() + 1) * 0.05))
    crop_left = max(0, xs.min() - pad_x)
    crop_right = min(lane_width_px, xs.max() + pad_x + 1)
    crop_top = max(0, ys.min() - pad_y)
    crop_bottom = min(lane_height, ys.max() + pad_y + 1)

    rgb_crop = lane[crop_top:crop_bottom, crop_left:crop_right].astype(np.uint8)
    alpha = mask[crop_top:crop_bottom, crop_left:crop_right].astype(np.float32) * 255
    alpha = np.clip(ndi.gaussian_filter(alpha, 0.6), 0, 255).astype(np.uint8)
    rgba_crop = np.dstack([rgb_crop, alpha])

    return Image.fromarray(rgb_crop, mode="RGB"), Image.fromarray(rgba_crop, mode="RGBA")


def rebuild_pose(philosopher: str, state: str) -> None:
    actor_dir = ASSETS_ROOT / philosopher / "actor"
    tuning = TUNING_OVERRIDES.get((philosopher, state), PoseTuning())
    sheet_path = actor_dir / "pose-sheet.png"
    source, cutout = extract_pose_from_sheet(sheet_path, philosopher, state, tuning)
    source.save(actor_dir / state / "master-source.png")
    cutout.save(actor_dir / state / "master-cutout.png")


def main() -> None:
    for philosopher, states in REBUILD_POSES.items():
        for state in states:
            rebuild_pose(philosopher, state)
            print(f"rebuilt {philosopher}/{state}")


if __name__ == "__main__":
    main()
