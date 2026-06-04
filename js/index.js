
$(document).ready(function() {
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
            var overflowing = list.scrollHeight - list.clientHeight > 2;
            if (overflowing && !container.classList.contains('is-expanded')) {
                toggle.hidden = false;
            } else if (!container.classList.contains('is-expanded')) {
                toggle.hidden = true;
            }
        });
    }

    $(document).on('click', '.authors-toggle', function() {
        var container = $(this).closest('.publication-authors')[0];
        var expanded = container.classList.toggle('is-expanded');
        this.textContent = expanded ? 'Show less' : 'Show all authors';
    });

    setupAuthorToggles();
    var resizeTimer;
    $(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setupAuthorToggles, 150);
    });
})
