    (function () {
      document.querySelectorAll('[data-slideshow]').forEach(function (root) {
        var slides = root.querySelectorAll('.slide');
        var dots = root.querySelectorAll('.dot');
        var prevBtn = root.querySelector('.slide-nav.prev');
        var nextBtn = root.querySelector('.slide-nav.next');
        var current = 0;
        var timer = null;
        var delay = parseInt(root.getAttribute('data-autoplay'), 10) || 0;

        function show(i) {
          current = (i + slides.length) % slides.length;
          slides.forEach(function (s, si) { s.classList.toggle('active', si === current); });
          dots.forEach(function (d, di) { d.classList.toggle('active', di === current); });
        }

        function next() { show(current + 1); }
        function prev() { show(current - 1); }

        function startAutoplay() {
          if (!delay || slides.length < 2) return;
          stopAutoplay();
          timer = setInterval(next, delay);
        }
        function stopAutoplay() {
          if (timer) { clearInterval(timer); timer = null; }
        }

        if (nextBtn) nextBtn.addEventListener('click', function () { next(); startAutoplay(); });
        if (prevBtn) prevBtn.addEventListener('click', function () { prev(); startAutoplay(); });
        dots.forEach(function (d) {
          d.addEventListener('click', function () {
            show(parseInt(d.getAttribute('data-index'), 10));
            startAutoplay();
          });
        });

        root.addEventListener('mouseenter', stopAutoplay);
        root.addEventListener('mouseleave', startAutoplay);

        show(0);
        startAutoplay();
      });
    })();
 