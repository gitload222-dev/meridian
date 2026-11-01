#!/usr/bin/env python3
"""Download Google Fonts woff2 (latin + cyrillic subsets) and build a local CSS file."""
import hashlib
import os
import re
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, "public", "assets", "fonts")
os.makedirs(FONT_DIR, exist_ok=True)

FAMILIES = [
    "Inter:wght@300..800",
    "Manrope:wght@300..800",
    "Unbounded:wght@300..800",
    "Playfair+Display:ital,wght@0,400..800;1,400..700",
    "Prata",
    "JetBrains+Mono:wght@300..700",
    "Oswald:wght@300..600",
    "Caveat:wght@400..700",
    "Russo+One",
    "Yeseva+One",
    "Lora:ital,wght@0,400..600;1,400..600",
]

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

KEEP = ("latin", "latin-ext", "cyrillic", "cyrillic-ext")
blocks_out = []

for fam in FAMILIES:
    url = f"https://fonts.googleapis.com/css2?family={fam}&display=swap"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    css = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
    # split into comment + @font-face chunks
    chunks = re.split(r"(?=/\* )", css)
    for chunk in chunks:
        m = re.match(r"/\* ([a-z\-]+) \*/", chunk.strip())
        if not m or m.group(1) not in KEEP:
            continue
        subset = m.group(1)
        faces = re.findall(r"@font-face\s*\{[^}]*\}", chunk)
        for face in faces:
            src = re.search(r"url\((https://[^)]+\.woff2)\)", face)
            if not src:
                continue
            remote = src.group(1)
            name = hashlib.sha1(remote.encode()).hexdigest()[:16] + ".woff2"
            dest = os.path.join(FONT_DIR, name)
            if not os.path.exists(dest):
                data = urllib.request.urlopen(
                    urllib.request.Request(remote, headers={"User-Agent": UA}),
                    timeout=30).read()
                with open(dest, "wb") as fh:
                    fh.write(data)
            face = face.replace(remote, f"assets/fonts/{name}")
            blocks_out.append(f"/* {subset} */\n" + face)

with open(os.path.join(ROOT, "public", "fonts.css"), "w", encoding="utf-8") as fh:
    fh.write("/* Local webfonts: Inter, Manrope, Unbounded, Playfair Display, Prata,\n"
             "   JetBrains Mono, Oswald, Caveat, Russo One, Yeseva One, Lora */\n\n")
    fh.write("\n\n".join(blocks_out) + "\n")

print(f"{len(blocks_out)} faces, {len(os.listdir(FONT_DIR))} files")
