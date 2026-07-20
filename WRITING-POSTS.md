# Writing a post from the road

Everything below is done at **github.com** in a browser. No laptop setup, no
git commands. It works fine on a phone or tablet, though a tablet is easier.

---

## The short version

1. Upload your photos to `assets/images/`
2. Create a file in `_posts/` named `YYYY-MM-DD-short-title.md`
3. Paste the template, fill it in, commit
4. Wait ~1 minute for the site to rebuild

---

## 1. Upload the photos first

Go to the `assets/images/` folder in the repo → **Add file** → **Upload files**.
Drag your photos in (or tap to pick them on a phone), then **Commit changes**.

Name them something you'll recognize later — `moab-sunset.jpg` beats `IMG_4417.jpg`.

> **Resize before uploading if you can.** Photos straight off a phone are often
> 5–10 MB. Anything wider than about 2000px is wasted on a website, and large
> files make the page slow to load. Most phone photo apps can export a smaller
> copy.

## 2. Create the post file

From the repo home page: **Add file** → **Create new file**.

In the filename box, type:

```
_posts/2026-07-20-a-short-title.md
```

Typing `_posts/` first tells GitHub to put it in that folder.

**The date in the filename must be `YYYY-MM-DD`** — that's a hard Jekyll rule.
It sets the entry's URL.

## 3. Paste the template

Open `_drafts/TEMPLATE.md` in another tab, copy the whole thing, paste it into
your new file, and edit. The template has notes on every field.

The essentials:

```yaml
---
title: "Red Rock and a Flat Tire"
date: 2026-06-14 17:20:00 -0600
trip: southwest-2026
image: /assets/images/moab-sunset.jpg
image_alt: Sandstone walls glowing orange at sunset
author: Brian
---

We left before six...
```

Then **Commit changes** at the bottom.

---

## Setting the date and time by hand

The `date:` line controls the displayed date **and** the sort order, so you can
write an entry weeks later and have it land in the right spot.

```yaml
date: 2026-06-14 17:20:00 -0600
```

- `2026-06-14` — year, month, day
- `17:20:00` — 24-hour time (17:20 = 5:20 PM)
- `-0600` — UTC offset

Common US offsets:

| Zone | Summer (DST) | Winter |
|------|--------------|--------|
| Eastern  | `-0400` | `-0500` |
| Central  | `-0500` | `-0600` |
| Mountain | `-0600` | `-0700` |
| Pacific  | `-0700` | `-0800` |

Getting the offset slightly wrong only shifts the displayed time by an hour —
it won't break anything.

Future dates publish immediately (`future: true` is set in `_config.yml`). If
you'd rather a future-dated entry stay hidden until its date arrives, change
that to `false`.

---

## Tagging locations

Write this inline, in the middle of a real sentence:

```markdown
We spent the morning in {% include loc.html id="zion" %}.
```

That one tag does four things: links the words, adds a tag to the entry header,
lists the entry under that place, and drops a pin on the map.

**Use as many as you like in one entry.** A post covering three stops gets three
tags and three pins:

```markdown
We started in {% include loc.html id="moab" %}, drove through
{% include loc.html id="arches" %}, and camped near
{% include loc.html id="grand-canyon" %}.
```

To change the visible words without changing the place:

```markdown
Then out to {% include loc.html id="arches" text="the park" %}.
```

### Adding a place that doesn't exist yet

Open `_data/locations.yml` (pencil icon to edit) and add a block:

```yaml
telluride:
  name: Telluride
  region: Colorado, USA
  lat: 37.9375
  lng: -107.8123
```

To get the coordinates: open Google Maps, long-press (or right-click) the spot,
and tap the numbers that appear to copy them. First is `lat`, second is `lng`.

Commit that, then use `id="telluride"` in your posts.

If you mistype an id, the words show up underlined in red on the live site
instead of silently vanishing — that's your signal to fix the spelling.

---

## Tagging the vacation

The `trip:` line in the front matter files the entry under a vacation:

```yaml
trip: southwest-2026
```

It has to match a key in `_data/trips.yml`. To start a new vacation, add a block
there:

```yaml
maine-2027:
  name: Maine Coast 2027
  dates: August 2027
  blurb: Lobster rolls and a great deal of fog.
  color: "#1d4ed8"
```

Only `name` is required. `color` tints that trip's tags and map filter button.

Leave `trip:` off entirely for a one-off entry — it'll land in "Not filed under
a trip" on the Trips page.

---

## Photos

**The thumbnail is automatic.** Whatever you set as `image:` is both the big
photo at the top of the entry and the thumbnail in every listing. One field.

```yaml
image: /assets/images/moab-sunset.jpg
image_alt: Sandstone walls glowing orange at sunset
image_caption: The last of the light.
```

Always start the path with `/assets/images/`.

Extra photos in a grid at the bottom:

```yaml
gallery:
  - src: /assets/images/trailhead.jpg
    alt: The trailhead at dawn
    caption: Mile zero.
  - src: /assets/images/summit.jpg
    alt: View from the top
```

Or drop one into the middle of the text:

```markdown
![The view from the pass](/assets/images/pass.jpg)
```

---

## Fixing a mistake

Navigate to the file on github.com, click the pencil icon, edit, commit. The
site rebuilds in about a minute. To delete an entry, open the file and use the
trash icon in the toolbar.

If a change doesn't show up after a couple of minutes, check the **Actions** tab
of the repo — a failed build shows up there in red, usually because of a typo in
the front matter (a missing quote around a title with a colon in it is the
classic one).
