
document.addEventListener('DOMContentLoaded', function() {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var mediaControllers = [];
    var mediaPauses = [];
    document.querySelectorAll('video[data-lazy-video]').forEach(function(video) {
        var card = video.closest('.publication-image');
        var hoverOnly = video.hasAttribute('data-hover-video');
        var hovered = false, inView = false, loaded = false;
        var userPaused = false, automaticPause = false, playPending = false;
        var image = hoverOnly ? card.querySelector('img') : null;

        function showPoster() {
            if (video.dataset.poster && !video.hasAttribute('poster')) {
                video.poster = video.dataset.poster;
            }
        }
        function load() {
            if (loaded) return;
            loaded = true;
            showPoster();
            video.querySelectorAll('source[data-src]').forEach(function(source) {
                source.src = source.dataset.src;
            });
            video.preload = reducedMotion.matches || (navigator.connection && navigator.connection.saveData) ? 'metadata' : 'auto';
            video.load();
        }
        function active() {
            return inView && !document.hidden && (!hoverOnly || hovered);
        }
        function pause() {
            if (!video.paused) {
                automaticPause = true;
                video.pause();
            }
        }
        function sync() {
            if (!active()) { pause(); return; }
            load();
            var saveData = navigator.connection && navigator.connection.saveData;
            if (reducedMotion.matches || saveData) video.controls = true;
            if (reducedMotion.matches || saveData || userPaused || playPending || !video.paused) return;
            playPending = true;
            video.play().catch(function(error) {
                // Keep a manual play control if browser autoplay is unavailable.
                if (error.name !== 'AbortError') video.controls = true;
            }).finally(function() { playPending = false; });
        }
        video.addEventListener('pause', function() {
            if (automaticPause) { automaticPause = false; return; }
            if (active()) userPaused = true;
        });
        video.addEventListener('play', function() {
            userPaused = false;
            if (!active()) pause();
        });
        video.addEventListener('canplay', sync);
        if (hoverOnly) {
            card.addEventListener('mouseenter', function() {
                hovered = true;
                video.style.display = 'inline-block';
                if (image) image.style.display = 'none';
                sync();
            });
            card.addEventListener('mouseleave', function() {
                hovered = false;
                video.style.display = 'none';
                if (image) image.style.display = 'block';
                sync();
            });
        }
        if ('IntersectionObserver' in window) {
            // Only lightweight posters are prepared ahead of scrolling.
            var posterObserver = new IntersectionObserver(function(entries) {
                if (!entries[0].isIntersecting) return;
                showPoster();
                posterObserver.disconnect();
            }, { rootMargin: '250px 0px' });
            posterObserver.observe(card);
            new IntersectionObserver(function(entries) {
                inView = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.1;
                sync();
            }, { threshold: [0, 0.1] }).observe(hoverOnly ? card : video);
        } else {
            // Older browsers keep the same behavior without eager downloads.
            var checkPosition = function() {
                var rect = card.getBoundingClientRect();
                inView = rect.bottom > 0 && rect.top < window.innerHeight;
                if (rect.bottom > -250 && rect.top < window.innerHeight + 250) showPoster();
                sync();
            };
            window.addEventListener('scroll', checkPosition, { passive: true });
            window.addEventListener('resize', checkPosition);
            checkPosition();
        }
        mediaControllers.push(sync);
        mediaPauses.push(pause);
    });
    function syncMedia() { mediaControllers.forEach(function(sync) { sync(); }); }
    document.addEventListener('visibilitychange', syncMedia);
    window.addEventListener('pagehide', function() {
        mediaPauses.forEach(function(pause) { pause(); });
    });
    window.addEventListener('pageshow', syncMedia);
    reducedMotion.addEventListener('change', function() {
        if (reducedMotion.matches) mediaPauses.forEach(function(pause) { pause(); });
        syncMedia();
    });
    document.querySelectorAll('.publication-image-agentic').forEach(function(card) {
        var video = card.querySelector('video');
        var steps = Array.from(card.querySelectorAll('.teaser-caption-step'));
        var phases = Array.from(card.querySelectorAll('.teaser-phases span'));
        if (!video || !steps.length) return;
        var previous = null;
        function updateCaption(time) {
            var seconds = typeof time === 'number' ? time : video.currentTime;
            var active = steps[0];
            steps.forEach(function(step) {
                if (seconds >= Number(step.dataset.start)) active = step;
            });
            if (active === previous) return;
            previous = active;
            steps.forEach(function(step) { step.hidden = step !== active; });
            phases.forEach(function(phase, index) {
                var selected = index === Number(active.dataset.phase);
                phase.classList.toggle('is-active', selected);
                if (selected) phase.setAttribute('aria-current', 'step');
                else phase.removeAttribute('aria-current');
            });
        }
        ['loadedmetadata', 'timeupdate', 'seeking', 'seeked'].forEach(function(event) {
            video.addEventListener(event, updateCaption);
        });
        updateCaption();
        if (video.requestVideoFrameCallback) {
            video.requestVideoFrameCallback(function onFrame(now, metadata) {
                updateCaption(metadata.mediaTime);
                video.requestVideoFrameCallback(onFrame);
            });
        }
    });

    function setupAuthorToggles() {
        document.querySelectorAll('.publication-authors').forEach(function(container) {
            var list = container.querySelector('.authors-list');
            var toggle = container.querySelector('.authors-toggle');
            if (!list || !toggle) return;
            // Don't re-measure an expanded list: it's intentionally unclamped.
            if (container.classList.contains('is-expanded')) return;
            // Measure overflow against the clamped (2-line) height. Web fonts
            // load asynchronously, so this must be re-run after fonts are ready.
            var overflowing = list.scrollHeight - list.clientHeight > 2;
            toggle.hidden = !overflowing;
        });
    }

    document.addEventListener('click', function(event) {
        var toggle = event.target.closest('.authors-toggle');
        if (!toggle) return;
        var container = toggle.closest('.publication-authors');
        var expanded = container.classList.toggle('is-expanded');
        toggle.textContent = expanded ? 'Show less' : 'Show all authors';
    });

    setupAuthorToggles();

    // Overflow depends on the final web font metrics, which arrive after
    // DOMContentLoaded. Re-run once everything (fonts/images) has loaded and
    // again when the font set reports ready, so toggles appear reliably.
    window.addEventListener('load', setupAuthorToggles);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(setupAuthorToggles);
    }

    var resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setupAuthorToggles, 150);
    });
});
