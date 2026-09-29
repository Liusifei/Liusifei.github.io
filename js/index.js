
$(document).ready(function() {
    document.querySelectorAll('.publication-image-agentic').forEach(function(card) {
        var video = card.querySelector('video');
        var steps = Array.from(card.querySelectorAll('.teaser-caption-step'));
        var phases = Array.from(card.querySelectorAll('.teaser-phases span'));
        if (!video || !steps.length) return;
        function updateCaption() {
            var active = steps[0];
            steps.forEach(function(step) {
                if (video.currentTime >= Number(step.dataset.start)) active = step;
            });
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
    });

    $('.publication-mousecell').mouseover(function() {
        $(this).find('video').css('display', 'inline-block');
        $(this).find('img').css('display', 'none');
    });
    $('.publication-mousecell').mouseout(function() {
        $(this).find('video').css('display', 'none');
        $(this).find('img').css('display', 'inline-block');
    });

    function setupAuthorToggles() {
        $('.publication-authors').each(function() {
            var container = this;
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

    $(document).on('click', '.authors-toggle', function() {
        var container = $(this).closest('.publication-authors')[0];
        var expanded = container.classList.toggle('is-expanded');
        this.textContent = expanded ? 'Show less' : 'Show all authors';
    });

    setupAuthorToggles();

    // Overflow depends on the final web font metrics, which arrive after
    // $(document).ready. Re-run once everything (fonts/images) has loaded and
    // again when the font set reports ready, so toggles appear reliably.
    $(window).on('load', setupAuthorToggles);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(setupAuthorToggles);
    }

    var resizeTimer;
    $(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setupAuthorToggles, 150);
    });
})
