# Recova slides

A self-contained copy of the long and short presentations, with shared local assets. No installation or build step is required.

The public tutorial is served at `/robotics/recova-slides/`. On static hosting, review feedback stays in the current browser and can be shared with **Export feedback**; server sync is available only when running the included local server at the deck root.

- `index.html`: long deck, with 19 main slides and 4 appendices.
- `recova-short.html`: short overview, with 6 slides and embedded speaker notes.
- `speaker-notes.md` and `narrative-script.md`: notes and rehearsal script for the long deck.
- `SOURCES.md` and asset provenance files: research sources and media attribution.
- `assets/`: the media, fonts, runtime data, dependencies, and licenses referenced by the decks and their scripts.

## Run locally

From this folder, run:

```sh
python3 serve.py --port 8096
```

Then open:

- Long deck: http://localhost:8096/
- Short deck: http://localhost:8096/recova-short.html

Port 8096 keeps this copy separate from the original deck on port 8095. The server binds to this computer only and supports video seeking. Keep it running while presenting; stop it with Ctrl+C.

## Presentation controls

Both decks support arrow keys for navigation, **N** for notes, **P** for a synchronized presenter window, **F** for fullscreen, **V** for video playback, **B** for a black screen, and **?** for keyboard help.

In the long deck, **O** opens the overview. Arrow keys advance animation cues before changing slides; **Shift + arrow** skips directly between slides. The short deck also accepts number keys to jump to a slide. Append `#3` to either URL to start on slide 3.

## Contents and editing

Both HTML decks and their presentation code are preserved from `interview-slides/`. Edit the HTML, CSS, and JavaScript directly. Keep their relative paths and the `assets/` folder together when moving this directory.

This copy excludes build scripts, build outputs, screenshots, historical versions, the duplicate ZIP archive, unused assets, system metadata, and saved review feedback. Original source paths in the notes and provenance describe where material came from; those source repositories are not required to present.

The long deck's review controls remain available through **R**. No feedback history is bundled. Submitting new feedback with the local server creates `review/feedback.json`; remove that generated file before sharing a later copy. Browser backups are separate from the folder.

Files named `feedback-*.css` and `feedback-*.js` are presentation styles and animations loaded by the long deck, not saved review data.
