---
layout: page
title: gallery
permalink: /gallery/
description: A collection of photos.
nav: true
nav_order: 7
---

<div class="gallery">
  <div class="row row-cols-1 row-cols-md-2 g-4">
    {% if site.data.gallery.size > 0 %}
    {% assign sorted_photos = site.data.gallery | sort: "date" | reverse %}
    {% for photo in sorted_photos %}
    <div class="col">
      <div class="card h-100">
        <a href="{{ '/assets/img/gallery/' | append: photo.image | relative_url }}" target="_blank">
          <img
            src="{{ '/assets/img/gallery/' | append: photo.image | relative_url }}"
            class="card-img-top"
            alt="{{ photo.description | markdownify | strip_html | strip_newlines | escape }}"
            loading="lazy"
            {% if photo.position %}style="--crop-focus: {{ photo.position }}"{% endif %}
          />
        </a>
        <div class="card-body">
          <div class="card-text">{{ photo.description | markdownify }}</div>
          <p class="card-text"><small class="text-muted">{{ photo.date | date: "%B %-d, %Y" }}</small></p>
        </div>
      </div>
    </div>
    {% endfor %}
    {% else %}
    <p>No photos yet. Check back soon!</p>
    {% endif %}
  </div>
</div>
