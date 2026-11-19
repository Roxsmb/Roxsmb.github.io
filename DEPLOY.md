# Deploying the portfolio

**Status: live at <https://roxsmb.github.io/>** — published from
`Roxsmb/Roxsmb.github.io`, branch `main`, folder `/ (root)`.

The site is plain static HTML/CSS/JS. `index.html` in the repository root is
the page, and `assets/` holds every stylesheet, script, font and image. There
is no build step and no package manager.

## Layout

```
index.html                  the portfolio
404.html                    GitHub Pages not-found page
favicon.svg                 browser tab icon
robots.txt                  crawler rules + sitemap pointer
sitemap.xml                 page and image sitemap
site.webmanifest            install / mobile metadata
.nojekyll                   skip Jekyll processing on GitHub Pages
assets/
  styles.css  ship.css      layout, terminal shell, TV set
  main.js     ship.js       carousel, disc flight, film bay, dial
  fonts/                    self-hosted woff2 files
  work/                     project stills and the TFHDB cover
  *.png, *.gif, *.svg       icons, social preview, README stills
```

`README.md` and most of the animated GIFs next to the site are only used by the
repository landing page; `tailref-studio-reference-board-demo.gif` is shared
with the TailRef section of the site.

## Preview locally

Run this from the repository root:

```
python -m http.server 8099 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8099/>. Opening `index.html` straight from disk
works for everything except the film: YouTube refuses to play inside a
`file://` page (error 153), so the TV shows a local-preview slate with a link
to watch on YouTube. The http server and GitHub Pages both play it inline.

## Publish with GitHub Pages

The canonical URL, Open Graph tags, JSON-LD, sitemap and `robots.txt` all use
`https://roxsmb.github.io/`, which is a **user site** served from the root of
the repository.

1. Create a public repository named `ROXSMB.github.io`.
2. Push this folder to its `main` branch.
3. In the repository: **Settings → Pages → Build and deployment**.
4. Source: **Deploy from a branch**; Branch: **main**, folder: **/ (root)**.
5. Save and wait for the first build; the site is live at
   <https://roxsmb.github.io/>.

The `.nojekyll` file is required so GitHub Pages serves the folder verbatim
instead of running it through Jekyll.

If the repository ever gets a different name, every absolute URL in
`index.html` (canonical, `og:url`, JSON-LD, image URLs), `sitemap.xml` and
`robots.txt` must gain the `/<repo>/` path.

## When editing

- After changing `assets/styles.css`, `assets/ship.css`, `assets/main.js` or
  `assets/ship.js`, bump the `?v=` query on the matching tags in `index.html`
  so returning visitors get the new files.
- Check syntax before publishing:

  ```
  node --check assets/main.js
  node --check assets/ship.js
  ```

- Keep the film embed URL in the `data-src` of `#film-frame`; the iframe is
  created only when the DVD case is pressed, so the page makes no YouTube
  request (and sets no YouTube cookies) until then.
