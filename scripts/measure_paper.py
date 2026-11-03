#!/usr/bin/env python3
"""Measure whether dark 'content' pixels leak outside the torn-paper silhouette.

Metrics (pure numpy/PIL):
  out_ink   - count of ink pixels (text/buttons/icons) farther than 2px from
              any paper pixel. >0 means content visibly escapes the paper.
  rows_bad  - rows where ink extends beyond the paper's row envelope by >4px.
  gap stats - for the widest paper region ("hero"), the distribution of paper
              edge margin next to content.
"""
import sys
import numpy as np
from PIL import Image

PAPER = np.array([251, 246, 233])  # --paper-2 #fbf6e9
TOL = 16


def dilate(mask, r=2):
    m = mask.copy()
    for _ in range(r):
        padded = np.pad(m, 1, mode="edge")
        # (H+2, W+2); crop center shifts to perform 8-neighborhood max
        center = padded[1:-1, 1:-1]
        m = (
            center
            | padded[:-2, 1:-1] | padded[2:, 1:-1]
            | padded[1:-1, :-2] | padded[1:-1, 2:]
            | padded[:-2, :-2] | padded[:-2, 2:]
            | padded[2:, :-2] | padded[2:, 2:]
        )
    return m


def main(path):
    img = np.array(Image.open(path).convert("RGB")).astype(int)
    H, W, _ = img.shape
    paper = np.all(np.abs(img - PAPER) <= TOL, axis=-1)
    ink = np.all(img < 150, axis=-1)
    dil = dilate(paper, 2)
    outside_ink = int((ink & ~dil).sum())
    print(f"{path}: {W}x{H} paper_px={paper.sum()} ink_px={ink.sum()} "
          f"out_ink(>2px outside paper)={outside_ink}")

    # row envelopes: paper left/right extremes per row
    cols = np.arange(W)
    prow = paper.any(axis=1)
    rows_bad = 0
    bad_examples = []
    for y in np.where(prow)[0]:
        pcols = cols[paper[y]]
        pL, pR = pcols.min(), pcols.max()
        icols = cols[ink[y]]
        if len(icols) == 0:
            continue
        iL, iR = icols.min(), icols.max()
        if pR - pL < 180:  # small blobs (chips etc.) - skip in envelope check
            continue
        if iL < pL - 4 or iR > pR + 4:
            rows_bad += 1
            if len(bad_examples) < 5:
                bad_examples.append((y, pL, pR, iL, iR))
    print(f"rows where ink escapes paper envelope: {rows_bad}")
    for e in bad_examples:
        print("   row", e)

    # hero = widest connected band of paper rows; measure vertical margins
    ys = np.where(prow)[0]
    if len(ys) == 0:
        return
    # split into runs of consecutive rows
    splits = np.where(np.diff(ys) > 3)[0] + 1
    bands = np.split(ys, splits)
    hero = max(bands, key=lambda b: (paper[b].sum(axis=1) > 0).sum())
    y0, y1 = hero[0], hero[-1]
    hcols = cols[(paper[y0:y1 + 1].sum(axis=0) > 0)]
    print(f"hero-ish paper band y={y0}..{y1} (h={y1-y0}px) x={hcols.min()}..{hcols.max()}")


if __name__ == "__main__":
    main(sys.argv[1])