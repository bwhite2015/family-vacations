---
# ===========================================================================
# COPY THIS WHOLE FILE to start a new entry.
#
# Save it as:  _posts/YYYY-MM-DD-some-short-title.md
# The date in the FILENAME sets the URL. The date in the FRONT MATTER below
# sets what's displayed and how entries are sorted. Keep them the same unless
# you have a reason not to.
# ===========================================================================

title: "Your title here"

# Displayed date AND sort order. Edit this freely — you can back-date an entry
# you're writing weeks later, or post-date one. Format:
#     YYYY-MM-DD HH:MM:SS ±HHMM
# The time is 24-hour. The last part is the UTC offset (-0600 = US Mountain in
# summer, -0700 in winter, -0500 US Central summer, -0800 US Pacific summer).
date: 2026-07-20 14:30:00 -0600

# Which vacation this belongs to. Must match a key in _data/trips.yml.
# Delete this line if the entry isn't part of a trip.
trip: southwest-2026

# The thumbnail in listings AND the big image at the top of the entry.
# Upload your photo to assets/images/<trip-key>/ first (a subfolder per trip,
# named to match the "trip:" key above), then point at it here.
image: /assets/images/southwest-2026/your-photo.jpg
image_alt: Short description of the photo, for screen readers
image_caption: Optional caption shown under the photo
# OPTIONAL. Where the listing thumbnail crops the photo. Defaults to "center".
# Set it only when the subject sits near an edge and the centred crop cuts it
# off. Any CSS object-position value: "center bottom", "center top", "50% 80%".
# image_position: center bottom

author: Your name

# OPTIONAL extra photos, shown in a grid at the bottom of the entry.
# Delete this whole block if you don't want a gallery.
gallery:
  - src: /assets/images/southwest-2026/another-photo.jpg
    alt: Description
    caption: Optional caption
  - src: /assets/images/southwest-2026/third-photo.jpg
    alt: Description

# OPTIONAL. Locations are normally picked up automatically from the tags you
# write in the body text below. Only use this if you want to pin the entry to a
# place you never actually name in the prose.
# locations:
#   - moab
---

Write your entry here in plain Markdown. Blank line between paragraphs.

To tag a location, drop this anywhere in a sentence — it becomes a link, shows
up as a tag in the entry header, and puts a pin on the map:

We spent the morning in {% include loc.html id="zion" %}.

The id must match a key in `_data/locations.yml`. If the place isn't in there
yet, add it there first (there are instructions at the top of that file).

You can use as many locations as you want in one entry — a post that spans
several stops just gets several tags and several pins.

To change the words shown without changing which place it points at:

Then we drove out to {% include loc.html id="arches" text="the park" %}.

## A subheading looks like this

**Bold**, *italic*, and [links](https://example.com) all work.

> A quote or an aside looks like this.

To put a photo in the middle of the text, put `{{ site.baseurl }}` in front of
the path (unlike the `image:` and `gallery:` fields above, plain text in the
body doesn't get that added automatically — skip it and the photo shows up
broken on the live site):

![Description of the photo]({{ site.baseurl }}/assets/images/southwest-2026/your-photo.jpg)

- Bullet lists
- Work fine too
