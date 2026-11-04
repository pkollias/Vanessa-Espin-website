# vanessaespin.com

Portfolio site for Vanessa Espín, built with Astro 7 from the approved Oct 29 design. [CHARTER.md](CHARTER.md) holds the scope, the facts the site may state, the design spec and the writing rules; read it before changing anything. `design-reference/` holds the approved mocks (reference only, never published) and `docs/design-enhancements.md` the polish spec built on top of them.

> **What GitHub Pages shows right now:** the "printed matter" prototype in [`prototype/printed-matter/`](prototype/printed-matter/README.md), the new design direction (Nov 4), at **https://pkollias.github.io/Vanessa-Espin-website/**. It is static and deploys on every push to `main`; the Astro site below is not deployed there for now (see the comment at the top of `.github/workflows/pages.yml` to switch back).

## See it on your Mac

Open Terminal and run:

```sh
cd ~/Desktop/Projects/Vanessa_Espin_site
npm install              # first time only
npm run dev:showcase     # the site as a visitor sees it today
```

Then open **http://localhost:4321** in your browser. Stop the server with `Ctrl+C` (or `npx astro dev stop` if it runs in the background).

| Command | What you see |
|---|---|
| `npm run dev:showcase` | The finished-looking site: open notes and missing photos are left out |
| `npm run dev` | Review mode: every open question shows in [brackets], missing photos as placeholders, and each page ends with an "Open items" list. Use it to go through the gaps with Vanessa |
| `npm run build:showcase` then `npm run preview` | The exact files that get published, served at http://localhost:4321 |

**On your phone:** with the phone on the same Wi-Fi, run `npm run dev:showcase -- --host` and open the "Network" address it prints (something like `http://192.168.1.20:4321`).

## Publish it

Both hosts build from one GitHub repository, so every push updates both. Until launch, both copies carry `noindex`, so search engines keep away from facts Vanessa hasn't confirmed; sharing the links works normally.

### 1. GitHub (and GitHub Pages)

1. Sign in at github.com and create a **new repository**, for example `vanessa-espin-site`. Leave it empty: no README, licence or .gitignore. On a free account it must be **Public** for GitHub Pages; that makes the code and its notes public too.
2. In Terminal, from the project folder:

   ```sh
   git add -A
   git commit -m "vanessaespin.com v1"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/vanessa-espin-site.git
   git push -u origin main
   ```

   When Git asks for a password, use a GitHub personal access token (GitHub → Settings → Developer settings → Personal access tokens), or install the GitHub CLI once with `brew install gh` and run `gh auth login`.
3. On GitHub: the repository's **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Open the **Actions** tab. When the "GitHub Pages" run turns green (about two minutes), the site is live at **https://YOUR-USERNAME.github.io/vanessa-espin-site/**.

### 2. Netlify

1. Sign up at netlify.com with your GitHub account.
2. **Add new project → Import an existing project → GitHub**, and pick the repository.
3. Leave every setting as it is (they come from `netlify.toml`) and press **Deploy**.
4. The site appears at a random `*.netlify.app` address. Rename it under **Project configuration → Change project name**, for example `vanessa-espin.netlify.app`.

From then on, `git add -A && git commit -m "…" && git push` updates both sites.

### 3. Launch on vanessaespin.com (later)

Follow CHARTER.md §12. The one code change: in `netlify.toml`, set the build command to `npm run build` before adding the domain. That build refuses to run while any open note or web-size stand-in image remains, so nothing unconfirmed reaches the real domain.

## Change the content

Everything the site says is in `src/content/`:

- `site.yaml`: masthead line, email, links, short bio
- `programs/*.md`: one file per program, with its poster beside it
- `brand-work/*.md`: Flywheel; Enchante is `draft: true` (review mode only) until she decides to keep it
- `pages/about.md`: the About statement, copy, portrait, artists and partners

**Adding a program:** copy `programs/iyuana.md` to `programs/<slug>.md`, set `slug` to match, put the poster and photos next to it, and edit the frontmatter. The home page, the "More programs" cards, the share image and the sitemap pick it up with no code change.

**Swapping in original images:** replace the file next to the Markdown (keep the name, or update the path). Builds list every image below the size it needs for sharp phone and laptop screens; the launch build refuses them.

**Open questions** are written inline as `{{TODO: …}}`, in text, frontmatter or YAML comments:

- A note starting with **confirm**, **check** or **verify** right after some text confirms that draft text. The showcase keeps the text and drops the note: `role: "Program & campaign {{TODO: confirm your role}}"`.
- Any other note marks missing content and must stand as a whole unit: a field, list item, credit segment, sentence or paragraph. The showcase removes the unit: `- "{{TODO: Second venue}}"`, or `Photography: {{TODO: name}}` inside a credit line. A photo that does not exist yet is written the same way in place of its path: `photo: "{{TODO: opening-night photo}}"`.

A gap note in the middle of a sentence stops the showcase build and says where it is.
