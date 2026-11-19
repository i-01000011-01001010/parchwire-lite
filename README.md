# Parchwire Lite

A simple, free resume website. No database, no server, no build step. Your resume lives in one JSON file, the page reads it every time it loads, and updating your site means replacing a file.

It has:

- a resume page, in a clean Modern look that follows your visitor's light or dark setting (and has a small sun and moon button to switch)
- a verify page, so people can confirm that your accounts really belong to you
- an optional **Links** drop-down in the top bar
- an optional **Download** drop-down for a PDF and a Word copy of your resume

If you want an admin screen, multiple resume versions, themes, share links and a contact form, see the full Parchwire project instead. Lite is the small version.

Built by [i-01000011-01001010](https://i-01000011-01001010.dev).

## What you edit

Everything you change is inside the `docs` folder.

| File | What it does |
| --- | --- |
| `docs/data/resume.json` | Your resume. Required. It uses the standard [JSON Resume](https://jsonresume.org/) layout. |
| `docs/data/links.json` | The Links drop-down. Leave it out or make it `[]` and the drop-down disappears. |
| `docs/data/verify.json` | The verify page. Leave it out and the Verify link disappears. |
| `docs/downloads/resume.pdf` | Your PDF. Always this exact name. |
| `docs/downloads/resume.docx` | Your Word file. Always this exact name. |
| `docs/index.html` | The title and description near the top are what link previews show. Edit them by hand. |

To update your site, replace the file and refresh the page. Nothing needs to be rebuilt. If neither download file exists, the Download drop-down is hidden. If only one exists, only that one is listed.

### Your photo

Put a picture in the `docs` folder (for example `docs/photo.jpg`), then set `"image": "photo.jpg"` in the `basics` section of `resume.json`. It shows as a small circle at the top. Leave `image` empty for no photo. The picture has to be in the site's own folder.

### links.json

A list of links, with optional headings:

```json
[
  { "heading": "Elsewhere" },
  { "label": "Code samples", "url": "https://example.com/me/code" },
  { "label": "Email me", "url": "mailto:me@example.com", "newTab": false }
]
```

Links may start with `https://`, `http://`, `mailto:` or `tel:`. Anything else is ignored.

### verify.json

A title, a short introduction, and sections of accounts. Each account has a `label`, a `value` to show, a `url`, and an optional `note`. See the sample file.

### Mistakes in the JSON

If a file has a typo (a missing comma, say), the page tells you which file and what went wrong instead of showing a blank page. A free checker such as jsonlint.com helps.

## Try it on your computer

Browsers will not read data files from a page opened straight from your disk, so use any small web server. With Python installed, run this inside the `docs` folder:

```
python -m http.server 8080
```

Then open http://localhost:8080. (With Node, `npx serve docs` does the same.)

## Put it online

Lite is only plain files, so any host that serves static files will do. You do not need Cloudflare Workers. Publish the **`docs` folder**.

- **GitHub Pages:** put this project in a GitHub repository. In the repository, open Settings, then Pages. Under "Build and deployment" choose "Deploy from a branch", pick `main` and the `/docs` folder, and save. Your site appears at the address shown.
- **Cloudflare:** the `wrangler.jsonc` file already points at `docs`. Connect your repository in the Cloudflare dashboard (Workers and Pages, Create, import a repository) with no build command, or run `npx wrangler deploy`.
- **Netlify, Vercel, Render and similar:** import the repository, leave the build command empty, and set the publish directory to `docs`.
- **Any web hosting:** upload the contents of `docs` to your site's public folder.

Using your own domain is a setting on the host you pick.

## Good to know

- **The page is drawn by JavaScript** from your JSON. Visitors see it normally. Link previews read the title and description in `docs/index.html`, so edit those. Software that does not run scripts (some search engines and applicant tracking systems) will not see your resume text, so send the PDF or Word file when you apply.
- **Search engines:** to ask them to skip your site, remove the comment marks around the `noindex` line in `docs/index.html`.
- **Caching:** the page asks the browser to check for fresh data each time. A host or CDN in front may still hold old copies for a few minutes after you replace a file. The `_headers` file asks supporting hosts not to.
- **Privacy:** everything in `docs` is public once published. Do not put anything in there you would not want a stranger to read.

## License

MIT. See `LICENSE`.
