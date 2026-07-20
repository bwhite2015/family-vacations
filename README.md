# Family Vacation Site

A travel blog built with Jekyll and hosted on GitHub Pages. Entries are tagged
by place and by vacation; every tagged place becomes a pin on a shared map.

**Writing entries → [WRITING-POSTS.md](WRITING-POSTS.md).** That's the one to
read on the road; it's written for the github.com browser interface.

---

## First-time setup

### 1. Push this to a GitHub repo

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### 2. Set the URL in `_config.yml`

This is the one step that breaks sites when skipped — get it wrong and every
stylesheet and image 404s.

If the repo is named **`USERNAME.github.io`**:

```yaml
baseurl: ""
url: "https://USERNAME.github.io"
```

If the repo is named **anything else** (say `vacations`):

```yaml
baseurl: "/vacations"
url: "https://USERNAME.github.io"
```

While you're in there, also set `title`, `description`, `author`, and `timezone`.

### 3. Turn on Pages

Repo **Settings** → **Pages** → under "Build and deployment", set **Source** to
**Deploy from a branch**, branch **main**, folder **/ (root)**. Save.

First build takes a couple of minutes. The URL appears on that same settings page.

### 4. Replace the placeholders

- Delete the two sample entries in `_posts/`
- Delete the placeholder SVGs in `assets/images/`
- Trim `_data/locations.yml` and `_data/trips.yml` down to your own

---

## How it fits together

```
_config.yml               site title, URL, timezone
_data/locations.yml       every taggable place + its coordinates
_data/trips.yml           every vacation
_posts/                   the entries, one Markdown file each
_drafts/TEMPLATE.md       copy this to start a new entry (not published)
assets/images/            photos
_layouts/, _includes/     page structure
assets/css/style.css      all styling
assets/js/                filtering + map behavior
```

Pages: `/` (blog), `/map/`, `/trips/`, `/locations/`, `/about/`.

### How location tagging works

GitHub Pages runs Jekyll in **safe mode**, which forbids custom plugins — so
there's no way to define a real `{% location %}` tag. The workaround:

`_includes/loc.html` renders each inline tag with a `data-loc="<id>"` attribute.
Layouts then scan the rendered HTML by splitting on that string
(`_includes/scan-locations.html`) to recover the list of places in each entry.
That single scan feeds the header tags, the listing filters, the Places page,
and the map pins.

The practical upshot: **the body text is the source of truth.** Tag a place in a
sentence and everything else follows. The `locations:` front matter field exists
only for the rare case where you want to pin an entry to a place you never
actually name in the prose.

### Where the data comes from

The map reads a JSON blob generated into `/map/` at build time, inlined in the
page rather than fetched, so it can't break from a `baseurl` mismatch. Map tiles
come from OpenStreetMap; Leaflet loads from a CDN with subresource integrity
hashes pinned.

---

## Previewing locally (optional)

Not required — you can work entirely on github.com. But if you want a local
preview, you'll need Ruby, which isn't currently installed on this machine.

Install Ruby+Devkit from [rubyinstaller.org](https://rubyinstaller.org/), then:

```bash
gem install bundler
bundle install
bundle exec jekyll serve --livereload
```

Then open <http://localhost:4000>. If `baseurl` is set to a subpath, the local
URL includes it too — e.g. <http://localhost:4000/vacations/>.

---

## Customizing the look

Colors live in the `:root` block at the top of `assets/css/style.css`. Changing
`--accent` retints the site. Dark mode follows the visitor's system setting and
has its own block below it.
