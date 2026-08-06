#!/usr/bin/env python3
"""
Generate all PWA icons + iOS splash screens for TENANGIN from the source
logo (public/brand/logo-mark.png).

Run: python3 scripts/gen-pwa-assets.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_LOGO = os.path.join(ROOT, "public", "brand", "logo-mark.png")
ICONS_DIR = os.path.join(ROOT, "public", "icons")
SPLASH_DIR = os.path.join(ROOT, "public", "splash")

SAND = (250, 246, 240)  # #FAF6F0 -- background_color / theme_color TENANGIN
TEAL = (18, 60, 66)     # dekat warna --teal, dipakai untuk wordmark splash

os.makedirs(ICONS_DIR, exist_ok=True)
os.makedirs(SPLASH_DIR, exist_ok=True)

logo = Image.open(SRC_LOGO).convert("RGBA")


def make_icon(size: int, padding_ratio: float, bg=SAND, transparent=False):
    """Render the logo centered on a square canvas of `size`px."""
    canvas_mode = "RGBA" if transparent else "RGB"
    canvas_bg = (0, 0, 0, 0) if transparent else bg
    canvas = Image.new(canvas_mode, (size, size), canvas_bg)
    inner = int(size * (1 - padding_ratio * 2))
    resized = logo.resize((inner, inner), Image.LANCZOS)
    offset = ((size - inner) // 2, (size - inner) // 2)
    if transparent:
        canvas.alpha_composite(resized, offset)
    else:
        canvas.paste(resized, offset, resized)
    return canvas


def save(img: Image.Image, path: str):
    img.save(path)
    print("wrote", os.path.relpath(path, ROOT))


# ---------------------------------------------------------------------------
# 1) Icon "any" (Android / Chrome / Windows / general use) -- tight padding,
#    matches the existing brand icon look.
# ---------------------------------------------------------------------------
ANY_SIZES = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512]
for s in ANY_SIZES:
    save(make_icon(s, padding_ratio=0.055), os.path.join(ICONS_DIR, f"icon-{s}.png"))

# ---------------------------------------------------------------------------
# 2) Icon "maskable" -- safe-zone padding so Android adaptive-icon masks
#    (circle, squircle, rounded-square, teardrop, ...) never clip the logo.
#    Content must stay inside the center ~80% -> use ~22% padding per side.
# ---------------------------------------------------------------------------
MASKABLE_SIZES = [48, 72, 96, 144, 192, 384, 512]
for s in MASKABLE_SIZES:
    save(make_icon(s, padding_ratio=0.22), os.path.join(ICONS_DIR, f"icon-maskable-{s}.png"))

# ---------------------------------------------------------------------------
# 3) Apple touch icons -- iOS/iPadOS Home Screen. iOS applies its own corner
#    rounding, so these must be flat, opaque squares (no built-in radius).
# ---------------------------------------------------------------------------
APPLE_SIZES = [120, 152, 167, 180]
for s in APPLE_SIZES:
    name = "apple-touch-icon.png" if s == 180 else f"apple-touch-icon-{s}x{s}.png"
    save(make_icon(s, padding_ratio=0.08), os.path.join(ICONS_DIR, name))

# ---------------------------------------------------------------------------
# 4) Favicons
# ---------------------------------------------------------------------------
save(make_icon(16, padding_ratio=0.04), os.path.join(ICONS_DIR, "favicon-16x16.png"))
save(make_icon(32, padding_ratio=0.04), os.path.join(ICONS_DIR, "favicon-32x32.png"))
save(make_icon(48, padding_ratio=0.04), os.path.join(ICONS_DIR, "favicon-48x48.png"))

ico_sizes = [16, 32, 48]
ico_images = [make_icon(s, padding_ratio=0.04) for s in ico_sizes]
ico_images[0].save(
    os.path.join(ROOT, "public", "favicon.ico"),
    sizes=[(s, s) for s in ico_sizes],
)
print("wrote public/favicon.ico")

# ---------------------------------------------------------------------------
# 5) Windows tiles (browserconfig.xml) -- classic "Pin to Start" on Windows.
# ---------------------------------------------------------------------------
WIN_TILES = {
    "mstile-70x70.png": 70,
    "mstile-150x150.png": 150,
    "mstile-310x310.png": 310,
}
for name, s in WIN_TILES.items():
    save(make_icon(s, padding_ratio=0.16), os.path.join(ICONS_DIR, name))

# Wide tile 310x150 needs its own (non-square) canvas.
wide = Image.new("RGB", (310, 150), SAND)
inner_h = int(150 * 0.68)
resized = logo.resize((inner_h, inner_h), Image.LANCZOS)
wide.paste(resized, ((310 - inner_h) // 2, (150 - inner_h) // 2), resized)
save(wide, os.path.join(ICONS_DIR, "mstile-310x150.png"))

# ---------------------------------------------------------------------------
# 6) iOS / iPadOS splash screens (apple-touch-startup-image).
#    One PNG per device logical size x scale factor, portrait + landscape.
#    iOS matches these via the `media` query on each <link>.
# ---------------------------------------------------------------------------
# (logical_width, logical_height, scale, device label)
DEVICES = [
    (320, 568, 2, "iphone-se1"),
    (375, 667, 2, "iphone-8"),
    (414, 736, 3, "iphone-8-plus"),
    (375, 812, 3, "iphone-x"),
    (414, 896, 2, "iphone-xr"),
    (414, 896, 3, "iphone-11-pro-max"),
    (390, 844, 3, "iphone-12-13"),
    (428, 926, 3, "iphone-12-13-pro-max"),
    (393, 852, 3, "iphone-14-15"),
    (430, 932, 3, "iphone-14-15-pro-max"),
    (402, 874, 3, "iphone-16-pro"),
    (440, 956, 3, "iphone-16-pro-max"),
    (768, 1024, 2, "ipad-10.2"),
    (834, 1194, 2, "ipad-pro-11"),
    (1024, 1366, 2, "ipad-pro-12.9"),
    (820, 1180, 2, "ipad-air-10.9"),
]


def make_splash(px_w: int, px_h: int):
    canvas = Image.new("RGB", (px_w, px_h), SAND)
    logo_size = int(min(px_w, px_h) * 0.28)
    resized = logo.resize((logo_size, logo_size), Image.LANCZOS)
    cx, cy = px_w // 2, px_h // 2
    canvas.paste(resized, (cx - logo_size // 2, cy - int(logo_size * 0.85)), resized)
    return canvas


splash_manifest = []  # (filename, media_query)
for logical_w, logical_h, scale, label in DEVICES:
    for orientation, (lw, lh) in (
        ("portrait", (logical_w, logical_h)),
        ("landscape", (logical_h, logical_w)),
    ):
        px_w, px_h = lw * scale, lh * scale
        fname = f"apple-splash-{label}-{orientation}.png"
        save(make_splash(px_w, px_h), os.path.join(SPLASH_DIR, fname))
        orient_query = "orientation: portrait" if orientation == "portrait" else "orientation: landscape"
        media = (
            f"(device-width: {lw}px) and (device-height: {lh}px) "
            f"and (-webkit-device-pixel-ratio: {scale}) and ({orient_query})"
        )
        splash_manifest.append((fname, media))

with open(os.path.join(SPLASH_DIR, "manifest.json"), "w") as f:
    import json
    json.dump(
        [{"file": f"/splash/{fname}", "media": media} for fname, media in splash_manifest],
        f,
        indent=2,
    )
print("wrote public/splash/manifest.json with", len(splash_manifest), "entries")

print("\nDone.")
