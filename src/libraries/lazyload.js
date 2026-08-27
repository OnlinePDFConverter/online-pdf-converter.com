class Lazyload {
    constructor(options, callback) {
        let element = null;
        if (typeof(options.selector) == 'string') {
            element = document.querySelector(options.selector);
        } else {
            element = options.selector;
        }

        this.observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.intersectionRatio <= 0) {
                    return;
                }
                if (entry.isIntersecting) {
                    callback(entry, this.observer);
                }
            });
        }, {
            root: options.root || null,
            rootMargin: options.rootMargin || '0px',
            threshold: options.threshold || 0
        });

        if (element instanceof NodeList) {
            element.forEach(el => {
                this.observe(el);
            })
        } else if (element instanceof Node) {
            this.observe(element);
        }
    }

    append(el) {
        this.observe(el);
    }

    observe(el) {
        this.observer.observe(el);
    }
}

export default Lazyload;