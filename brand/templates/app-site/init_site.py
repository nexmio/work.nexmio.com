#!/usr/bin/env python3
"""Creates the first version of an app website in a product repo, from this template.

Run it from the product's own session, in the product's root folder:

  python3 brand/templates/app-site/init_site.py --colour green --name "Nexmio Family" --tag Family \
      --repo family.nexmio.com --domain family.nexmio.com --licence "TODO licence line"

It writes site/ (pages, css, js, images), site/CNAME and .github/workflows/pages.yml.
It refuses to run when site/ already exists. Then replace every TODO in site/index.html and site/privacy.html.
"""
import argparse
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
KIT = HERE.parents[1]                     # .../brand (the exported kit inside the product)
ap = argparse.ArgumentParser()
ap.add_argument("--colour", required=True, choices=["purple", "green", "blue", "red"])
ap.add_argument("--name", required=True, help='for example "Nexmio Family"')
ap.add_argument("--tag", required=True, help='the small tag next to the logo, for example "Family"')
ap.add_argument("--repo", required=True, help="repo name in the nexmio organisation")
ap.add_argument("--domain", required=True)
ap.add_argument("--licence", default="TODO licence line")
a = ap.parse_args()

root = Path.cwd()
site = root / "site"
if site.exists():
    sys.exit("site/ already exists. Nothing was changed.")
img_src = KIT / "preview" / "img"
need = [img_src / a.colour / "mark.png", img_src / "yellow" / "mark.png", KIT / "preview" / "brand.css"]
missing = [str(p) for p in need if not p.exists()]
if missing:
    sys.exit("The brand kit is incomplete (export it again with that colour): " + ", ".join(missing))

subs = {"@@COLOUR@@": a.colour, "@@NAME@@": a.name, "@@TAG@@": a.tag, "@@REPO@@": a.repo,
        "@@DOMAIN@@": a.domain, "@@LICENSE_LINE@@": a.licence}
def fill(text):
    for k, v in subs.items():
        text = text.replace(k, v)
    return text

(site / "img").mkdir(parents=True)
for f in (HERE / "files").iterdir():
    if f.name == "pages.yml":
        continue
    t = site / f.name
    if f.suffix in (".html", ".js", ".css"):
        t.write_text(fill(f.read_text()))
    else:
        shutil.copy2(f, t)
shutil.copy2(KIT / "preview" / "brand.css", site / "brand.css")
(site / "CNAME").write_text(a.domain)

col = img_src / a.colour
for name in ("mark.png", "favicon.ico", "banner-bg-dark.webp", "banner-bg-light.webp",
             "site-bg-native-dark-3840.webp", "site-bg-native-light-3840.webp"):
    if (col / name).exists():
        shutil.copy2(col / name, site / "img" / name)
shutil.copy2(img_src / "yellow" / "mark.png", site / "img" / "mark-nexmio.png")   # the footer logo is yellow

wf = root / ".github" / "workflows"
wf.mkdir(parents=True, exist_ok=True)
if not (wf / "pages.yml").exists():
    (wf / "pages.yml").write_text(fill((HERE / "files" / "pages.yml").read_text()))

print("Created site/, site/CNAME and .github/workflows/pages.yml.")
print("Still missing: img/og.png (1200x630), your screenshots in site/img/, and every TODO in index.html and privacy.html.")
